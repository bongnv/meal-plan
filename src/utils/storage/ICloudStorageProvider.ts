/**
 * File information for cloud storage operations
 */
export interface FileInfo {
  id: string
  name: string
  path: string
}

/**
 * Interface for cloud storage providers
 * 
 * All cloud storage providers (OneDrive, Google Drive, Dropbox, etc.) must implement this interface.
 * This abstraction allows the sync logic to work with any provider without knowing implementation details.
 */
export interface ICloudStorageProvider {
  /**
   * Initiate provider-specific authentication flow
   * 
   * @throws Error if authentication fails
   */
  connect(): Promise<void>;

  /**
   * Disconnect app from provider
   * Clears authentication tokens and credentials
   */
  disconnect(): Promise<void>;

  /**
   * Check if provider is currently connected
   * Async to allow checking cached tokens without blocking
   * 
   * @returns true if authenticated and ready to sync
   */
  isConnected(): Promise<boolean>;

  /**
   * Get user account information for display in UI
   * 
   * @returns User's name and email address
   * @throws Error if not connected
   */
  getAccountInfo(): Promise<{ name: string; email: string }>;

  /**
   * Upload gzip-compressed JSON data to cloud storage
   * 
   * @param fileInfo - File metadata (id, name, path)
   * @param data - Compressed data as string
   * @throws Error if upload fails or not connected
   */
  uploadFile(fileInfo: FileInfo, data: string): Promise<void>;

  /**
   * Download and decompress JSON data from cloud storage
   * 
   * @param fileInfo - File metadata (id, name, path)
   * @returns Decompressed data as string
   * @throws Error if download fails, file not found, or not connected
   */
  downloadFile(fileInfo: FileInfo): Promise<string>;

  /**
   * List available data files in cloud storage
   * 
   * Used for file selection UI to show existing files.
   * Should list files in the app-specific folder.
   * 
   * @returns Array of file metadata
   * @throws Error if listing fails or not connected
   */
  listFiles(): Promise<Array<{
    name: string;
    lastModified: Date;
    size: number;
  }>>;
}
