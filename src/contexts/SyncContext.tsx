import { useThrottledCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { z } from 'zod'

import { db } from '../db/database'
import { syncService } from '../services/syncService'
import { TokenExpiredError } from '../utils/errors/TokenExpiredError'

import { useCloudStorage } from './CloudStorageContext'

import type { SyncData } from '../services/syncService'
import type { FileInfo } from '../utils/storage/ICloudStorageProvider'

// Zod schema for validating remote sync data
const SyncDataSchema = z.object({
  recipes: z.array(z.any()), // Could be more specific with Recipe schema
  mealPlans: z.array(z.any()),
  ingredients: z.array(z.any()),
  groceryLists: z.array(z.any()).optional().default([]),
  groceryItems: z.array(z.any()).optional().default([]),
  lastModified: z.number(),
  version: z.number(),
})

/**
 * LocalStorage keys
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const SYNC_BASE_KEY = 'syncBase'

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

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
  importFromRemote: () => Promise<void>
  uploadToRemote: () => Promise<void>
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

  // Throttled auto-sync function (max once per minute)
  const throttledSync = useThrottledCallback(async () => {
    console.log('Auto-syncing...')
    try {
      await syncNow()
    } catch (error) {
      console.error('Auto-sync failed:', error)

      // Check if token expired - if so, set reconnect flag instead of showing error
      // Check both instance type and message content (Graph API may wrap our error)
      const isTokenExpired =
        error instanceof TokenExpiredError ||
        (error instanceof Error && error.message.includes('Session expired'))

      if (isTokenExpired) {
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

  // Set status to 'idle' when there are unsaved changes (local differs from base)
  useEffect(() => {
    // Only check when status is 'success' - don't interrupt syncing or override error
    if (
      !cloudStorage.isAuthenticated ||
      !selectedFile ||
      syncStatus !== 'success'
    ) {
      return
    }

    // Get current local timestamp - handle undefined from useLiveQuery
    if (lastModified === undefined) {
      return
    }

    // Get base timestamp
    const baseJson = localStorage.getItem(SYNC_BASE_KEY)
    const baseTimestamp = baseJson ? JSON.parse(baseJson).lastModified : 0

    // If local changed since last sync, set status to idle
    if (lastModified !== baseTimestamp) {
      setSyncStatus('idle')
    }
  }, [lastModified, cloudStorage.isAuthenticated, selectedFile, syncStatus])

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
   * Select a file for synci and connection state
    setSelectedFile(fileInfo)
    setConnectionState('connected'eady be authenticated via CloudStorageContext
   *
   * @param fileInfo - File information for sync (persisted to localStorage)
   */
  const connectProvider = async (fileInfo: FileInfo): Promise<void> => {
    if (!cloudStorage.isAuthenticated) {
      throw new Error('Provider not authenticated')
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
   * Trigger manual sync with Last Write Wins (LWW) merge
   * Automatically resolves conflicts based on updatedAt timestamps
   */
  const syncNow = async (): Promise<void> => {
    if (!cloudStorage.currentProvider || !selectedFile) {
      throw new Error('Not connected')
    }

    try {
      setSyncStatus('syncing')

      // Get local snapshot
      const local = await syncService.getLocalSnapshot()

      // Download remote data (or use empty for new files)
      let remote: SyncData
      const isNewFile = !selectedFile.id

      if (isNewFile) {
        // New file doesn't exist yet, treat as empty remote
        remote = {
          recipes: [],
          mealPlans: [],
          ingredients: [],
          groceryLists: [],
          groceryItems: [],
          lastModified: 0,
          version: 1,
        }
      } else {
        // Download and validate remote data
        const remoteJson = await cloudStorage.downloadFile(selectedFile)
        const parsedRemote = JSON.parse(remoteJson)

        const validationResult = SyncDataSchema.safeParse(parsedRemote)
        if (!validationResult.success) {
          console.error(
            'Remote data validation failed:',
            validationResult.error
          )
          throw new Error('Invalid remote data format')
        }

        remote = validationResult.data as SyncData
      }

      // Merge using LWW strategy (handled by service)
      const mergeResult = await syncService.mergeWithLWW(local, remote)

      // Apply merged data
      await syncService.applyMergedData(mergeResult.merged)

      // Upload merged data to remote
      const uploadData = { ...mergeResult.merged, lastModified: Date.now() }
      const updatedFileInfo = await cloudStorage.uploadFile(
        selectedFile,
        JSON.stringify(uploadData)
      )

      // Update selectedFile if ID was generated (new file)
      if (!selectedFile.id && updatedFileInfo.id) {
        setSelectedFile(updatedFileInfo)
        localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(updatedFileInfo))
      }

      // Save as new base
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(uploadData))

      setSyncStatus('success')
      setLastSyncTime(Date.now())
    } catch (error) {
      console.error('Sync failed:', error)

      const isTokenExpired =
        error instanceof TokenExpiredError ||
        (error instanceof Error && error.message.includes('Session expired'))

      if (isTokenExpired) {
        setNeedsReconnect(true)
        setSyncStatus('idle')
        throw error
      }

      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Import data from remote file, overwriting all local data
   */
  const importFromRemote = async (): Promise<void> => {
    if (!cloudStorage.currentProvider || !selectedFile) {
      throw new Error('Not connected or no file selected')
    }

    try {
      setSyncStatus('syncing')

      // Download remote data
      const remoteJson = await cloudStorage.downloadFile(selectedFile)
      const parsedRemote = JSON.parse(remoteJson)

      const validationResult = SyncDataSchema.safeParse(parsedRemote)
      if (!validationResult.success) {
        console.error('Remote data validation failed:', validationResult.error)
        throw new Error('Invalid remote data format')
      }

      const remote = validationResult.data as SyncData

      // Apply remote data (with migrations)
      await syncService.applyRemoteData(remote)

      // Save as new base
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(remote))

      setSyncStatus('success')
      setLastSyncTime(Date.now())
    } catch (error) {
      console.error('Import from remote failed:', error)
      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Upload local data to remote file, creating or overwriting
   */
  const uploadToRemote = async (): Promise<void> => {
    if (!cloudStorage.currentProvider || !selectedFile) {
      throw new Error('Not connected or no file selected')
    }

    try {
      setSyncStatus('syncing')

      // Get local snapshot
      const localData = await syncService.getLocalSnapshot()

      // Upload to remote
      const updatedFileInfo = await cloudStorage.uploadFile(
        selectedFile,
        JSON.stringify(localData)
      )

      // Update selectedFile if ID was generated (new file)
      if (!selectedFile.id && updatedFileInfo.id) {
        setSelectedFile(updatedFileInfo)
        localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(updatedFileInfo))
      }

      // Save as new base
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(localData))

      setSyncStatus('success')
      setLastSyncTime(Date.now())
    } catch (error) {
      console.error('Upload to remote failed:', error)
      setSyncStatus('error')
      throw error
    }
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
        importFromRemote,
        uploadToRemote,
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
