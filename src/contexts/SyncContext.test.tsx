import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { IngredientProvider } from './IngredientContext'
import { MealPlanProvider } from './MealPlanContext'
import { RecipeProvider } from './RecipeContext'
import { SyncProvider, useSyncContext } from './SyncContext'

import type { ReactNode } from 'react'

// Mock cloud storage functions
const mockUploadFile = vi.fn()
const mockDownloadFile = vi.fn()
const mockListFoldersAndFiles = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockGetAccountInfo = vi.fn()
let mockIsAuthenticated = false
let mockCurrentProvider: string | null = null

// Mock CloudStorageContext
vi.mock('./CloudStorageContext', () => ({
  CloudStorageProvider: ({ children }: { children: ReactNode }) => children,
  useCloudStorage: () => ({
    currentProvider: mockCurrentProvider,
    isAuthenticated: mockIsAuthenticated,
    connect: mockConnect,
    disconnect: mockDisconnect,
    getAccountInfo: mockGetAccountInfo,
    uploadFile: mockUploadFile,
    downloadFile: mockDownloadFile,
    listFoldersAndFiles: mockListFoldersAndFiles,
  }),
}))

describe('SyncContext', () => {
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

    // Reset all mocks
    vi.clearAllMocks()
    mockIsAuthenticated = false
    mockCurrentProvider = null
    mockConnect.mockResolvedValue(undefined)
    mockDisconnect.mockResolvedValue(undefined)
    mockGetAccountInfo.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
    })
    mockUploadFile.mockResolvedValue(undefined)
    mockDownloadFile.mockResolvedValue('{}')
    mockListFoldersAndFiles.mockResolvedValue({ folders: [], files: [] })
  })

  describe('Context Provider', () => {
    it('should provide sync context to children', () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      expect(result.current).toBeDefined()
      expect(result.current.selectedFile).toBeNull()
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

      expect(result.current.selectedFile).toBeNull()
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.lastSyncTime).toBeNull()
      expect(result.current.conflicts).toEqual([])
    })
  })

  describe('Connect Provider', () => {
    it('should connect to OneDrive provider successfully', async () => {
      mockIsAuthenticated = true
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await result.current.connectProvider({
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      expect(result.current.selectedFile).toEqual({
        id: 'file-1',
        name: 'data.json.gz',
        path: '/data.json.gz',
      })
    })

    it('should handle connection errors', async () => {
      mockIsAuthenticated = false

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await expect(async () => {
        await act(async () => {
          await result.current.connectProvider({
            id: 'file-1',
            name: 'data.json.gz',
            path: '/data.json.gz',
          })
        })
      }).rejects.toThrow('Provider not authenticated')

      expect(result.current.selectedFile).toBeNull()
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
        await expect(result.current.syncNow()).rejects.toThrow('Not connected')
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

  // TODO: Add Offline Detection tests after implementing base setup in I3.4

  describe('Import from Remote', () => {
    it('should not allow import when not connected', async () => {
      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      await act(async () => {
        await expect(result.current.importFromRemote()).rejects.toThrow(
          'Not connected'
        )
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
        await expect(result.current.uploadToRemote()).rejects.toThrow(
          'Not connected'
        )
      })
    })

    it('should upload local data to remote', async () => {
      mockIsAuthenticated = true
      mockCurrentProvider = 'onedrive'
      mockUploadFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider({
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        })
      })

      // Upload to remote
      await act(async () => {
        await result.current.uploadToRemote()
      })

      expect(mockUploadFile).toHaveBeenCalledWith(
        {
          id: 'file-1',
          name: 'data.json.gz',
          path: '/data.json.gz',
        },
        expect.any(String)
      )
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.lastSyncTime).not.toBeNull()

      // Verify uploaded data structure
      const uploadedData = JSON.parse(mockUploadFile.mock.calls[0][1])
      expect(uploadedData).toHaveProperty('recipes')
      expect(uploadedData).toHaveProperty('mealPlans')
      expect(uploadedData).toHaveProperty('ingredients')
      expect(uploadedData).toHaveProperty('lastModified')
      expect(uploadedData).toHaveProperty('version')
    })

    it('should handle upload errors', async () => {
      mockIsAuthenticated = true
      mockCurrentProvider = 'onedrive'
      mockUploadFile.mockRejectedValue(new Error('Upload failed'))

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider({
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
      mockIsAuthenticated = true
      mockCurrentProvider = 'onedrive'
      mockUploadFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider({
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
      mockIsAuthenticated = true
      mockCurrentProvider = 'onedrive'
      mockUploadFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider({
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
      mockIsAuthenticated = true
      mockCurrentProvider = 'onedrive'
      mockUploadFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useSyncContext(), {
        wrapper: AllProviders,
      })

      // Connect first
      await act(async () => {
        await result.current.connectProvider({
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
      const uploadedData = JSON.parse(mockUploadFile.mock.calls[0][1])
      expect(uploadedData.lastModified).toBeGreaterThan(0)
      expect(typeof uploadedData.lastModified).toBe('number')
      // Should be within the last second (reasonable for test execution)
      expect(uploadedData.lastModified).toBeGreaterThan(Date.now() - 1000)
    })
  })
})
