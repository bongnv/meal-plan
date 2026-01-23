import { IPublicClientApplication, AccountInfo } from '@azure/msal-browser'
import { Client } from '@microsoft/microsoft-graph-client'

import { loginRequest } from '../../../config/msalConfig'
import { compressData, decompressData } from '../../compression'
import {
  ICloudStorageProvider,
  type FileInfo,
  type FolderInfo,
  type FolderListResult,
} from '../ICloudStorageProvider'

/**
 * OneDrive storage provider implementation
 *
 * Handles file operations with OneDrive using Microsoft Graph API.
 * Authentication is managed by CloudStorageContext via MSAL.
 *
 * This provider is stateless and always queries MSAL for current authentication state.
 */
export class OneDriveProvider implements ICloudStorageProvider {
  private msalInstance: IPublicClientApplication

  constructor(msalInstance: IPublicClientApplication) {
    this.msalInstance = msalInstance
  }

  /**
   * Get the current authenticated account from MSAL
   * @private
   */
  private getAccount(): AccountInfo | null {
    try {
      const accounts = this.msalInstance.getAllAccounts()
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.warn('[OneDrive] MSAL not ready yet:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated with OneDrive
   */
  isAuthenticated(): boolean {
    const account = this.getAccount()
    return account !== null
  }

  /**
   * Get account information for the authenticated user
   *
   * @returns Account name and email
   * @throws Error if not authenticated
   */
  getAccountInfo(): { name: string; email: string } {
    const account = this.getAccount()
    if (!account) {
      throw new Error('Not authenticated')
    }

    return {
      name: account.name || account.username,
      email: account.username,
    }
  }

  /**
   * Create Microsoft Graph Client with authentication provider
   * @private
   */
  private createGraphClient(): Client {
    return Client.init({
      authProvider: async done => {
        try {
          const token = await this.getAccessToken()
          done(null, token)
        } catch (error) {
          done(error as Error, null)
        }
      },
    })
  }

  /**
   * Get access token for Microsoft Graph API
   *
   * Uses silent token acquisition. If the token is expired or missing,
   * user must disconnect and reconnect to OneDrive.
   *
   * @private
   */
  private async getAccessToken(): Promise<string> {
    const account = this.getAccount()
    if (!account) {
      throw new Error('Not authenticated. Please connect first.')
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      })
      return response.accessToken
    } catch (error) {
      console.error('[OneDrive] Token acquisition failed:', error)
      throw new Error(
        'Session expired. Please disconnect and reconnect to OneDrive.'
      )
    }
  }

  /**
   * Build Graph API path for a file
   * Ensures consistent path format across all file operations
   * Handles both personal and shared files
   * @private
   */
  private getFilePath(fileInfo: FileInfo): string {
    // For shared files, use driveId + itemId if available (files inside shared folders),
    // otherwise use sharing reference ID (files shared directly at root)
    if (fileInfo.isSharedWithMe) {
      if (fileInfo.driveId) {
        // File inside a shared folder - use drive ID + item ID
        return `/drives/${fileInfo.driveId}/items/${fileInfo.id}/content`
      }
      // File shared directly at root - use sharing reference ID
      return `/me/drive/items/${fileInfo.id}/content`
    }

    // For personal files, use path-based access
    // Path should start with "/" (e.g., "/file.json.gz" or "/folder/file.json.gz")
    return `/me/drive/root:${fileInfo.path}:/content`
  }

  /**
   * Upload compressed file to OneDrive
   */
  async uploadFile(fileInfo: FileInfo, data: string): Promise<FileInfo> {
    const graphClient = this.createGraphClient()

    // Compress data (returns Blob ready for upload)
    const compressedBlob = await compressData(data)

    // Upload to OneDrive using the file's path
    const uploadPath = this.getFilePath(fileInfo)

    const response = await graphClient.api(uploadPath).put(compressedBlob)

    // Return updated FileInfo with actual ID from OneDrive
    return {
      id: response.id,
      name: response.name,
      path: fileInfo.path,
      isSharedWithMe: fileInfo.isSharedWithMe,
    }
  }

  /**
   * Download and decompress file from OneDrive
   */
  async downloadFile(fileInfo: FileInfo): Promise<string> {
    const graphClient = this.createGraphClient()

    // Download from OneDrive using the file's path
    const downloadPath = this.getFilePath(fileInfo)
    const response = await graphClient.api(downloadPath).get()

    // Decompress the stream directly
    if (!(response instanceof ReadableStream)) {
      console.error(
        '[OneDrive] Unexpected response type, expected ReadableStream'
      )
      throw new Error('Unexpected response type from OneDrive API')
    }

    return await decompressData(response)
  }

  /**
   * List folders and files in a specific folder path
   *
   * @param folder - Optional folder to browse. If not provided, lists from root.
   * @returns Object with arrays of folders and files (.json.gz files only)
   */
  async listFoldersAndFiles(folder?: FolderInfo): Promise<FolderListResult> {
    const graphClient = this.createGraphClient()

    const folders: FolderInfo[] = []
    const files: FileInfo[] = []

    if (!folder) {
      // List root: combine personal drive items + shared items

      // 1. Get personal drive items (not highlighted)
      const personalResponse = await graphClient
        .api('/me/drive/root/children')
        .select('id,name,folder,file,parentReference')
        .get()

      for (const item of personalResponse.value) {
        const itemPath = `/${item.name}`

        if (item.folder) {
          folders.push({
            id: item.id,
            name: item.name,
            path: itemPath,
            isSharedWithMe: false, // Personal drive item
          })
        } else if (item.file && item.name.endsWith('.json.gz')) {
          files.push({
            id: item.id,
            name: item.name,
            path: itemPath,
            isSharedWithMe: false, // Personal drive item
          })
        }
      }

      // 2. Get shared items (folders and files shared with me by others)
      try {
        const sharedResponse = await graphClient
          .api('/me/drive/sharedWithMe')
          .select('id,name,folder,file,remoteItem')
          .get()

        for (const item of sharedResponse.value) {
          // Shared items have remoteItem property with actual item details
          const remoteItem = item.remoteItem
          if (!remoteItem) continue

          const itemPath = `/${item.name}`

          if (remoteItem.folder) {
            folders.push({
              id: remoteItem.id, // Use actual item ID from owner's drive for navigation
              name: item.name,
              path: itemPath,
              isSharedWithMe: true, // Shared with me by others
              driveId: remoteItem.parentReference?.driveId, // Drive ID for navigation
            })
          } else if (remoteItem.file && item.name.endsWith('.json.gz')) {
            files.push({
              id: item.id, // Use sharing reference ID for accessing shared content at root
              name: item.name,
              path: itemPath,
              isSharedWithMe: true, // Shared with me by others
              // Don't set driveId for root-level shared files - use sharing reference ID only
            })
          }
        }
      } catch (error) {
        console.warn('Failed to load shared items:', error)
        // Continue without shared items if query fails
      }
    } else {
      // List specific folder
      // Use driveId + itemId for shared folders (accessing owner's drive), path for personal folders
      const apiEndpoint =
        folder.isSharedWithMe && folder.driveId
          ? `/drives/${folder.driveId}/items/${folder.id}/children`
          : `/me/drive/root:${folder.path}:/children`

      const response = await graphClient
        .api(apiEndpoint)
        .select('id,name,folder,file,parentReference')
        .get()

      for (const item of response.value) {
        const itemPath = `${folder.path}/${item.name}`

        if (item.folder) {
          folders.push({
            id: item.id,
            name: item.name,
            path: itemPath,
            isSharedWithMe: folder.isSharedWithMe, // Inherit from parent folder
          })
        } else if (item.file && item.name.endsWith('.json.gz')) {
          files.push({
            id: item.id,
            name: item.name,
            path: itemPath,
            isSharedWithMe: folder.isSharedWithMe, // Inherit from parent folder
            driveId: folder.driveId, // Inherit driveId for potential metadata use
          })
        }
      }
    }

    return { folders, files }
  }
}
