/**
 * File information for cloud storage operations
 */
export interface FileInfo {
  id: string
  name: string
  path: string
  isSharedWithMe?: boolean
}

/**
 * Folder information for cloud storage browsing
 */
export interface FolderInfo {
  id: string
  name: string
  path: string
  isSharedWithMe?: boolean
  driveId?: string // For shared folders, the drive ID where the folder exists
}

/**
 * Result of listing folders and files
 */
export interface FolderListResult {
  folders: FolderInfo[]
  files: FileInfo[]
}

/**
 * Interface for cloud storage providers
 *
 * All cloud storage providers (OneDrive, Google Drive, Dropbox, etc.) must implement this interface.
 * This abstraction allows file operations to work with any provider without knowing implementation details.
 *
 * Connect/disconnect methods are handled by CloudStorageContext using MSAL.
 * Providers query MSAL for authentication state.
 */
export interface ICloudStorageProvider {
  /**
   * Check if user is authenticated with this provider
   *
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean

  /**
   * Get account information for the authenticated user
   *
   * @returns Account name and email
   * @throws Error if not authenticated
   */
  getAccountInfo(): { name: string; email: string }

  /**
   * Upload gzip-compressed JSON data to cloud storage
   *
   * @param fileInfo - File metadata (id, name, path)
   * @param data - Compressed data as string
   * @throws Error if upload fails or not connected
   */
  uploadFile(fileInfo: FileInfo, data: string): Promise<void>

  /**
   * Download and decompress JSON data from cloud storage
   *
   * @param fileInfo - File metadata (id, name, path)
   * @returns Decompressed data as string
   * @throws Error if download fails, file not found, or not connected
   */
  downloadFile(fileInfo: FileInfo): Promise<string>

  /**
   * List folders and files in a specific folder path
   *
   * Used for folder browsing UI with multi-user support.
   * Includes both owned items and items shared with user.
   *
   * @param folder - Optional folder to browse. If not provided, lists from root.
   * @returns Object with arrays of folders and files (JSON.gz files only)
   * @throws Error if listing fails or not connected
   */
  listFoldersAndFiles(folder?: FolderInfo): Promise<FolderListResult>
}
