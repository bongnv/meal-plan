import { PublicClientApplication } from '@azure/msal-browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OneDriveProvider } from './OneDriveProvider';

// Extend globalThis for test environment
declare const global: typeof globalThis;

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn(),
}));

// Mock compression utilities
vi.mock('../../compression', () => ({
  compressData: vi.fn((_data: string) => Promise.resolve(new Uint8Array([1, 2, 3]))),
  decompressData: vi.fn((_data: Uint8Array) => Promise.resolve('{"test":"data"}')),
}));

// Mock fetch
global.fetch = vi.fn();

describe('OneDriveProvider', () => {
  let provider: OneDriveProvider;
  let mockMsalInstance: {
    loginPopup: ReturnType<typeof vi.fn>;
    logoutPopup: ReturnType<typeof vi.fn>;
    getAllAccounts: ReturnType<typeof vi.fn>;
    acquireTokenSilent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock MSAL instance
    mockMsalInstance = {
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
      getAllAccounts: vi.fn(),
      acquireTokenSilent: vi.fn(),
    };

    (PublicClientApplication as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockMsalInstance);

    provider = new OneDriveProvider();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ICloudStorageProvider interface compliance', () => {
    it('should implement connect method', () => {
      expect(provider.connect).toBeDefined();
      expect(typeof provider.connect).toBe('function');
    });

    it('should implement disconnect method', () => {
      expect(provider.disconnect).toBeDefined();
      expect(typeof provider.disconnect).toBe('function');
    });

    it('should implement isConnected method', () => {
      expect(provider.isConnected).toBeDefined();
      expect(typeof provider.isConnected).toBe('function');
    });

    it('should implement getAccountInfo method', () => {
      expect(provider.getAccountInfo).toBeDefined();
      expect(typeof provider.getAccountInfo).toBe('function');
    });

    it('should implement uploadFile method', () => {
      expect(provider.uploadFile).toBeDefined();
      expect(typeof provider.uploadFile).toBe('function');
    });

    it('should implement downloadFile method', () => {
      expect(provider.downloadFile).toBeDefined();
      expect(typeof provider.downloadFile).toBe('function');
    });
  });

  describe('connect', () => {
    it('should authenticate user with MSAL popup', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };

      mockMsalInstance.loginPopup.mockResolvedValue({
        account: mockAccount,
      });

      await provider.connect();

      expect(mockMsalInstance.loginPopup).toHaveBeenCalledTimes(1);
      expect(provider.isConnected()).toBe(true);
    });

    it('should throw error if authentication fails', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue(new Error('Auth failed'));

      await expect(provider.connect()).rejects.toThrow('Auth failed');
      expect(provider.isConnected()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should logout user and clear account', async () => {
      // First connect
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      await provider.connect();

      // Then disconnect
      mockMsalInstance.logoutPopup.mockResolvedValue(undefined);
      await provider.disconnect();

      expect(mockMsalInstance.logoutPopup).toHaveBeenCalledTimes(1);
      expect(provider.isConnected()).toBe(false);
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(provider.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      
      await provider.connect();
      
      expect(provider.isConnected()).toBe(true);
    });
  });

  describe('getAccountInfo', () => {
    it('should return account info when connected', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount]);

      await provider.connect();
      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        name: 'Test User',
        email: 'user@example.com',
      });
    });

    it('should throw error when not connected', async () => {
      await expect(provider.getAccountInfo()).rejects.toThrow('Not connected');
    });
  });

  describe('uploadFile', () => {
    it('should compress and upload file to OneDrive', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'file-id' }),
      });

      await provider.connect();
      await provider.uploadFile('data.json.gz', '{"test":"data"}');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/drive/special/approot:/data.json.gz:/content'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error when not connected', async () => {
      await expect(provider.uploadFile('test.json.gz', 'data')).rejects.toThrow(
        'Not connected'
      );
    });

    it('should handle upload errors', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      await provider.connect();
      
      await expect(provider.uploadFile('data.json.gz', '{"test":"data"}')).rejects.toThrow(
        'Upload failed: 500 Server Error'
      );
    });
  });

  describe('downloadFile', () => {
    it('should download and decompress file from OneDrive', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      const mockArrayBuffer = new Uint8Array([1, 2, 3]).buffer;
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockArrayBuffer,
      });

      await provider.connect();
      const data = await provider.downloadFile('data.json.gz');

      expect(data).toBe('{"test":"data"}');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/drive/special/approot:/data.json.gz:/content'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error when not connected', async () => {
      await expect(provider.downloadFile('test.json.gz')).rejects.toThrow('Not connected');
    });

    it('should handle download errors', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await provider.connect();
      
      await expect(provider.downloadFile('data.json.gz')).rejects.toThrow(
        'Download failed: 404 Not Found'
      );
    });
  });
});
