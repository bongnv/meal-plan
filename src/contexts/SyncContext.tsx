import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { z } from 'zod'

import { CloudStorageFactory } from '../utils/storage/CloudStorageFactory'
import { CloudProvider } from '../utils/storage/CloudProvider'
import type { FileInfo } from '../utils/storage/ICloudStorageProvider'
import { merge, resolveConflicts } from '../utils/sync/mergeUtil'
import type { SyncData, ConflictInfo as MergeConflictInfo, ConflictResolution } from '../utils/sync/types'
import { useRecipes } from './RecipeContext'
import { useMealPlans } from './MealPlanContext'
import { useIngredients } from './IngredientContext'

// Zod schema for validating remote sync data
const SyncDataSchema = z.object({
  recipes: z.array(z.any()), // Could be more specific with Recipe schema
  mealPlans: z.array(z.any()),
  ingredients: z.array(z.any()),
  lastModified: z.number(),
  version: z.number(),
})

/**
 * LocalStorage keys
 */
const SELECTED_FILE_KEY = 'mealplan_selected_file'
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'
const SYNC_BASE_KEY = 'syncBase'

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
  importFromRemote: () => Promise<void>
  uploadToRemote: () => Promise<void>
  resolveConflict: (resolution: 'local' | 'remote') => Promise<void>
  reset: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode}) {
  const [connectedProvider, setConnectedProvider] = useState<CloudProvider | null>(null)
  const [accountInfo, setAccountInfo] = useState<{ name: string; email: string } | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  
  // Store merge context when conflicts occur for later resolution
  const [conflictContext, setConflictContext] = useState<{
    partialMerged: SyncData
    conflicts: MergeConflictInfo[]
    initialTimestamp: number
    localModified: number
    remoteModified: number
  } | null>(null)

  // Access data contexts
  const { recipes, replaceAllRecipes, getLastModified: getRecipesLastModified } = useRecipes()
  const { mealPlans, replaceAllMealPlans, getLastModified: getMealPlansLastModified } = useMealPlans()
  const { ingredients, replaceAllIngredients, getLastModified: getIngredientsLastModified } = useIngredients()

  /**
   * Helper function to apply merged data and finalize sync
   * Steps 7-10 of the sync process
   */
  const applyMergedDataAndFinalize = async (
    mergedData: SyncData,
    expectedTimestamp: number
  ): Promise<void> => {
    if (!connectedProvider || !selectedFile) {
      throw new Error('Not connected or no file selected')
    }

    // Step 7: Check for race condition before applying
    const currentStateTimestamp = Math.max(
      getRecipesLastModified(),
      getMealPlansLastModified(),
      getIngredientsLastModified()
    )
    if (currentStateTimestamp !== expectedTimestamp) {
      throw new Error('Local state changed during sync operation')
    }

    // Step 8: Apply merged data to React state
    replaceAllRecipes(mergedData.recipes)
    replaceAllMealPlans(mergedData.mealPlans)
    replaceAllIngredients(mergedData.ingredients)

    // Step 9: Upload merged data to remote
    const factory = CloudStorageFactory.getInstance()
    const cloudProvider = factory.getProvider(connectedProvider)
    const uploadData = { ...mergedData, lastModified: Date.now() }
    await cloudProvider.uploadFile(selectedFile, JSON.stringify(uploadData))

    // Step 10: Save as new base
    localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(uploadData))
  }

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
        console.error('Failed to restore cloud provider connection:', error)
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
   * Trigger manual sync with three-way merge
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

      // Step 1: Capture initial state timestamp for race condition detection
      const initialStateTimestamp = Math.max(
        getRecipesLastModified(),
        getMealPlansLastModified(),
        getIngredientsLastModified()
      )

      // Step 2: Load base version (last synced state)
      const baseJson = localStorage.getItem(SYNC_BASE_KEY)
      const base: SyncData | null = baseJson ? JSON.parse(baseJson) : null

      // Require base for sync - fail fast before expensive operations
      if (!base) {
        throw new Error('No sync base found. Use uploadToRemote() for initial upload or importFromRemote() to import existing data.')
      }

      // Step 3: Create local data snapshot with actual state modification time
      const localData: SyncData = {
        recipes,
        mealPlans,
        ingredients,
        lastModified: initialStateTimestamp,
        version: 1,
      }

      // Step 4: Download remote data
      const remoteJson = await cloudProvider.downloadFile(selectedFile)
      const parsedRemote = JSON.parse(remoteJson)
      
      // Validate remote data structure with zod
      const validationResult = SyncDataSchema.safeParse(parsedRemote)
      if (!validationResult.success) {
        console.error('Remote data validation failed:', validationResult.error)
        throw new Error('Invalid remote data format')
      }
      
      const remote = validationResult.data as SyncData

      // Step 5: Perform merge
      const mergeResult = merge(base, localData, remote)

      // Step 6: Handle conflicts
      if (!mergeResult.success && mergeResult.conflicts) {
        // Store merge context for later resolution
        if (!mergeResult.merged) {
          throw new Error('Merge failed: no partial merge data for conflict resolution')
        }
        
        setConflictContext({
          partialMerged: mergeResult.merged,
          conflicts: mergeResult.conflicts,
          initialTimestamp: initialStateTimestamp,
          localModified: localData.lastModified,
          remoteModified: remote.lastModified,
        })
        
        setSyncStatus('error')
        throw new Error(`Sync conflicts detected: ${mergeResult.conflicts.length} items need resolution`)
      }

      if (!mergeResult.merged) {
        throw new Error('Merge failed: no merged data returned')
      }

      // Steps 7-10: Apply merged data and finalize
      await applyMergedDataAndFinalize(mergeResult.merged, initialStateTimestamp)

      setSyncStatus('success')
      setLastSyncTime(Date.now())
      setConflictContext(null) // Clear any previous conflicts
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Resolve all conflicts by choosing to keep either local or remote versions
   * 
   * @param resolution - 'local' to keep all local changes, 'remote' to keep all remote changes
   */
  const resolveConflict = async (
    resolution: 'local' | 'remote'
  ): Promise<void> => {
    if (!conflictContext) {
      throw new Error('No conflict context available')
    }

    if (!connectedProvider || !selectedFile) {
      throw new Error('Not connected or no file selected')
    }

    try {
      setSyncStatus('syncing')

      // Build resolution map for all conflicts
      const resolutions = new Map<string, ConflictResolution>()
      for (const conflict of conflictContext.conflicts) {
        resolutions.set(conflict.id, resolution)
      }

      // Resolve all conflicts
      const resolveResult = resolveConflicts(
        conflictContext.partialMerged,
        conflictContext.conflicts,
        resolutions
      )

      if (!resolveResult.success || !resolveResult.merged) {
        throw new Error(resolveResult.error || 'Failed to resolve conflicts')
      }

      // Steps 7-10: Apply merged data and finalize
      await applyMergedDataAndFinalize(resolveResult.merged, conflictContext.initialTimestamp)

      // Clear conflict context
      setConflictContext(null)
      setSyncStatus('success')
      setLastSyncTime(Date.now())
    } catch (error) {
      console.error('Conflict resolution failed:', error)
      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Import data from remote file, overwriting all local data
   * Use this for first-time import or when you want to discard local changes
   */
  const importFromRemote = async (): Promise<void> => {
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

      // Download remote data
      const remoteJson = await cloudProvider.downloadFile(selectedFile)
      const parsedRemote = JSON.parse(remoteJson)
      
      // Validate remote data structure with zod
      const validationResult = SyncDataSchema.safeParse(parsedRemote)
      if (!validationResult.success) {
        console.error('Remote data validation failed:', validationResult.error)
        throw new Error('Invalid remote data format')
      }
      
      const remote = validationResult.data as SyncData

      // Apply remote data to React state (overwrites local)
      replaceAllRecipes(remote.recipes)
      replaceAllMealPlans(remote.mealPlans)
      replaceAllIngredients(remote.ingredients)

      // Save as new base
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(remote))

      setSyncStatus('success')
      setLastSyncTime(Date.now())
      setConflictContext(null) // Clear any previous conflicts
    } catch (error) {
      console.error('Import from remote failed:', error)
      setSyncStatus('error')
      throw error
    }
  }

  /**
   * Upload local data to remote file, creating or overwriting the file
   * Use this for first-time upload or when you want to overwrite remote with local data
   */
  const uploadToRemote = async (): Promise<void> => {
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

      // Capture current state timestamp
      const stateTimestamp = Math.max(
        getRecipesLastModified(),
        getMealPlansLastModified(),
        getIngredientsLastModified()
      )

      // Create local data snapshot
      const localData: SyncData = {
        recipes,
        mealPlans,
        ingredients,
        lastModified: stateTimestamp,
        version: 1,
      }

      // Upload to remote
      await cloudProvider.uploadFile(selectedFile, JSON.stringify(localData))

      // Save as new base
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(localData))

      setSyncStatus('success')
      setLastSyncTime(Date.now())
      setConflictContext(null) // Clear any previous conflicts
    } catch (error) {
      console.error('Upload to remote failed:', error)
      setSyncStatus('error')
      throw error
    }
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
    setConflictContext(null)
    setSelectedFile(null)
  }

  // Derive conflicts from conflictContext (memoized)
  const conflicts: SyncConflict[] = useMemo(() => {
    if (!conflictContext) return []
    
    return conflictContext.conflicts.map((c: MergeConflictInfo) => {
      // Extract name from different entity types
      let itemName = 'Unknown'
      if (c.localVersion && 'name' in c.localVersion) {
        itemName = c.localVersion.name
      } else if (c.remoteVersion && 'name' in c.remoteVersion) {
        itemName = c.remoteVersion.name
      }
      
      return {
        id: c.id,
        type: c.entity,
        itemName,
        localModified: conflictContext.localModified,
        remoteModified: conflictContext.remoteModified,
      }
    })
  }, [conflictContext])

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
        importFromRemote,
        uploadToRemote,
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
