import { PublicClientApplication } from '@azure/msal-browser'
import { Client } from '@microsoft/microsoft-graph-client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { decompressData } from '../../compression'

import { OneDriveProvider } from './OneDriveProvider'

// Mock MSAL
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn(),
}))

// Mock MS Graph Client
vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: vi.fn(),
  },
}))

// Mock compression utilities
vi.mock('../../compression', () => ({
  compressData: vi.fn((_data: string) =>
    Promise.resolve(new Blob([new Uint8Array([1, 2, 3])]))
  ),
  decompressData: vi.fn((_data: Uint8Array) =>
    Promise.resolve('{"test":"data"}')
  ),
}))

describe('OneDriveProvider', () => {
  let provider: OneDriveProvider
  let mockMsalInstance: {
    initialize: ReturnType<typeof vi.fn>
    loginPopup: ReturnType<typeof vi.fn>
    logoutPopup: ReturnType<typeof vi.fn>
    getAllAccounts: ReturnType<typeof vi.fn>
    acquireTokenSilent: ReturnType<typeof vi.fn>
  }
  let mockGraphClient: {
    api: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Create mock MSAL instance
    mockMsalInstance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
      getAllAccounts: vi.fn().mockReturnValue([]),
      acquireTokenSilent: vi.fn(),
    } as any
    ;(
      PublicClientApplication as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(function () {
      return mockMsalInstance
    })

    // Create mock Graph Client that calls authProvider
    const mockApi = vi.fn().mockReturnThis()
    mockGraphClient = {
      api: mockApi,
    }

    // Mock api() to return chainable object
    mockApi.mockReturnValue({
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue(new ArrayBuffer(3)),
    })

    // Mock Client.init to capture and call the authProvider
    ;(Client.init as ReturnType<typeof vi.fn>).mockImplementation(
      (config: any) => {
        // Store authProvider for tests that need to trigger it
        if (config && config.authProvider) {
          ;(mockGraphClient as any)._authProvider = config.authProvider
        }
        return mockGraphClient
      }
    )

    provider = new OneDriveProvider(mockMsalInstance as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ICloudStorageProvider interface compliance', () => {
    it('should implement isAuthenticated method', () => {
      expect(provider.isAuthenticated).toBeDefined()
      expect(typeof provider.isAuthenticated).toBe('function')
    })

    it('should implement getAccountInfo method', () => {
      expect(provider.getAccountInfo).toBeDefined()
      expect(typeof provider.getAccountInfo).toBe('function')
    })

    it('should implement uploadFile method', () => {
      expect(provider.uploadFile).toBeDefined()
      expect(typeof provider.uploadFile).toBe('function')
    })

    it('should implement downloadFile method', () => {
      expect(provider.downloadFile).toBeDefined()
      expect(typeof provider.downloadFile).toBe('function')
    })

    it('should implement listFoldersAndFiles method', () => {
      expect(provider.listFoldersAndFiles).toBeDefined()
      expect(typeof provider.listFoldersAndFiles).toBe('function')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when no MSAL accounts exist', () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([])
      expect(provider.isAuthenticated()).toBe(false)
    })

    it('should return true when MSAL account exists', () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])
      expect(provider.isAuthenticated()).toBe(true)
    })
  })

  describe('getAccountInfo', () => {
    it('should return account info when authenticated', () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const accountInfo = provider.getAccountInfo()

      expect(accountInfo).toEqual({
        name: 'Test User',
        email: 'user@example.com',
      })
    })

    it('should throw error when not authenticated', () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([])
      expect(() => provider.getAccountInfo()).toThrow('Not authenticated')
    })
  })

  describe('uploadFile', () => {
    it('should compress and upload file to OneDrive using Graph Client', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockPut = vi.fn().mockResolvedValue({})
      const mockApi = vi.fn().mockReturnValue({ put: mockPut })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const fileInfo = {
        id: 'test-id',
        name: 'data.json.gz',
        path: '/meal-plan/data.json.gz',
      }
      await provider.uploadFile(fileInfo, '{"test":"data"}')

      expect(mockApi).toHaveBeenCalledWith(
        '/me/drive/root:/meal-plan/data.json.gz:/content'
      )
      // compressData returns a Blob, which is passed to put()
      expect(mockPut).toHaveBeenCalledWith(expect.any(Blob))
    })

    it('should handle upload errors', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockPut = vi.fn().mockRejectedValue(new Error('Upload failed'))
      const mockApi = vi.fn().mockReturnValue({ put: mockPut })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const fileInfo = {
        id: 'test-id',
        name: 'data.json.gz',
        path: '/meal-plan/data.json.gz',
      }
      await expect(
        provider.uploadFile(fileInfo, '{"test":"data"}')
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('downloadFile', () => {
    it('should download and decompress file from OneDrive using Graph Client', async () => {
      const testFileInfo = {
        id: 'test-id',
        name: 'data.json.gz',
        path: '/meal-plan/data.json.gz',
      }
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      // Create a mock ReadableStream
      const mockArrayBuffer = new Uint8Array([1, 2, 3]).buffer
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(mockArrayBuffer))
          controller.close()
        },
      })
      const mockGet = vi.fn().mockResolvedValue(mockStream)
      const mockApi = vi.fn().mockReturnValue({ get: mockGet })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const data = await provider.downloadFile(testFileInfo)

      expect(data).toBe('{"test":"data"}')
      expect(mockApi).toHaveBeenCalledWith(
        '/me/drive/root:/meal-plan/data.json.gz:/content'
      )
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('should handle download errors', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockGet = vi.fn().mockRejectedValue(new Error('Download failed'))
      const mockApi = vi.fn().mockReturnValue({ get: mockGet })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const fileInfo = {
        id: 'test-id',
        name: 'data.json.gz',
        path: '/meal-plan/data.json.gz',
      }
      await expect(provider.downloadFile(fileInfo)).rejects.toThrow(
        'Download failed'
      )
    })

    it('should use sharing reference ID for shared files', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      // Mock compressed data stream
      const mockStream = new ReadableStream()
      const mockGet = vi.fn().mockResolvedValue(mockStream)
      const mockApi = vi.fn().mockReturnValue({ get: mockGet })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      // Mock decompression
      vi.mocked(decompressData).mockResolvedValue('{"test":"data"}')

      const sharedFileAtRoot = {
        id: 'shared-id',
        name: 'shared-data.json.gz',
        path: '/shared-data.json.gz',
        isSharedWithMe: true,
        // No driveId for root-level shared files
      }
      await provider.downloadFile(sharedFileAtRoot)

      // Should use sharing reference ID for root-level shared files
      expect(mockApi).toHaveBeenCalledWith('/me/drive/items/shared-id/content')
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('should use driveId + itemId for shared files inside folders', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      // Mock compressed data stream
      const mockStream = new ReadableStream()
      const mockGet = vi.fn().mockResolvedValue(mockStream)
      const mockApi = vi.fn().mockReturnValue({ get: mockGet })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      // Mock decompression
      vi.mocked(decompressData).mockResolvedValue('{"test":"data"}')

      const sharedFileInFolder = {
        id: 'file-item-id',
        name: 'data.json.gz',
        path: '/SharedFolder/data.json.gz',
        isSharedWithMe: true,
        driveId: 'other-user-drive-id',
      }
      await provider.downloadFile(sharedFileInFolder)

      // Should use driveId + itemId for files inside shared folders
      expect(mockApi).toHaveBeenCalledWith(
        '/drives/other-user-drive-id/items/file-item-id/content'
      )
      expect(mockGet).toHaveBeenCalledTimes(1)
    })
  })

  describe('uploadFile for shared files', () => {
    it('should use sharing reference ID for shared files at root', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockPut = vi.fn().mockResolvedValue({
        id: 'uploaded-id',
        name: 'shared-data.json.gz',
      })
      const mockApi = vi.fn().mockReturnValue({ put: mockPut })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const sharedFileAtRoot = {
        id: 'shared-id',
        name: 'shared-data.json.gz',
        path: '/shared-data.json.gz',
        isSharedWithMe: true,
        // No driveId for root-level shared files
      }
      await provider.uploadFile(sharedFileAtRoot, '{"test":"data"}')

      // Should use sharing reference ID for root-level shared files
      expect(mockApi).toHaveBeenCalledWith('/me/drive/items/shared-id/content')
      expect(mockPut).toHaveBeenCalledWith(expect.any(Blob))
    })

    it('should use driveId + itemId for shared files inside folders', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockPut = vi.fn().mockResolvedValue({
        id: 'uploaded-id',
        name: 'data.json.gz',
      })
      const mockApi = vi.fn().mockReturnValue({ put: mockPut })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const sharedFileInFolder = {
        id: 'file-item-id',
        name: 'data.json.gz',
        path: '/SharedFolder/data.json.gz',
        isSharedWithMe: true,
        driveId: 'other-user-drive-id',
      }
      await provider.uploadFile(sharedFileInFolder, '{"test":"data"}')

      // Should use driveId + itemId for files inside shared folders
      expect(mockApi).toHaveBeenCalledWith(
        '/drives/other-user-drive-id/items/file-item-id/content'
      )
      expect(mockPut).toHaveBeenCalledWith(expect.any(Blob))
    })
  })
})
