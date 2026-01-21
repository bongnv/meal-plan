import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SyncProvider, useSyncContext } from './SyncContext'
import { RecipeProvider } from './RecipeContext'
import { MealPlanProvider } from './MealPlanContext'
import { IngredientProvider } from './IngredientContext'
import { CloudStorageFactory } from '../utils/storage/CloudStorageFactory'
import { CloudProvider } from '../utils/storage/CloudProvider'
import type { ICloudStorageProvider } from '../utils/storage/ICloudStorageProvider'
import type { FileInfo } from '../utils/storage/ICloudStorageProvider'

// Mock cloud storage provider
class MockCloudStorageProvider implements ICloudStorageProvider {
  private connected = false
  private accountInfo = { name: 'Test User', email: 'test@example.com' }
  public uploadFileMock = vi.fn()
  public downloadFileMock = vi.fn()
  public listFilesMock = vi.fn()
  public connectMock = vi.fn()
  public disconnectMock = vi.fn()

  async connect(): Promise<void> {
    this.connectMock()
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.disconnectMock()
    this.connected = false
  }

  async isConnected(): Promise<boolean> {
    return this.connected
  }

  async getAccountInfo(): Promise<{ name: string; email: string }> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return this.accountInfo
  }

  async uploadFile(fileInfo: FileInfo, data: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return this.uploadFileMock(fileInfo.name, data)
  }

  async downloadFile(fileInfo: FileInfo): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return this.downloadFileMock(fileInfo.name)
  }

  async listFiles(): Promise<Array<{ name: string; lastModified: Date; size: number }>> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return this.listFilesMock()
  }
}

