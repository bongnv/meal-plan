import { PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OneDriveProvider } from './OneDriveProvider';

// Extend globalThis for test environment
declare const global: typeof globalThis;

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn(),
}));

// Mock MS Graph Client
vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: vi.fn(),
  },
}));

// Mock compression utilities
vi.mock('../../compression', () => ({
  compressData: vi.fn((_data: string) => Promise.resolve(new Uint8Array([1, 2, 3]))),
  decompressData: vi.fn((_data: Uint8Array) => Promise.resolve('{"test":"data"}')),
}));

describe('OneDriveProvider', () => {
  let provider: OneDriveProvider;
  let mockMsalInstance: {
    loginPopup: ReturnType<typeof vi.fn>;
    logoutPopup: ReturnType<typeof vi.fn>;
    getAllAccounts: ReturnType<typeof vi.fn>;
    acquireTokenSilent: ReturnType<typeof vi.fn>;
  };
  let mockGraphClient: {
    api: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock MSAL instance
    mockMsalInstance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
      getAllAccounts: vi.fn(),
      acquireTokenSilent: vi.fn(),
    };

    (PublicClientApplication as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockMsalInstance);

    // Create mock Graph Client
    const mockApi = vi.fn().mockReturnThis();
    mockGraphClient = {
      api: mockApi,
    };

    // Mock api() to return chainable object
    mockApi.mockReturnValue({
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue(new ArrayBuffer(3)),
    });

    (Client.init as ReturnType<typeof vi.fn>).mockReturnValue(mockGraphClient);

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

    it('should implement listFiles method', () => {
      expect(provider.listFiles).toBeDefined();
      expect(typeof provider.listFiles).toBe('function');
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
    it('should return false when not connected', async () => {
      expect(await provider.isConnected()).toBe(false);
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
    it('should compress and upload file to OneDrive using Graph Client', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      
      const mockPut = vi.fn().mockResolvedValue({});
      const mockApi = vi.fn().mockReturnValue({ put: mockPut });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      await provider.uploadFile('data.json.gz', '{"test":"data"}');

      expect(mockApi).toHaveBeenCalledWith('/me/drive/special/approot:/data.json.gz:/content');
      expect(mockPut).toHaveBeenCalledWith(expect.any(ArrayBuffer));
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
      
      const mockPut = vi.fn().mockRejectedValue(new Error('Upload failed'));
      const mockApi = vi.fn().mockReturnValue({ put: mockPut });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      
      await expect(provider.uploadFile('data.json.gz', '{"test":"data"}')).rejects.toThrow(
        'Upload failed'
      );
    });
  });

  describe('downloadFile', () => {
    it('should download and decompress file from OneDrive using Graph Client', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      
      const mockArrayBuffer = new Uint8Array([1, 2, 3]).buffer;
      const mockGet = vi.fn().mockResolvedValue(mockArrayBuffer);
      const mockApi = vi.fn().mockReturnValue({ get: mockGet });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      const data = await provider.downloadFile('data.json.gz');

      expect(data).toBe('{"test":"data"}');
      expect(mockApi).toHaveBeenCalledWith('/me/drive/special/approot:/data.json.gz:/content');
      expect(mockGet).toHaveBeenCalledTimes(1);
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
      
      const mockGet = vi.fn().mockRejectedValue(new Error('Download failed'));
      const mockApi = vi.fn().mockReturnValue({ get: mockGet });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      
      await expect(provider.downloadFile('data.json.gz')).rejects.toThrow(
        'Download failed'
      );
    });
  });

  describe('listFiles', () => {
    it('should list .json.gz files from OneDrive app folder', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      
      const mockFiles = {
        value: [
          {
            name: 'meal-plan-data.json.gz',
            lastModifiedDateTime: '2026-01-20T10:00:00Z',
            size: 1024,
          },
          {
            name: 'backup.json.gz',
            lastModifiedDateTime: '2026-01-19T09:00:00Z',
            size: 2048,
          },
          {
            name: 'other-file.txt',
            lastModifiedDateTime: '2026-01-18T08:00:00Z',
            size: 512,
          },
        ],
      };
      
      const mockGet = vi.fn().mockResolvedValue(mockFiles);
      const mockApi = vi.fn().mockReturnValue({ get: mockGet });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      const files = await provider.listFiles();

      expect(mockApi).toHaveBeenCalledWith('/me/drive/special/approot/children');
      expect(files).toHaveLength(2); // Only .json.gz files
      expect(files[0]).toEqual({
        name: 'meal-plan-data.json.gz',
        lastModified: new Date('2026-01-20T10:00:00Z'),
        size: 1024,
      });
      expect(files[1]).toEqual({
        name: 'backup.json.gz',
        lastModified: new Date('2026-01-19T09:00:00Z'),
        size: 2048,
      });
    });

    it('should return empty array when no .json.gz files exist', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      };
      
      const mockFiles = {
        value: [
          {
            name: 'other-file.txt',
            lastModifiedDateTime: '2026-01-18T08:00:00Z',
            size: 512,
          },
        ],
      };
      
      const mockGet = vi.fn().mockResolvedValue(mockFiles);
      const mockApi = vi.fn().mockReturnValue({ get: mockGet });
      mockGraphClient.api = mockApi;
      
      mockMsalInstance.loginPopup.mockResolvedValue({ account: mockAccount });
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      });

      await provider.connect();
      const files = await provider.listFiles();

      expect(files).toHaveLength(0);
    });

    it('should throw error when not connected', async () => {
      await expect(provider.listFiles()).rejects.toThrow('Not connected');
    });
  });
});
