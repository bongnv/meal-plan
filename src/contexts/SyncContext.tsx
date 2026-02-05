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
  type ReactNode,
} from 'react'

import { loginRequest } from '../config/msalConfig'
import { useAppContext } from '../contexts/AppContext'
import { db } from '../db/database'
import { SyncService } from '../services/syncService'
import { isTokenExpiredError } from '../utils/errors/isTokenExpiredError'
import { CloudProvider } from '../utils/storage/CloudProvider'
import {
  isExistingFile,
  type FileInfo,
  type FolderInfo,
  type FolderListResult,
  type ICloudStorageProvider,
} from '../utils/storage/ICloudStorageProvider'
import { OneDriveProvider } from '../utils/storage/providers/OneDriveProvider'

import type { IPublicClientApplication } from '@azure/msal-browser'

/**
 * LocalStorage keys for persisting selections
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface SyncContextType {
  // Cloud provider state
  currentProvider: CloudProvider | null
  isAuthenticated: boolean

  // Sync state
  syncStatus: SyncStatus
  lastSyncTime: number | null
  selectedFile: FileInfo | null
  isInitializing: boolean

  // Cloud provider actions
  connect: (provider: CloudProvider) => Promise<void>
  getAccountInfo: () => { name: string; email: string } | null
  listFoldersAndFiles: (folder?: FolderInfo) => Promise<FolderListResult>

  // Sync actions
  selectFile: (fileInfo: FileInfo) => Promise<void>
  disconnectAndReset: () => Promise<void>
  syncNow: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
  msalInstance: IPublicClientApplication
}

export function SyncProvider({ children, msalInstance }: SyncProviderProps) {

  // Cloud provider state
  const [currentProvider, setCurrentProvider] = useState<CloudProvider | null>(
    () => {
      // Restore from localStorage
      const saved = localStorage.getItem(
        CONNECTED_PROVIDER_KEY
      ) as CloudProvider | null
      return saved
    }
  )

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Create all available providers once
  const providers = useMemo(() => {
    const map = new Map<CloudProvider, ICloudStorageProvider>()

    // Register OneDrive provider with shared MSAL instance
    map.set(CloudProvider.ONEDRIVE, new OneDriveProvider(msalInstance))

    // Future: Add other providers here
    // map.set(CloudProvider.GOOGLE_DRIVE, new GoogleDriveProvider())
    // map.set(CloudProvider.DROPBOX, new DropboxProvider())

    return map
  }, [msalInstance])

  // Compute isAuthenticated from active provider
  const isAuthenticated = useMemo(() => {
    if (!currentProvider) {
      return false
    }

    const provider = providers.get(currentProvider)
    const providerAuth = provider?.isAuthenticated() ?? false
    return providerAuth
  }, [currentProvider, providers])

  // Get the current provider instance
  const activeProvider = useMemo(() => {
    return currentProvider ? (providers.get(currentProvider) ?? null) : null
  }, [currentProvider, providers])

  // Create SyncService instance with injected dependencies
  // Re-create when provider changes
  const syncService = useMemo(() => {
    if (!activeProvider) {
      return null
    }
    return new SyncService(activeProvider, db)
  }, [activeProvider])

  // Get modal control functions from AppContext
  const { setShowWelcome, setShowFileSelection, setShowReconnectModal } =
    useAppContext()

  // Initialize on mount: restore file and show appropriate modal
  useEffect(() => {
    // Check auth state synchronously (don't add to dependencies)
    const authenticated = activeProvider?.isAuthenticated() ?? false
    let savedFile = localStorage.getItem(SELECTED_FILE_KEY)

    if (savedFile && authenticated) {
      try {
        const fileInfo = JSON.parse(savedFile) as FileInfo
        queueMicrotask(() => setSelectedFile(fileInfo))
      } catch (error) {
        console.error('Failed to restore selected file:', error)
        localStorage.removeItem(SELECTED_FILE_KEY)
        savedFile = null // Treat as no file selected

        // Notify user about corrupted file info
        notifications.show({
          title: 'File Info Corrupted',
          message:
            'Could not restore your last selected file. Please select a file to sync.',
          color: 'yellow',
          autoClose: 5000,
        })
      }
    }

    queueMicrotask(() => {
      setIsInitializing(false)

      // Show appropriate modal based on auth state
      if (!authenticated && savedFile !== null) {
        // Was previously authenticated (has saved file) but auth failed
        setShowReconnectModal(true)
      } else if (!authenticated) {
        // Never authenticated before
        setShowWelcome(true)
      } else if (savedFile === null) {
        // Authenticated but no file selected
        setShowFileSelection(true)
      }
      // else: authenticated and has file → all good, no modal
    })
  }, [activeProvider, setShowWelcome, setShowFileSelection, setShowReconnectModal])

  /**
   * Trigger manual sync with Last Write Wins (LWW) merge
   * Automatically resolves conflicts based on updatedAt timestamps
   */
  const syncNow = useCallback(async (): Promise<void> => {
    if (!syncService || !selectedFile) {
      throw new Error('Not connected')
    }

    try {
      setSyncStatus('syncing')

      // Perform sync via service
      const result = await syncService.performSync(selectedFile)

      // Update selectedFile if ID was generated (new file)
      if (result.updatedFileInfo && !isExistingFile(selectedFile)) {
        setSelectedFile(result.updatedFileInfo)
        localStorage.setItem(
          SELECTED_FILE_KEY,
          JSON.stringify(result.updatedFileInfo)
        )
      }

      setSyncStatus('synced')
      setLastSyncTime(result.merged.lastModified)
    } catch (error) {
      console.error('Sync failed:', error)

      if (isTokenExpiredError(error)) {
        setShowReconnectModal(true)
        setSyncStatus('idle')
        return
      }

      setSyncStatus('error')
      throw error
    }
  }, [syncService, selectedFile, setShowReconnectModal])

  // Debounced auto-sync function (waits 15 seconds after last change)
  const debouncedSync = useDebouncedCallback(async () => {
    console.log('Auto-syncing...')
    try {
      await syncNow()
    } catch (error) {
      console.error('Auto-sync failed:', error)

      // Check if token expired - if so, show reconnect modal instead of error notification
      if (isTokenExpiredError(error)) {
        setShowReconnectModal(true)
        setSyncStatus('idle')
        return
      }

      // For other errors, show notification
      notifications.show({
        title: 'Sync Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sync with OneDrive. Your changes are saved locally.',
        color: 'red',
        autoClose: 5000,
      })
      // Don't throw - let user continue with local data
    }
  }, 15000) // 15 seconds

  // Track lastModified timestamp for auto-sync trigger
  // Note: useLiveQuery returns value directly, only re-renders when value changes
  const lastModified = useLiveQuery(async () => await db.getLastModified())

  // Set status to 'idle' when there are unsaved changes (local differs from last sync)
  useEffect(() => {
    // Only check when status is 'synced' - don't interrupt syncing or override error
    if (!isAuthenticated || !selectedFile || syncStatus !== 'synced') {
      return
    }

    // Get current local timestamp - handle undefined from useLiveQuery
    if (lastModified === undefined || lastSyncTime === null) {
      return
    }

    // If local changed after last sync, set status to idle
    if (lastModified > lastSyncTime) {
      // Queue state update to avoid synchronous setState in effect
      queueMicrotask(() => setSyncStatus('idle'))
    }
  }, [lastModified, lastSyncTime, isAuthenticated, selectedFile, syncStatus])

  // Auto-sync: immediate first sync (lastSyncTime === null), then debounced (15s) when there are unsaved changes
  useEffect(() => {
    // Only auto-sync if we're connected, not already syncing
    if (
      !isAuthenticated ||
      !selectedFile ||
      syncStatus === 'syncing' ||
      lastModified === undefined
    ) {
      return
    }

    // First sync: lastSyncTime === null, execute immediately
    if (lastSyncTime === null) {
      console.log('First sync - executing immediately')
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        void syncNow().catch(error => {
          console.error('First sync failed:', error)
        })
      }, 0)
      return
    }

    // Subsequent syncs: only trigger when there are unsaved changes (lastModified > lastSyncTime)
    if (lastModified > lastSyncTime) {
      debouncedSync()
    }
  }, [
    lastModified,
    isAuthenticated,
    selectedFile,
    debouncedSync,
    syncStatus,
    lastSyncTime,
    syncNow,
  ])

  // Connect to a specific provider (handles authentication via MSAL)
  const connect = async (provider: CloudProvider): Promise<void> => {
    const providerInstance = providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not registered`)
    }

    // Save provider and set state
    setCurrentProvider(provider)
    localStorage.setItem(CONNECTED_PROVIDER_KEY, provider)

    // Authenticate via MSAL redirect
    if (provider === CloudProvider.ONEDRIVE) {
      // Trigger redirect - page will reload after authentication
      await msalInstance.loginRedirect(loginRequest)
      return // Code after this won't execute due to redirect
    }
    // Show file selection modal when authenticated
    setShowFileSelection(true)
  }

  // Disconnect from current provider
  const disconnect = async (): Promise<void> => {
    if (!currentProvider) {
      return
    }
    // Don't call logoutPopup - let token expire naturally on browser close
    setCurrentProvider(null)
    localStorage.removeItem(CONNECTED_PROVIDER_KEY)
    // Show welcome modal when disconnected
    setShowWelcome(true)
  }

  // Get account info from active provider (synchronous)
  // Returns null if not authenticated
  const getAccountInfo = (): { name: string; email: string } | null => {
    if (!activeProvider || !isAuthenticated) {
      return null
    }
    return activeProvider.getAccountInfo()
  }

  // List folders and files using active provider
  const listFoldersAndFiles = async (
    folder?: FolderInfo
  ): Promise<FolderListResult> => {
    if (!activeProvider) {
      throw new Error('Not authenticated')
    }
    return activeProvider.listFoldersAndFiles(folder)
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
    setSelectedFile(fileInfo)
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
    // Disconnect from provider (clears provider state, but keeps MSAL auth)
    await disconnect()

    // Clear all local storage (local data is just a cache)
    localStorage.clear()

    // Reset sync state
    setSyncStatus('idle')
    setLastSyncTime(null)
  }

  return (
    <SyncContext.Provider
      value={{
        currentProvider,
        isAuthenticated,
        syncStatus,
        lastSyncTime,
        selectedFile,
        isInitializing,
        connect,
        getAccountInfo,
        listFoldersAndFiles,
        selectFile,
        disconnectAndReset,
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
