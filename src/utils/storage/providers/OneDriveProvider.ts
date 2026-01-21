import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';

import { msalConfig, loginRequest } from '../../../config/msalConfig';
import { compressData, decompressData } from '../../compression';
import { ICloudStorageProvider } from '../ICloudStorageProvider';

/**
 * OneDrive storage provider implementation
 * 
 * Uses Microsoft Authentication Library (MSAL) for authentication
 * and Microsoft Graph API for file operations in OneDrive app folder.
 */
export class OneDriveProvider implements ICloudStorageProvider {
  private msalInstance: PublicClientApplication;
  private account: AccountInfo | null = null;
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  /**
   * Connect to OneDrive by authenticating with Microsoft
   */
  async connect(): Promise<void> {
    try {
      const response: AuthenticationResult = await this.msalInstance.loginPopup(loginRequest);
      this.account = response.account;
    } catch (error) {
      this.account = null;
      throw error;
    }
  }

  /**
   * Disconnect from OneDrive
   */
  async disconnect(): Promise<void> {
    if (this.account) {
      await this.msalInstance.logoutPopup();
      this.account = null;
    }
  }

  /**
   * Check if connected to OneDrive
   */
  isConnected(): boolean {
    return this.account !== null;
  }

  /**
   * Get connected account information
   */
  async getAccountInfo(): Promise<{ name: string; email: string }> {
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
  async uploadFile(filename: string, data: string): Promise<void> {
    if (!this.account) {
      throw new Error('Not connected');
    }

    // Get access token
    const token = await this.getAccessToken();

    // Compress data
    const compressedData = await compressData(data);
    const buffer = compressedData.buffer instanceof ArrayBuffer ? compressedData.buffer : new ArrayBuffer(0);

    // Upload to OneDrive app folder
    const uploadUrl = `${this.graphBaseUrl}/me/drive/special/approot:/${filename}:/content`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/gzip',
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Download and decompress file from OneDrive app folder
   */
  async downloadFile(filename: string): Promise<string> {
    if (!this.account) {
      throw new Error('Not connected');
    }

    // Get access token
    const token = await this.getAccessToken();

    // Download from OneDrive app folder
    const downloadUrl = `${this.graphBaseUrl}/me/drive/special/approot:/${filename}:/content`;
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Get compressed data
    const arrayBuffer = await response.arrayBuffer();
    const compressedData = new Uint8Array(arrayBuffer);

    // Decompress data
    const decompressedData = await decompressData(compressedData);
    
    return decompressedData;
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
