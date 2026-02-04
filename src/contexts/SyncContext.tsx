import { useMsal } from '@azure/msal-react'
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

/**
 * LocalStorage keys for persisting selections
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'

/**
 * SessionStorage key for temporary provider during redirect flow
 */
const PENDING_PROVIDER_KEY = 'mealplan_pending_provider'

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
  needsReconnect: boolean

  // Cloud provider actions
  connect: (provider: CloudProvider) => Promise<void>
  getAccountInfo: () => { name: string; email: string }

  // File operations (delegated to provider)
  uploadFile: (fileInfo: FileInfo, data: string) => Promise<FileInfo>
  downloadFile: (fileInfo: FileInfo) => Promise<string>
  listFoldersAndFiles: (folder?: FolderInfo) => Promise<FolderListResult>

  // Sync actions
  selectFile: (fileInfo: FileInfo) => Promise<void>
  disconnectAndReset: () => Promise<void>
  syncNow: () => Promise<void>
  clearReconnectFlag: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { instance: msalInstance, inProgress } = useMsal()

  // Cloud provider state
  const [currentProvider, setCurrentProvider] = useState<CloudProvider | null>(
    () => {
      // Check for pending provider from redirect flow first
      const pending = sessionStorage.getItem(
        PENDING_PROVIDER_KEY
      ) as CloudProvider | null
      if (pending) {
        return pending
      }

      // Otherwise check localStorage
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
  const [needsReconnect, setNeedsReconnect] = useState(false)

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
  // Wait for MSAL to finish initializing
  const isAuthenticated = useMemo(() => {
    // Wait for MSAL to finish initializing
    if (inProgress !== 'none') {
      return false
    }

    if (!currentProvider) {
      return false
    }

    const provider = providers.get(currentProvider)
    const providerAuth = provider?.isAuthenticated() ?? false
    return providerAuth
  }, [inProgress, currentProvider, providers])

  // Get the current provider instance
  const activeProvider = useMemo(() => {
    return currentProvider ? (providers.get(currentProvider) ?? null) : null
  }, [currentProvider, providers])

  // Auto-restore provider from localStorage on mount
  // Wait for MSAL to finish initializing before checking authentication
  useEffect(() => {
    // Don't check until MSAL is done initializing
    if (inProgress !== 'none') {
      return
    }

    // If no provider saved, nothing to validate
    if (!activeProvider) {
      return
    }

    // Check if still authenticated
    const authenticated = activeProvider?.isAuthenticated() ?? false

    if (!authenticated) {
      // Not authenticated anymore, clear saved provider
      // Queue state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        localStorage.removeItem(CONNECTED_PROVIDER_KEY)
        sessionStorage.removeItem(PENDING_PROVIDER_KEY)
        setCurrentProvider(null)
      })
    } else {
      // Save to localStorage now that authentication is confirmed
      const pendingProvider = sessionStorage.getItem(PENDING_PROVIDER_KEY)
      if (pendingProvider || activeProvider) {
        const providerToSave = pendingProvider || activeProvider
        localStorage.setItem(CONNECTED_PROVIDER_KEY, providerToSave as string)
        sessionStorage.removeItem(PENDING_PROVIDER_KEY)
      }
    }
  }, [providers, inProgress, activeProvider])

  // Create SyncService instance with injected dependencies
  // Re-create when provider changes
  const syncService = useMemo(() => {
    if (!activeProvider) {
      return null
    }
    return new SyncService(activeProvider, db)
  }, [activeProvider])

  // Restore selected file from localStorage on mount
  useEffect(() => {
    const savedFile = localStorage.getItem(SELECTED_FILE_KEY)

    if (savedFile && isAuthenticated) {
      try {
        const fileInfo = JSON.parse(savedFile) as FileInfo
        // Queue state update to avoid synchronous setState in effect
        queueMicrotask(() => setSelectedFile(fileInfo))
      } catch (error) {
        console.error('Failed to restore selected file:', error)
        localStorage.removeItem(SELECTED_FILE_KEY)
      }
    }
    queueMicrotask(() => setIsInitializing(false))
  }, [isAuthenticated])

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
        setNeedsReconnect(true)
        setSyncStatus('idle')
        return
      }

      setSyncStatus('error')
      throw error
    }
  }, [syncService, selectedFile])

  // Debounced auto-sync function (waits 15 seconds after last change)
  const debouncedSync = useDebouncedCallback(async () => {
    console.log('Auto-syncing...')
    try {
      await syncNow()
    } catch (error) {
      console.error('Auto-sync failed:', error)

      // Check if token expired - if so, set reconnect flag instead of showing error
      if (isTokenExpiredError(error)) {
        setNeedsReconnect(true)
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
    // Only auto-sync if we're connected, not already syncing, and don't need reconnect
    if (
      !isAuthenticated ||
      !selectedFile ||
      syncStatus === 'syncing' ||
      needsReconnect ||
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
    needsReconnect,
    lastSyncTime,
    syncNow,
  ])

  // Connect to a specific provider (handles authentication via MSAL)
  const connect = async (provider: CloudProvider): Promise<void> => {
    const providerInstance = providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not registered`)
    }

    // Authenticate via MSAL redirect
    if (provider === CloudProvider.ONEDRIVE) {
      // Save provider to sessionStorage (temporary) so it can be restored after redirect
      // Will only be saved to localStorage after successful authentication
      sessionStorage.setItem(PENDING_PROVIDER_KEY, provider)
      setCurrentProvider(provider)
      // Trigger redirect - page will reload after authentication
      await msalInstance.loginRedirect(loginRequest)
      return // Code after this won't execute due to redirect
    }

    setCurrentProvider(provider)
    localStorage.setItem(CONNECTED_PROVIDER_KEY, provider)
  }

  // Disconnect from current provider
  const disconnect = async (): Promise<void> => {
    if (!currentProvider) {
      return
    }
    // Don't call logoutPopup - let token expire naturally on browser close
    setCurrentProvider(null)
    localStorage.removeItem(CONNECTED_PROVIDER_KEY)
  }

  // Get account info from active provider (synchronous)
  const getAccountInfo = (): { name: string; email: string } => {
    if (!activeProvider) {
      throw new Error('Not authenticated')
    }
    return activeProvider.getAccountInfo()
  }

  // Upload file using active provider
  const uploadFile = async (
    fileInfo: FileInfo,
    data: string
  ): Promise<FileInfo> => {
    if (!activeProvider) {
      throw new Error('Not authenticated')
    }
    return activeProvider.uploadFile(fileInfo, data)
  }

  // Download file using active provider
  const downloadFile = async (fileInfo: FileInfo): Promise<string> => {
    if (!activeProvider) {
      throw new Error('Not authenticated')
    }
    return activeProvider.downloadFile(fileInfo)
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
        needsReconnect,
        connect,
        getAccountInfo,
        uploadFile,
        downloadFile,
        listFoldersAndFiles,
        selectFile,
        disconnectAndReset,
        syncNow,
        clearReconnectFlag: () => setNeedsReconnect(false),
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
