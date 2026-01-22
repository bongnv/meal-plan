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
    const accounts = this.msalInstance.getAllAccounts()
    return accounts.length > 0 ? accounts[0] : null
  }

  /**
   * Check if user is authenticated with OneDrive
   */
  isAuthenticated(): boolean {
    return this.getAccount() !== null
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
    } catch {
      throw new Error(
        'Session expired. Please disconnect and reconnect to OneDrive.'
      )
    }
  }

  /**
   * Upload compressed file to OneDrive app folder
   */
  async uploadFile(fileInfo: FileInfo, data: string): Promise<void> {
    const graphClient = this.createGraphClient()

    // Compress data
    const compressedData = await compressData(data)
    const buffer =
      compressedData.buffer instanceof ArrayBuffer
        ? compressedData.buffer
        : new ArrayBuffer(0)

    // Upload to OneDrive app folder using Graph Client
    await graphClient
      .api(`/me/drive/special/approot:/${fileInfo.name}:/content`)
      .put(buffer)
  }

  /**
   * Download and decompress file from OneDrive app folder
   */
  async downloadFile(fileInfo: FileInfo): Promise<string> {
    const graphClient = this.createGraphClient()

    // Download from OneDrive app folder using Graph Client
    const response = await graphClient
      .api(`/me/drive/special/approot:/${fileInfo.name}:/content`)
      .get()

    // Response is already an ArrayBuffer
    const compressedData = new Uint8Array(response)

    // Decompress data
    const decompressedData = await decompressData(compressedData)

    return decompressedData
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
              id: remoteItem.id, // Actual item ID in owner's drive
              name: item.name,
              path: itemPath,
              isSharedWithMe: true, // Shared with me by others
              driveId: remoteItem.parentReference?.driveId, // Drive ID for navigation
            })
          } else if (remoteItem.file && item.name.endsWith('.json.gz')) {
            files.push({
              id: item.id, // Use sharing reference ID for accessing shared content
              name: item.name,
              path: itemPath,
              isSharedWithMe: true, // Shared with me by others
            })
          }
        }
      } catch (error) {
        console.warn('Failed to load shared items:', error)
        // Continue without shared items if query fails
      }
    } else {
      // List specific folder
      // Use drive ID + item ID for shared folders, path for personal folders
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
          })
        }
      }
    }

    return { folders, files }
  }
}
