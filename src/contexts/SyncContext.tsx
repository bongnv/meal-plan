import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

import { CloudStorageFactory } from '../utils/storage/CloudStorageFactory'
import { CloudProvider } from '../utils/storage/CloudProvider'

/**
 * File information for selected sync file
 */
export interface FileInfo {
  id: string
  name: string
  path: string
}

/**
 * LocalStorage keys
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

/**
 * Conflict information for manual resolution
 */
export interface SyncConflict {
  id: string
  type: 'recipe' | 'mealPlan' | 'ingredient'
  itemName: string
  localModified: number
  remoteModified: number
}

interface SyncContextType {
  // State
  connectedProvider: CloudProvider | null
  accountInfo: { name: string; email: string } | null
  syncStatus: SyncStatus
  lastSyncTime: number | null
  conflicts: SyncConflict[]
  selectedFile: FileInfo | null

  // Actions
  connectProvider: (provider: CloudProvider, fileInfo: FileInfo) => Promise<void>
  disconnectProvider: () => Promise<void>
  syncNow: () => Promise<void>
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>
  reset: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode}) {
  const [connectedProvider, setConnectedProvider] = useState<CloudProvider | null>(null)
  const [accountInfo, setAccountInfo] = useState<{ name: string; email: string } | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)

  // Restore provider connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      const savedProvider = localStorage.getItem(CONNECTED_PROVIDER_KEY) as CloudProvider | null
      const savedFile = localStorage.getItem(SELECTED_FILE_KEY)
      
      if (!savedProvider || !savedFile) {
        return
      }

      try {
        const factory = CloudStorageFactory.getInstance()
        const cloudProvider = factory.getProvider(savedProvider)
        
        // Check if provider is still connected (has valid token)
        const isConnected = await cloudProvider.isConnected()
        
        if (isConnected) {
          // Restore connection state without re-authenticating
          const info = await cloudProvider.getAccountInfo()
          const fileInfo = JSON.parse(savedFile) as FileInfo
          
          setConnectedProvider(savedProvider)
          setAccountInfo(info)
          setSelectedFile(fileInfo)
        } else {
          // Token expired, clear saved data
          localStorage.removeItem(CONNECTED_PROVIDER_KEY)
          localStorage.removeItem(SELECTED_FILE_KEY)
        }
      } catch (error) {
        // Failed to restore, clear saved data
        localStorage.removeItem(CONNECTED_PROVIDER_KEY)
        localStorage.removeItem(SELECTED_FILE_KEY)
      }
    }

    restoreConnection()
  }, [])

  /**
   * Connect to specified cloud storage provider
   * Initiates authentication and enables auto-sync
   * 
   * @param provider - Cloud storage provider to connect to
   * @param fileInfo - File information for sync (persisted to localStorage)
   */
  const connectProvider = async (provider: CloudProvider, fileInfo: FileInfo): Promise<void> => {
    const factory = CloudStorageFactory.getInstance()
    const cloudProvider = factory.getProvider(provider)

    // Initiate provider-specific authentication flow
    await cloudProvider.connect()

    // Get account info for UI display
    const info = await cloudProvider.getAccountInfo()

    // Update state
    setConnectedProvider(provider)
    setAccountInfo(info)
    setSelectedFile(fileInfo)

    // Persist provider and file info to localStorage
    localStorage.setItem(CONNECTED_PROVIDER_KEY, provider)
    localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(fileInfo))
  }

  /**
   * Disconnect from current provider
   * Disables auto-sync but keeps local data
   */
  const disconnectProvider = async (): Promise<void> => {
    if (!connectedProvider) {
      return
    }

    const factory = CloudStorageFactory.getInstance()
    const cloudProvider = factory.getProvider(connectedProvider)

    // Disconnect from provider
    await cloudProvider.disconnect()

    // Clear state and persisted data
    setConnectedProvider(null)
    setAccountInfo(null)
    setSyncStatus('idle')
    setSelectedFile(null)
    localStorage.removeItem(CONNECTED_PROVIDER_KEY)
    localStorage.removeItem(SELECTED_FILE_KEY)
  }

  /**
   * Trigger manual sync
   * This will be expanded in I3.4 to implement actual sync logic
   */
  const syncNow = async (): Promise<void> => {
    if (!connectedProvider) {
      throw new Error('Not connected')
    }

    if (!selectedFile) {
      throw new Error('No file selected')
    }

    try {
      setSyncStatus('syncing')

      const factory = CloudStorageFactory.getInstance()
      const cloudProvider = factory.getProvider(connectedProvider)

      // Download remote data using selected file path
      const remoteData = await cloudProvider.downloadFile(selectedFile.path)
      
      // Parse remote data
      JSON.parse(remoteData)

      // TODO: Implement actual sync logic in I3.4
      // For now, just mark as success
      setSyncStatus('success')
      setLastSyncTime(Date.now())
    } catch (error) {
      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Resolve a specific conflict with user's choice
   * This will be expanded in I3.4 with actual conflict resolution logic
   */
  const resolveConflict = async (
    conflictId: string,
    _resolution: 'local' | 'remote'
  ): Promise<void> => {
    // TODO: Implement conflict resolution logic in I3.4
    // For now, just remove the conflict from the list
    setConflicts(prev => prev.filter(c => c.id !== conflictId))
  }

  /**
   * Reset all local data and disconnect
   * Shows welcome screen
   */
  const reset = async (): Promise<void> => {
    // Disconnect from provider if connected
    if (connectedProvider) {
      await disconnectProvider()
    }

    // Clear all local storage
    localStorage.clear()

    // Reset all state
    setConnectedProvider(null)
    setAccountInfo(null)
    setSyncStatus('idle')
    setLastSyncTime(null)
    setConflicts([])
    setSelectedFile(null)
  }

  return (
    <SyncContext.Provider
      value={{
        connectedProvider,
        accountInfo,
        syncStatus,
        lastSyncTime,
        conflicts,
        selectedFile,
        connectProvider,
        disconnectProvider,
        syncNow,
        resolveConflict,
        reset,
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
