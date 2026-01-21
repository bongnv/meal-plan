import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

import { msalConfig, loginRequest } from '../../../config/msalConfig';
import { compressData, decompressData } from '../../compression';
import { ICloudStorageProvider, type FileInfo } from '../ICloudStorageProvider';

/**
 * OneDrive storage provider implementation
 * 
 * Uses Microsoft Authentication Library (MSAL) for authentication
 * and Microsoft Graph Client for file operations in OneDrive app folder.
 */
export class OneDriveProvider implements ICloudStorageProvider {
  private msalInstance: PublicClientApplication;
  private account: AccountInfo | null = null;
  private graphClient: Client | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.initPromise = this.initialize();
  }

  /**
   * Initialize MSAL and restore cached account if available
   * 
   * @private
   */
  private async initialize(): Promise<void> {
    // Initialize MSAL (required before any operations)
    await this.msalInstance.initialize();
    
    // Check for cached account
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.graphClient = this.createGraphClient();
    }
  }

  /**
   * Connect to OneDrive by authenticating with Microsoft
   * Idempotent - does nothing if already connected
   */
  async connect(): Promise<void> {
    await this.initPromise;

    // Already connected, no need to authenticate again
    if (this.account !== null) {
      return;
    }

    try {
      const response: AuthenticationResult = await this.msalInstance.loginPopup(loginRequest);
      this.account = response.account;
      this.graphClient = this.createGraphClient();
    } catch (error) {
      this.account = null;
      this.graphClient = null;
      throw error;
    }
  }

  /**
   * Disconnect from OneDrive
   */
  async disconnect(): Promise<void> {
    await this.initPromise;

    if (this.account) {
      await this.msalInstance.logoutPopup();
      this.account = null;
      this.graphClient = null;
    }
  }

  /**
   * Check if connected to OneDrive
   * Returns true if account exists (restored from cache or after login)
   */
  async isConnected(): Promise<boolean> {
    await this.initPromise;
    return this.account !== null;
  }

  /**
   * Get connected account information
   */
  async getAccountInfo(): Promise<{ name: string; email: string }> {
    await this.initPromise;

    if (!this.account) {
      throw new Error('Not connected');
    }

    return {
      name: this.account.name || this.account.username,
      email: this.account.username,
    };
  }

  /**
   * Upload compressed file to OneDrive app folder
   */
  async uploadFile(fileInfo: FileInfo, data: string): Promise<void> {
    await this.initPromise;

    if (!this.graphClient) {
      throw new Error('Not connected');
    }

    // Compress data
    const compressedData = await compressData(data);
    const buffer = compressedData.buffer instanceof ArrayBuffer ? compressedData.buffer : new ArrayBuffer(0);

    // Upload to OneDrive app folder using Graph Client
    // Use fileInfo.path for the full path, or fileInfo.name for just the filename
    await this.graphClient
      .api(`/me/drive/special/approot:/${fileInfo.name}:/content`)
      .put(buffer);
  }

  /**
   * Download and decompress file from OneDrive app folder
   */
  async downloadFile(fileInfo: FileInfo): Promise<string> {
    await this.initPromise;

    if (!this.graphClient) {
      throw new Error('Not connected');
    }

    // Download from OneDrive app folder using Graph Client
    // Use fileInfo.path for the full path, or fileInfo.name for just the filename
    const response = await this.graphClient
      .api(`/me/drive/special/approot:/${fileInfo.name}:/content`)
      .get();

    // Response is already an ArrayBuffer
    const compressedData = new Uint8Array(response);

    // Decompress data
    const decompressedData = await decompressData(compressedData);
    
    return decompressedData;
  }

  /**
   * List files in OneDrive app folder
   */
  async listFiles(): Promise<Array<{ name: string; lastModified: Date; size: number }>> {
    await this.initPromise;

    if (!this.graphClient) {
      throw new Error('Not connected');
    }

    // List files in app folder
    const response = await this.graphClient
      .api('/me/drive/special/approot/children')
      .get();

    // Filter for .json.gz files and map to required format
    const files = response.value
      .filter((item: { name: string }) => item.name.endsWith('.json.gz'))
      .map((item: { name: string; lastModifiedDateTime: string; size: number }) => ({
        name: item.name,
        lastModified: new Date(item.lastModifiedDateTime),
        size: item.size,
      }));

    return files;
  }

  /**
   * Create Microsoft Graph Client with authentication provider
   * 
   * @private
   */
  private createGraphClient(): Client {
    return Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.getAccessToken();
          done(null, token);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });
  }

  /**
   * Get access token for Microsoft Graph API
   * 
   * Uses silent token acquisition only. If the token is expired or missing,
   * user must disconnect and reconnect to OneDrive.
   * 
   * @private
   */
  private async getAccessToken(): Promise<string> {
    if (!this.account) {
      throw new Error('Not connected');
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: this.account,
      });
      return response.accessToken;
    } catch {
      throw new Error('Session expired. Please disconnect and reconnect to OneDrive.');
    }
  }
}
