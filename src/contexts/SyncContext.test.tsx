import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SyncProvider, useSyncContext } from './SyncContext'
import { CloudStorageFactory } from '../utils/storage/CloudStorageFactory'
import { CloudProvider } from '../utils/storage/CloudProvider'
import type { ICloudStorageProvider } from '../utils/storage/ICloudStorageProvider'

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

  async uploadFile(filename: string, data: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    this.uploadFileMock(filename, data)
  }

  async downloadFile(filename: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return this.downloadFileMock(filename)
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
      })

      expect(result.current.syncStatus).toBe('idle')
    })

    it('should update sync status during sync', async () => {
      mockProvider.downloadFileMock.mockResolvedValue(
        JSON.stringify({
          recipes: [],
          mealPlans: [],
          ingredients: [],
          lastModified: Date.now(),
          version: 1,
        })
      )

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      // Connect first with filename
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: 'file-1', name: 'data.json.gz', path: '/data.json.gz' })
      })

      // Trigger sync
      let syncComplete = false
      const syncPromise = act(async () => {
        await result.current.syncNow()
        syncComplete = true
      })

      // Wait for sync to complete
      await syncPromise
      
      // Verify sync completed
      expect(syncComplete).toBe(true)

      // Status should be success after completion
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
    })
  })

  describe('Manual Sync', () => {
    it('should not allow sync when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      await act(async () => {
        await expect(result.current.syncNow()).rejects.toThrow(
          'Not connected'
        )
      })
    })

    it('should trigger manual sync when connected', async () => {
      mockProvider.downloadFileMock.mockResolvedValue(
        JSON.stringify({
          recipes: [],
          mealPlans: [],
          ingredients: [],
          lastModified: Date.now(),
          version: 1,
        })
      )

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      // Connect first with filename
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: 'file-1', name: 'data.json.gz', path: '/data.json.gz' })
      })

      // Trigger manual sync
      await act(async () => {
        await result.current.syncNow()
      })

      expect(mockProvider.downloadFileMock).toHaveBeenCalledWith('/data.json.gz')
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.lastSyncTime).not.toBeNull()
    })

    it('should handle sync errors', async () => {
      mockProvider.downloadFileMock.mockRejectedValue(new Error('Sync failed'))

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      // Connect first with filename
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: 'file-1', name: 'data.json.gz', path: '/data.json.gz' })
      })

      // Trigger sync and expect error
      await act(async () => {
        await expect(result.current.syncNow()).rejects.toThrow('Sync failed')
      })

      expect(result.current.syncStatus).toBe('error')
    })
  })

  describe('Last Sync Time', () => {
    it('should update last sync time after successful sync', async () => {
      mockProvider.downloadFileMock.mockResolvedValue(
        JSON.stringify({
          recipes: [],
          mealPlans: [],
          ingredients: [],
          lastModified: Date.now(),
          version: 1,
        })
      )

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      expect(result.current.lastSyncTime).toBeNull()

      // Connect first with filename
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: 'file-1', name: 'data.json.gz', path: '/data.json.gz' })
      })

      // Then sync
      await act(async () => {
        await result.current.syncNow()
      })

      expect(result.current.lastSyncTime).not.toBeNull()
      expect(typeof result.current.lastSyncTime).toBe('number')
    })
  })

  describe('Conflicts', () => {
    it('should detect and store conflicts during sync', async () => {
      // This is a placeholder test - actual conflict detection will be tested
      // when sync logic is implemented in I3.4
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      expect(result.current.conflicts).toEqual([])
    })
  })

  describe('Reset', () => {
    it('should reset all state and disconnect', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
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
        wrapper: SyncProvider,
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

  describe('Offline Detection', () => {
    it('should handle offline scenarios gracefully', async () => {
      // Set up provider to simulate network error
      mockProvider.downloadFileMock.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: SyncProvider,
      })

      // Connect with filename
      await act(async () => {
        await result.current.connectProvider(CloudProvider.ONEDRIVE, { id: 'file-1', name: 'data.json.gz', path: '/data.json.gz' })
      })

      // Try to sync while offline
      await act(async () => {
        await expect(result.current.syncNow()).rejects.toThrow('Network error')
      })

      expect(result.current.syncStatus).toBe('error')
    })
  })
})
