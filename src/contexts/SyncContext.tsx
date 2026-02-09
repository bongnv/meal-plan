import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

import { useAppContext } from '@/contexts/AppContext'
import { db } from '@/db/database'
import { SyncService } from '@/services/syncService'
import { isTokenExpiredError } from '@/utils/errors/isTokenExpiredError'
import { CloudProvider } from '@/utils/storage/CloudProvider'
import {
  isExistingFile,
  type FileInfo,
  type ICloudStorageProvider,
} from '@/utils/storage/ICloudStorageProvider'
import { OneDriveProvider } from '@/utils/storage/providers/OneDriveProvider'

import type { IPublicClientApplication } from '@azure/msal-browser'

/**
 * LocalStorage keys for persisting selections
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'

/**
 * Sync status states.
 * idle: connected but not currently synced (unsaved changes or just connected)
 * syncing: currently performing sync
 * synced: successfully synced with no unsaved changes
 * error: last sync attempt failed (shows error state until next attempt)
 * offline: not connected to any provider or file isn't selected
 */
export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error'

/**
 * State-only interface
 */
export interface SyncState {
  provider: ICloudStorageProvider | null
  currentFile: FileInfo | null
  status: SyncStatus
}

/**
 * Operations-only interface
 */
export interface SyncOperations {
  // Connection lifecycle
  connect: (provider: CloudProvider) => Promise<void>
  getAccountInfo: () => { name: string; email: string } | null
  disconnectAndReset: () => Promise<void>

  // File operations
  selectFile: (fileInfo: FileInfo) => Promise<void>

  // Sync
  syncNow: () => Promise<void>
}

/**
 * Combined context interface
 */
interface SyncContextType extends SyncState, SyncOperations {}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
  msalInstance: IPublicClientApplication
}