describe('SyncContext', () => {
  let mockProvider: MockCloudStorageProvider
  let factory: CloudStorageFactory

  // Wrapper component that includes all required providers
  const AllProviders = ({ children }: { children: ReactNode }) => (
    <RecipeProvider>
      <MealPlanProvider>
        <IngredientProvider>
          <SyncProvider>{children}</SyncProvider>
        </IngredientProvider>
      </MealPlanProvider>
    </RecipeProvider>
  )

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Reset and set up factory with mock provider
    factory = CloudStorageFactory.getInstance()
    factory.clearProviders()
    mockProvider = new MockCloudStorageProvider()
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider)
  })

  afterEach(() => {
    factory.clearProviders()
  })

  describe('Context Provider', () => {
    it('should provide sync context to children', () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current).toBeDefined()
      expect(result.current.connectedProvider).toBeNull()
      expect(result.current.syncStatus).toBe('idle')
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useSyncContext())
      }).toThrow('useSyncContext must be used within a SyncProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current.connectedProvider).toBeNull()
      expect(result.current.accountInfo).toBeNull()
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.lastSyncTime).toBeNull()
      expect(result.current.conflicts).toEqual([])
    })
  })

  describe('Connect Provider', () => {
    it('should connect to OneDrive provider successfully', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
      })

      expect(mockProvider.connectMock).toHaveBeenCalledOnce()
      expect(result.current.connectedProvider).toBe(CloudProvider.ONEDRIVE)
      expect(result.current.accountInfo).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      })
    })

    it('should handle connection errors', async () => {
      mockProvider.connectMock.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await expect(async () => {
        await act(async () => {
          await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
        })
      }).rejects.toThrow('Connection failed')

      expect(result.current.connectedProvider).toBeNull()
      expect(result.current.accountInfo).toBeNull()
    })

    it('should not allow connecting to unregistered provider', async () => {
      factory.clearProviders() // Remove all providers

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await expect(async () => {
        await act(async () => {
          await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
        })
      }).rejects.toThrow('Provider "onedrive" not found')
    })
  })

  describe('Disconnect Provider', () => {
    it('should disconnect from provider successfully', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // First connect
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
      })

      expect(result.current.connectedProvider).toBe(CloudProvider.ONEDRIVE)

      // Then disconnect
      await act(async () => {
        await result.current.disconnectProvider()
      })

      expect(mockProvider.disconnectMock).toHaveBeenCalledOnce()
      expect(result.current.connectedProvider).toBeNull()
      expect(result.current.accountInfo).toBeNull()
    })

    it('should handle disconnect when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Should not throw error
      await act(async () => {
        await result.current.disconnectProvider()
      })

      expect(result.current.connectedProvider).toBeNull()
    })
  })

  describe('Sync Status', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current.syncStatus).toBe('idle')
    })

    // TODO: Add test for syncNow after implementing base setup in I3.4
  })

  describe('Manual Sync', () => {
    it('should not allow sync when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await expect(result.current.syncNow()).rejects.toThrow(
          'Not connected'
        )
      })
    })

    // TODO: Add tests for successful sync after implementing base setup in I3.4
  })

  describe('Last Sync Time', () => {
    it('should start with null last sync time', () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current.lastSyncTime).toBeNull()
    })

    // TODO: Add test for lastSyncTime update after implementing base setup in I3.4
  })

  describe('Conflicts', () => {
    it('should detect and store conflicts during sync', async () => {
      // This is a placeholder test - actual conflict detection will be tested
      // when sync logic is implemented in I3.4
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current.conflicts).toEqual([])
    })
  })

  describe('Reset', () => {
    it('should reset all state and disconnect', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect and set some state
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
      })

      expect(result.current.connectedProvider).toBe(CloudProvider.ONEDRIVE)

      // Reset
      await act(async () => {
        await result.current.reset()
      })

      expect(result.current.connectedProvider).toBeNull()
      expect(result.current.accountInfo).toBeNull()
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.lastSyncTime).toBeNull()
      expect(result.current.conflicts).toEqual([])
    })
  })

  describe('Provider Switching', () => {
    it('should allow switching between providers', async () => {
      // Register a second mock provider
      const mockProvider2 = new MockCloudStorageProvider()
      factory.registerProvider(CloudProvider.GOOGLE_DRIVE, mockProvider2)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect to first provider
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: "file-1", name: "data.json.gz", path: "/data.json.gz" })
      })

      expect(result.current.connectedProvider).toBe(CloudProvider.ONEDRIVE)
      expect(mockProvider.connectMock).toHaveBeenCalledOnce()

      // Disconnect
      await act(async () => {
        await result.current.disconnectProvider()
      })

      // Connect to second provider
      await act(async () => {
        await result.current.connectProvider(CloudProvider.GOOGLE_DRIVE, { id: 'file-2', name: 'data.json.gz', path: '/data.json.gz' })
      })

      expect(result.current.connectedProvider).toBe(CloudProvider.GOOGLE_DRIVE)
      expect(mockProvider2.connectMock).toHaveBeenCalledOnce()
    })
  })

  // TODO: Add Offline Detection tests after implementing base setup in I3.4

  describe('Import from Remote', () => {
    it('should not allow import when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await expect(result.current.importFromRemote()).rejects.toThrow('Not connected')
      })
    })

    // TODO: Add more import tests after fixing RecipeContext.replaceAllRecipes console.error issue
  })

  describe('Upload to Remote', () => {
    it('should not allow upload when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await expect(result.current.uploadToRemote()).rejects.toThrow('Not connected')
      })
    })

    it('should upload local data to remote', async () => {
      mockProvider.uploadFileMock.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Upload to remote
      await act(async () => {
        await result.current.uploadToRemote()
      })

      expect(mockProvider.uploadFileMock).toHaveBeenCalledWith('data.json.gz', expect.any(String))
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.lastSyncTime).not.toBeNull()

      // Verify uploaded data structure
      const uploadedData = JSON.parse(mockProvider.uploadFileMock.mock.calls[0][1])
      expect(uploadedData).toHaveProperty('recipes')
      expect(uploadedData).toHaveProperty('mealPlans')
      expect(uploadedData).toHaveProperty('ingredients')
      expect(uploadedData).toHaveProperty('lastModified')
      expect(uploadedData).toHaveProperty('version')
    })

    it('should handle upload errors', async () => {
      mockProvider.uploadFileMock.mockRejectedValue(new Error('Upload failed'))

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Try to upload and catch error
      let error: Error | undefined
      await act(async () => {
        try {
          await result.current.uploadToRemote()
        } catch (e) {
          error = e as Error
        }
      })

      expect(error).toBeDefined()
      expect(error?.message).toBe('Upload failed')
      expect(result.current.syncStatus).toBe('error')
    })

    it('should save uploaded data as new base', async () => {
      mockProvider.uploadFileMock.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Upload to remote
      await act(async () => {
        await result.current.uploadToRemote()
      })

      // Verify base was saved
      const savedBase = localStorage.getItem('syncBase')
      expect(savedBase).not.toBeNull()
      const base = JSON.parse(savedBase!)
      expect(base).toHaveProperty('recipes')
      expect(base).toHaveProperty('mealPlans')
      expect(base).toHaveProperty('ingredients')
      expect(base).toHaveProperty('lastModified')
      expect(base).toHaveProperty('version')
    })

    it('should clear conflict context after successful upload', async () => {
      mockProvider.uploadFileMock.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Upload to remote
      await act(async () => {
        await result.current.uploadToRemote()
      })

      // Verify conflicts are cleared
      expect(result.current.conflicts).toEqual([])
    })

    it('should include current lastModified timestamp in uploaded data', async () => {
      mockProvider.uploadFileMock.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Upload to remote
      await act(async () => {
        await result.current.uploadToRemote()
      })

      // Verify uploaded data has a valid timestamp
      const uploadedData = JSON.parse(mockProvider.uploadFileMock.mock.calls[0][1])
      expect(uploadedData.lastModified).toBeGreaterThan(0)
      expect(typeof uploadedData.lastModified).toBe('number')
      // Should be within the last second (reasonable for test execution)
      expect(uploadedData.lastModified).toBeGreaterThan(Date.now() - 1000)
    })
  })
})
