import { useThrottledCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'

import { db } from '../db/database'
import { SyncService } from '../services/syncService'
import { isTokenExpiredError } from '../utils/errors/isTokenExpiredError'
import {
  isExistingFile,
  type FileInfo,
} from '../utils/storage/ICloudStorageProvider'

import { useCloudStorage } from './CloudStorageContext'

/**
 * LocalStorage keys
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface SyncContextType {
  // State
  syncStatus: SyncStatus
  lastSyncTime: number | null
  selectedFile: FileInfo | null
  isInitializing: boolean
  needsReconnect: boolean

  // Actions
  connectProvider: (fileInfo: FileInfo) => Promise<void>
  disconnectAndReset: () => Promise<void>
  syncNow: () => Promise<void>
  clearReconnectFlag: () => void
  hasSelectedFile: () => boolean
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  // Get cloud storage methods from context
  const cloudStorage = useCloudStorage()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  // Create SyncService instance with injected dependencies
  // Re-create when provider changes
  const syncService = useMemo(() => {
    if (!cloudStorage.providerInstance) {
      return null
    }
    return new SyncService(cloudStorage.providerInstance, db)
  }, [cloudStorage.providerInstance])

  // Restore selected file from localStorage on mount
  useEffect(() => {
    const savedFile = localStorage.getItem(SELECTED_FILE_KEY)

    if (savedFile && cloudStorage.isAuthenticated) {
      try {
        const fileInfo = JSON.parse(savedFile) as FileInfo
        setSelectedFile(fileInfo)
      } catch (error) {
        console.error('Failed to restore selected file:', error)
        localStorage.removeItem(SELECTED_FILE_KEY)
      }
    }
    setIsInitializing(false)
  }, [cloudStorage.isAuthenticated])

  /**
   * Trigger manual sync with Last Write Wins (LWW) merge
   * Automatically resolves conflicts based on updatedAt timestamps
   */
  const syncNow = async (): Promise<void> => {
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
        throw error
      }

      setSyncStatus('error')
      throw error
    }
  }

  // Throttled auto-sync function (max once per minute)
  const throttledSync = useThrottledCallback(async () => {
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
  }, 60000) // 1 minute

  // Track lastModified timestamp for auto-sync trigger
  const lastModified = useLiveQuery(() => db.getLastModified(), [])

  // Set status to 'idle' when there are unsaved changes (local differs from last sync)
  useEffect(() => {
    // Only check when status is 'synced' - don't interrupt syncing or override error
    if (
      !cloudStorage.isAuthenticated ||
      !selectedFile ||
      syncStatus !== 'synced'
    ) {
      return
    }

    // Get current local timestamp - handle undefined from useLiveQuery
    if (lastModified === undefined || lastSyncTime === null) {
      return
    }

    // If local changed after last sync, set status to idle
    if (lastModified > lastSyncTime) {
      setSyncStatus('idle')
    }
  }, [
    lastModified,
    lastSyncTime,
    cloudStorage.isAuthenticated,
    selectedFile,
    syncStatus,
  ])

  // Auto-sync: immediate on first call, throttled on subsequent data changes
  useEffect(() => {
    // Only auto-sync if we're connected, not already syncing, and don't need reconnect
    if (
      !cloudStorage.isAuthenticated ||
      !selectedFile ||
      syncStatus === 'syncing' ||
      needsReconnect
    ) {
      return
    }

    // Throttled sync (executes immediately on first call, then throttles)
    throttledSync()
  }, [
    lastModified,
    cloudStorage.isAuthenticated,
    selectedFile,
    throttledSync,
    syncStatus,
    needsReconnect,
  ])

  /**
   * Select a file for sync
   * For existing files: clears local data first (remote is source of truth)
   * For new files: keeps local data (will be uploaded)
   *
   * @param fileInfo - File information for sync (persisted to localStorage)
   */
  const connectProvider = async (fileInfo: FileInfo): Promise<void> => {
    if (!cloudStorage.isAuthenticated) {
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
    await cloudStorage.disconnect()

    // Clear all local storage (local data is just a cache)
    localStorage.clear()

    // Reset sync state
    setSyncStatus('idle')
    setLastSyncTime(null)
  }

  /**
   * Check if there's a stored file in localStorage
   */
  const hasSelectedFile = (): boolean => {
    return (
      selectedFile !== null || localStorage.getItem(SELECTED_FILE_KEY) !== null
    )
  }

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        lastSyncTime,
        selectedFile,
        isInitializing,
        needsReconnect,
        connectProvider,
        disconnectAndReset,
        syncNow,
        clearReconnectFlag: () => setNeedsReconnect(false),
        hasSelectedFile,
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
