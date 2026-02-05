import { PublicClientApplication } from '@azure/msal-browser'
import { Client } from '@microsoft/microsoft-graph-client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { decompressData } from '@/utils/compression'

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
  compressData: vi.fn(async (_data: string) =>
    Promise.resolve(new Blob([new Uint8Array([1, 2, 3])]))
  ),
  decompressData: vi.fn(async (_data: Uint8Array) =>
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

  describe('listFoldersAndFiles', () => {
    beforeEach(() => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])
      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })
    })

    it('should list root folders and files from personal drive', async () => {
      const mockPersonalResponse = {
        value: [
          {
            id: 'folder1',
            name: 'MyFolder',
            folder: {},
          },
          {
            id: 'file1',
            name: 'data.json.gz',
            file: {},
          },
          {
            id: 'file2',
            name: 'other.txt',
            file: {},
          },
        ],
      }

      const mockSharedResponse = {
        value: [],
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce(mockPersonalResponse)
        .mockResolvedValueOnce(mockSharedResponse)
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const result = await provider.listFoldersAndFiles()

      expect(result.folders).toHaveLength(1)
      expect(result.folders[0]).toEqual({
        id: 'folder1',
        name: 'MyFolder',
        path: '/MyFolder',
        isSharedWithMe: false,
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        id: 'file1',
        name: 'data.json.gz',
        path: '/data.json.gz',
        isSharedWithMe: false,
      })
    })

    it('should list root including shared items', async () => {
      const mockPersonalResponse = {
        value: [
          {
            id: 'file1',
            name: 'personal.json.gz',
            file: {},
          },
        ],
      }

      const mockSharedResponse = {
        value: [
          {
            id: 'shared-ref-1',
            name: 'SharedFolder',
            remoteItem: {
              id: 'remote-folder-id',
              folder: {},
              parentReference: {
                driveId: 'other-drive-id',
              },
            },
          },
          {
            id: 'shared-ref-2',
            name: 'shared-file.json.gz',
            remoteItem: {
              id: 'remote-file-id',
              file: {},
            },
          },
        ],
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce(mockPersonalResponse)
        .mockResolvedValueOnce(mockSharedResponse)
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const result = await provider.listFoldersAndFiles()

      expect(result.folders).toHaveLength(1)
      expect(result.folders[0]).toEqual({
        id: 'remote-folder-id',
        name: 'SharedFolder',
        path: '/SharedFolder',
        isSharedWithMe: true,
        driveId: 'other-drive-id',
      })

      expect(result.files).toHaveLength(2)
      expect(result.files[0].isSharedWithMe).toBe(false)
      expect(result.files[1]).toEqual({
        id: 'shared-ref-2',
        name: 'shared-file.json.gz',
        path: '/shared-file.json.gz',
        isSharedWithMe: true,
      })
    })

    it('should list items in a personal folder', async () => {
      const mockResponse = {
        value: [
          {
            id: 'subfolder1',
            name: 'SubFolder',
            folder: {},
          },
          {
            id: 'file1',
            name: 'nested.json.gz',
            file: {},
          },
        ],
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi.fn().mockResolvedValue(mockResponse)
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const folder = {
        id: 'folder1',
        name: 'MyFolder',
        path: '/MyFolder',
        isSharedWithMe: false,
      }

      const result = await provider.listFoldersAndFiles(folder)

      expect(mockApi).toHaveBeenCalledWith('/me/drive/root:/MyFolder:/children')
      expect(result.folders).toHaveLength(1)
      expect(result.folders[0]).toEqual({
        id: 'subfolder1',
        name: 'SubFolder',
        path: '/MyFolder/SubFolder',
        isSharedWithMe: false,
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        id: 'file1',
        name: 'nested.json.gz',
        path: '/MyFolder/nested.json.gz',
        isSharedWithMe: false,
      })
    })

    it('should list items in a shared folder using driveId', async () => {
      const mockResponse = {
        value: [
          {
            id: 'file1',
            name: 'shared-nested.json.gz',
            file: {},
          },
        ],
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi.fn().mockResolvedValue(mockResponse)
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const sharedFolder = {
        id: 'remote-folder-id',
        name: 'SharedFolder',
        path: '/SharedFolder',
        isSharedWithMe: true,
        driveId: 'other-drive-id',
      }

      const result = await provider.listFoldersAndFiles(sharedFolder)

      expect(mockApi).toHaveBeenCalledWith(
        '/drives/other-drive-id/items/remote-folder-id/children'
      )
      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        id: 'file1',
        name: 'shared-nested.json.gz',
        path: '/SharedFolder/shared-nested.json.gz',
        isSharedWithMe: true,
        driveId: 'other-drive-id',
      })
    })

    it('should handle shared items query failure gracefully', async () => {
      const mockPersonalResponse = {
        value: [
          {
            id: 'file1',
            name: 'personal.json.gz',
            file: {},
          },
        ],
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce(mockPersonalResponse)
        .mockRejectedValueOnce(new Error('Shared items not available'))
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const result = await provider.listFoldersAndFiles()

      // Should still return personal items even if shared items fail
      expect(result.files).toHaveLength(1)
      expect(result.files[0].isSharedWithMe).toBe(false)
    })

    it('should filter out non-.json.gz files', async () => {
      const mockResponse = {
        value: [
          {
            id: 'file1',
            name: 'data.json.gz',
            file: {},
          },
          {
            id: 'file2',
            name: 'document.docx',
            file: {},
          },
          {
            id: 'file3',
            name: 'image.png',
            file: {},
          },
        ],
      }

      const mockSharedResponse = { value: [] }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockSharedResponse)
      const mockApi = vi
        .fn()
        .mockReturnValue({ select: mockSelect, get: mockGet })
      mockGraphClient.api = mockApi
      mockSelect.mockReturnValue({ get: mockGet })

      const result = await provider.listFoldersAndFiles()

      expect(result.files).toHaveLength(1)
      expect(result.files[0].name).toBe('data.json.gz')
    })
  })

  describe('getAccount with MSAL not ready', () => {
    it('should handle MSAL not ready gracefully', () => {
      mockMsalInstance.getAllAccounts.mockImplementation(() => {
        throw new Error('MSAL not initialized')
      })

      expect(provider.isAuthenticated()).toBe(false)
    })
  })

  describe('getAccountInfo with fallback', () => {
    it('should use username as fallback when name is not available', () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: '',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const accountInfo = provider.getAccountInfo()

      expect(accountInfo).toEqual({
        name: 'user@example.com',
        email: 'user@example.com',
      })
    })
  })

  describe('downloadFile with invalid response type', () => {
    it('should throw error when response is not ReadableStream', async () => {
      const mockAccount = {
        homeAccountId: '123',
        environment: 'login.windows.net',
        tenantId: 'tenant-id',
        username: 'user@example.com',
        localAccountId: 'local-id',
        name: 'Test User',
      }
      mockMsalInstance.getAllAccounts.mockReturnValue([mockAccount])

      const mockGet = vi.fn().mockResolvedValue('not a stream')
      const mockApi = vi.fn().mockReturnValue({ get: mockGet })
      mockGraphClient.api = mockApi

      mockMsalInstance.acquireTokenSilent.mockResolvedValue({
        accessToken: 'mock-token',
      })

      const fileInfo = {
        id: 'test-id',
        name: 'data.json.gz',
        path: '/data.json.gz',
      }

      await expect(provider.downloadFile(fileInfo)).rejects.toThrow(
        'Unexpected response type from OneDrive API'
      )
    })
  })
})
