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
   * 
   * @returns true if authenticated and ready to sync
   */
  isConnected(): boolean;

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
   * @param filename - Name of the file to upload (e.g., 'data.json.gz')
   * @param data - Compressed data as string
   * @throws Error if upload fails or not connected
   */
  uploadFile(filename: string, data: string): Promise<void>;

  /**
   * Download and decompress JSON data from cloud storage
   * 
   * @param filename - Name of the file to download (e.g., 'data.json.gz')
   * @returns Decompressed data as string
   * @throws Error if download fails, file not found, or not connected
   */
  downloadFile(filename: string): Promise<string>;
}