export function SyncProvider({ children, msalInstance }: SyncProviderProps) {
  // Single state object for SyncState
  const [syncState, setSyncState] = useState<SyncState>(() => ({
    provider: null,
    currentFile: null,
    status: 'offline',
  }))

  // Track additional internal state (not exposed via context)
  // Use refs to avoid unnecessary re-renders
  const internalState = useRef({
    isSyncInProgress: false, // Synchronous guard against concurrent syncs
    remoteLastModified: null as number | null,
  })

  // Helper to create provider instance from enum
  const createProvider = useCallback(
    (providerType: CloudProvider): ICloudStorageProvider => {
      switch (providerType) {
        case CloudProvider.ONEDRIVE:
          return new OneDriveProvider(msalInstance)
        // Future: Add other providers here
        // case CloudProvider.GOOGLE_DRIVE:
        //   return new GoogleDriveProvider()
        // case CloudProvider.DROPBOX:
        //   return new DropboxProvider()
        default:
          throw new Error(`Provider ${providerType} is not supported`)
      }
    },
    [msalInstance]
  )

  // Compute isAuthenticated from active provider
  const isAuthenticated = useMemo(() => {
    return syncState.provider?.isAuthenticated() ?? false
  }, [syncState.provider])

  // Create SyncService instance with injected dependencies
  // Re-create when provider changes
  const syncService = useMemo(() => {
    if (!syncState.provider) {
      return null
    }
    return new SyncService(syncState.provider, db)
  }, [syncState.provider])

  // Get modal control functions from AppContext
  const { setShowWelcome, setShowFileSelection, setShowReconnectModal } =
    useAppContext()

  // Initialize on mount: restore provider and file, show appropriate modals
  useEffect(() => {
    queueMicrotask(() => {
      // Step 1: Load stored provider, show welcome if not stored
      const savedProviderType = localStorage.getItem(
        CONNECTED_PROVIDER_KEY
      ) as CloudProvider | null

      if (!savedProviderType) {
        setShowWelcome(true)
        return
      }

      // Create provider instance
      const provider = createProvider(savedProviderType)

      // Step 2: Load cached file (independent of authentication)
      const savedFileStr = localStorage.getItem(SELECTED_FILE_KEY)
      let fileInfo: FileInfo | null = null

      if (savedFileStr) {
        try {
          fileInfo = JSON.parse(savedFileStr) as FileInfo
        } catch (error) {
          console.error('Failed to restore selected file:', error)
          localStorage.removeItem(SELECTED_FILE_KEY)

          notifications.show({
            title: 'File Info Corrupted',
            message:
              'Could not restore your last selected file. Please select a file to sync.',
            color: 'yellow',
            autoClose: 5000,
          })
        }
      }

      // Step 3: Check authentication, show reconnect if not authenticated
      const authenticated = provider.isAuthenticated()
      if (!authenticated) {
        setSyncState({ provider, currentFile: fileInfo, status: 'offline' })
        setShowReconnectModal(true)
        return
      }

      // Step 4: If authenticated but no file, show file selection
      if (!fileInfo) {
        setSyncState({ provider, currentFile: null, status: 'offline' })
        setShowFileSelection(true)
        return
      }

      // Step 5: All good - set state to trigger syncing
      setSyncState({
        provider,
        currentFile: fileInfo,
        status: 'idle',
      })
    })
  }, [
    createProvider,
    setShowWelcome,
    setShowFileSelection,
    setShowReconnectModal,
  ])

  /**
   * Trigger manual sync with Last Write Wins (LWW) merge
   * Automatically resolves conflicts based on updatedAt timestamps
   */
  const syncNow = useCallback(async (): Promise<void> => {
    if (!syncService || !syncState.currentFile) {
      console.warn('Sync not available - provider or file not selected')
      return
    }

    // Prevent concurrent syncs (synchronous guard)
    if (internalState.current.isSyncInProgress) {
      console.warn('Sync already in progress, skipping')
      return
    }

    try {
      internalState.current.isSyncInProgress = true
      setSyncState(prev => ({ ...prev, status: 'syncing' }))

      // Perform sync via service
      const result = await syncService.performSync(syncState.currentFile)

      // Update currentFile if ID was generated (new file)
      if (result.updatedFileInfo && !isExistingFile(syncState.currentFile)) {
        localStorage.setItem(
          SELECTED_FILE_KEY,
          JSON.stringify(result.updatedFileInfo)
        )
        setSyncState(prev => ({
          ...prev,
          currentFile: result.updatedFileInfo!,
          status: 'synced',
        }))
      } else {
        setSyncState(prev => ({ ...prev, status: 'synced' }))
      }

      internalState.current.isSyncInProgress = false
      internalState.current.remoteLastModified = result.merged.lastModified
    } catch (error) {
      console.error('Sync failed:', error)

      internalState.current.isSyncInProgress = false

      if (isTokenExpiredError(error)) {
        setShowReconnectModal(true)
        setSyncState(prev => ({ ...prev, status: 'idle' }))
        return
      }

      setSyncState(prev => ({ ...prev, status: 'error' }))
      notifications.show({
        title: 'Sync Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sync with OneDrive. Your changes are saved locally.',
        color: 'red',
        autoClose: 5000,
      })
    }
  }, [syncService, syncState.currentFile, setShowReconnectModal])

  // Debounced auto-sync function (waits 15 seconds after last change)
  const debouncedSync = useDebouncedCallback(async () => {
    console.log('Auto-syncing...')
    await syncNow()
  }, 15000) // 15 seconds

  // Track lastModified timestamp for auto-sync trigger
  // Note: useLiveQuery returns value directly, only re-renders when value changes
  const lastModified = useLiveQuery(async () => await db.getLastModified())

  // Auto-sync: immediate first sync, then debounced sync with status updates
  useEffect(() => {
    // Only run if we're connected and have data
    if (
      !isAuthenticated ||
      !syncState.currentFile ||
      lastModified === undefined
    ) {
      return
    }

    // First sync: execute immediately
    if (internalState.current.remoteLastModified === null) {
      console.log('First sync - executing immediately')
      setTimeout(() => {
        void syncNow().catch(error => {
          console.error('First sync failed:', error)
        })
      }, 0)
      return
    }

    // Subsequent syncs: only trigger when there are unsaved changes
    if (lastModified > internalState.current.remoteLastModified) {
      // Update UI state to show unsaved changes (only re-renders if status changed)
      queueMicrotask(() =>
        setSyncState(prev =>
          prev.status === 'synced' ? { ...prev, status: 'idle' } : prev
        )
      )

      // Trigger debounced sync (waits 15s after last change)
      debouncedSync()
    }
  }, [
    lastModified,
    isAuthenticated,
    syncState.currentFile,
    debouncedSync,
    syncNow,
  ])

  // Connect to a specific provider (triggers authentication)
  const connect = async (provider: CloudProvider): Promise<void> => {
    const providerInstance = createProvider(provider)

    // Save provider type to localStorage
    localStorage.setItem(CONNECTED_PROVIDER_KEY, provider)

    // Trigger authentication (may redirect page)
    await providerInstance.authenticate()
    // Note: Code after this may not execute if provider redirects (like OneDrive)

    // Update state with authenticated provider
    setSyncState(prev => ({ ...prev, provider: providerInstance }))
  }

  // Get account info from active provider (synchronous)
  // Returns null if not authenticated
  const getAccountInfo = (): { name: string; email: string } | null => {
    if (!syncState.provider || !isAuthenticated) {
      return null
    }
    return syncState.provider.getAccountInfo()
  }

  /**
   * Select a file for sync
   * For existing files: clears local data first (remote is source of truth)
   * For new files: keeps local data (will be uploaded)
   *
   * @param fileInfo - File information for sync (persisted to localStorage)
   */
  const selectFile = async (fileInfo: FileInfo): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Provider not authenticated')
    }

    // Only clear local data if opening an existing file
    // For new files, we keep local data to upload it
    if (isExistingFile(fileInfo)) {
      await db.clearAllData()
    }

    // Update file selection
    setSyncState(prev => ({ ...prev, currentFile: fileInfo }))
    localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(fileInfo))
    // Hide file selection modal when file is selected
    setShowFileSelection(false)
  }

  /**
   * Disconnect from cloud and reset all local data
   * Clears provider connection and all local data (cloud is source of truth)
   * Auth token remains valid - no logout popup
   * Used when disconnecting or switching to a different file
   */
  const disconnectAndReset = async (): Promise<void> => {
    if (!syncState.provider) {
      return
    }

    // Clear all local data (local data is just a cache)
    await db.clearAllData()
    localStorage.clear()

    // Reset sync state (clear provider, file, and status)
    setSyncState({ provider: null, currentFile: null, status: 'offline' })
    internalState.current.remoteLastModified = null

    // Show welcome modal when disconnected
    setShowWelcome(true)
  }

  return (
    <SyncContext.Provider
      value={{
        // State
        provider: syncState.provider,
        currentFile: syncState.currentFile,
        status: syncState.status,
        // Operations
        connect,
        getAccountInfo,
        disconnectAndReset,
        selectFile,
        syncNow,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

/**
 * Hook to access sync context
 * Must be used within SyncProvider
 */
export function useSyncContext() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider')
  }
  return context
}
