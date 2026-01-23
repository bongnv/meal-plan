import { useThrottledCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { z } from 'zod'

import { merge, resolveConflicts } from '../utils/sync/mergeUtil'

import { useCloudStorage } from './CloudStorageContext'
import { useGroceryLists } from './GroceryListContext'
import { useIngredients } from './IngredientContext'
import { useMealPlans } from './MealPlanContext'
import { useRecipes } from './RecipeContext'

import type { FileInfo } from '../utils/storage/ICloudStorageProvider'
import type {
  SyncData,
  ConflictInfo as MergeConflictInfo,
  ConflictResolution,
} from '../utils/sync/types'

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

/**
 * Conflict information for manual resolution
 */
export interface SyncConflict {
  id: string
  type: 'recipe' | 'mealPlan' | 'ingredient' | 'groceryList' | 'groceryItem'
  itemName: string
  localModified: number
  remoteModified: number
}

interface SyncContextType {
  // State
  syncStatus: SyncStatus
  lastSyncTime: number | null
  conflicts: SyncConflict[]
  selectedFile: FileInfo | null
  isInitializing: boolean

  // Actions
  connectProvider: (fileInfo: FileInfo) => Promise<void>
  disconnectAndReset: () => Promise<void>
  syncNow: () => Promise<void>
  importFromRemote: () => Promise<void>
  uploadToRemote: () => Promise<void>
  resolveConflict: (resolution: 'local' | 'remote') => Promise<void>
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

  // Store merge context when conflicts occur for later resolution
  const [conflictContext, setConflictContext] = useState<{
    partialMerged: SyncData
    conflicts: MergeConflictInfo[]
    initialTimestamp: number
    localModified: number
    remoteModified: number
  } | null>(null)

  // Access data contexts
  const {
    recipes,
    replaceAllRecipes,
    getLastModified: getRecipesLastModified,
  } = useRecipes()
  const {
    mealPlans,
    replaceAllMealPlans,
    getLastModified: getMealPlansLastModified,
  } = useMealPlans()
  const {
    ingredients,
    replaceAllIngredients,
    getLastModified: getIngredientsLastModified,
  } = useIngredients()
  const {
    groceryLists,
    groceryItems,
    replaceAllGroceryLists,
    replaceAllGroceryItems,
    getLastModified: getGroceryListsLastModified,
  } = useGroceryLists()

  /**
   * Helper function to apply merged data and finalize sync
   * Steps 7-10 of the sync process
   */
  const applyMergedDataAndFinalize = async (
    mergedData: SyncData,
    expectedTimestamp: number
  ): Promise<void> => {
    if (!cloudStorage.currentProvider || !selectedFile) {
      throw new Error('Not connected or no file selected')
    }

    // Step 7: Check for race condition before applying
    const currentStateTimestamp = Math.max(
      getRecipesLastModified(),
      getMealPlansLastModified(),
      getIngredientsLastModified(),
      getGroceryListsLastModified()
    )
    if (currentStateTimestamp !== expectedTimestamp) {
      throw new Error('Local state changed during sync operation')
    }

    // Step 8: Apply merged data to React state
    replaceAllRecipes(mergedData.recipes)
    replaceAllMealPlans(mergedData.mealPlans)
    replaceAllIngredients(mergedData.ingredients)
    replaceAllGroceryLists(mergedData.groceryLists)
    replaceAllGroceryItems(mergedData.groceryItems)

    // Step 9: Upload merged data to remote
    const uploadData = { ...mergedData, lastModified: Date.now() }
    const updatedFileInfo = await cloudStorage.uploadFile(
      selectedFile,
      JSON.stringify(uploadData)
    )

    // Step 9.5: Update selectedFile if ID was generated (new file)
    if (!selectedFile.id && updatedFileInfo.id) {
      setSelectedFile(updatedFileInfo)
      localStorage.setItem(SELECTED_FILE_KEY, JSON.stringify(updatedFileInfo))
    }

    // Step 10: Save as new base
    localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(uploadData))
  }

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

  // Track lastModified timestamps for auto-sync trigger
  const recipesLastModified = getRecipesLastModified()
  const mealPlansLastModified = getMealPlansLastModified()
  const ingredientsLastModified = getIngredientsLastModified()
  const groceryListsLastModified = getGroceryListsLastModified()

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

    // Get current local timestamp
    const currentLocalTimestamp = Math.max(
      recipesLastModified,
      mealPlansLastModified,
      ingredientsLastModified,
      groceryListsLastModified
    )

    // Get base timestamp
    const baseJson = localStorage.getItem(SYNC_BASE_KEY)
    const baseTimestamp = baseJson ? JSON.parse(baseJson).lastModified : 0

    // If local changed since last sync, set status to idle
    if (currentLocalTimestamp !== baseTimestamp) {
      setSyncStatus('idle')
    }
  }, [
    recipesLastModified,
    mealPlansLastModified,
    ingredientsLastModified,
    groceryListsLastModified,
    cloudStorage.isAuthenticated,
    selectedFile,
    syncStatus,
  ])

  // Auto-sync: immediate on first call, throttled on subsequent data changes
  useEffect(() => {
    // Only auto-sync if we're connected and not already syncing
    if (
      !cloudStorage.isAuthenticated ||
      !selectedFile ||
      syncStatus === 'syncing'
    ) {
      return
    }

    // Throttled sync (executes immediately on first call, then throttles)
    throttledSync()
  }, [
    recipesLastModified,
    mealPlansLastModified,
    ingredientsLastModified,
    groceryListsLastModified,
    cloudStorage.isAuthenticated,
    selectedFile,
    throttledSync,
    syncStatus,
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
    setConflictContext(null)
  }

  /**
   * Trigger manual sync with three-way merge
   */
  const syncNow = async (): Promise<void> => {
    if (!cloudStorage.currentProvider || !selectedFile) {
      throw new Error('Not connected')
    }

    if (!selectedFile) {
      throw new Error('No file selected')
    }

    try {
      setSyncStatus('syncing')

      // Step 1: Capture initial state timestamp for race condition detection
      const initialStateTimestamp = Math.max(
        getRecipesLastModified(),
        getMealPlansLastModified(),
        getIngredientsLastModified(),
        getGroceryListsLastModified()
      )

      // Step 2: Load base version (last synced state)
      // If no base exists (first sync), use empty base for merge
      const baseJson = localStorage.getItem(SYNC_BASE_KEY)
      const base: SyncData = baseJson
        ? JSON.parse(baseJson)
        : {
            recipes: [],
            mealPlans: [],
            ingredients: [],
            groceryLists: [],
            groceryItems: [],
            lastModified: 0,
            version: 1,
          }

      // Step 3: Create local data snapshot with actual state modification time
      const localData: SyncData = {
        recipes,
        mealPlans,
        ingredients,
        groceryLists,
        groceryItems,
        lastModified: initialStateTimestamp,
        version: 1,
      }

      // Step 3.5: Early return if local hasn't changed - no need to check remote
      if (localData.lastModified === base.lastModified) {
        setSyncStatus('success')
        setLastSyncTime(Date.now())
        setConflictContext(null)
        return
      }

      // Step 4: Download remote data (skip if new file with empty ID)
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
        // Existing file, download remote data
        const remoteJson = await cloudStorage.downloadFile(selectedFile)
        const parsedRemote = JSON.parse(remoteJson)

        // Validate remote data structure with zod
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

      // Step 4.5: Check if anything changed - skip upload if not
      const localUnchanged = localData.lastModified === base.lastModified
      const remoteUnchanged = remote.lastModified === base.lastModified

      if (localUnchanged && remoteUnchanged) {
        setSyncStatus('success')
        setLastSyncTime(Date.now())
        setConflictContext(null)
        return
      }

      // Step 5: Perform merge
      const mergeResult = merge(base, localData, remote)

      // Step 6: Handle conflicts
      if (!mergeResult.success && mergeResult.conflicts) {
        // Store merge context for later resolution
        if (!mergeResult.merged) {
          throw new Error(
            'Merge failed: no partial merge data for conflict resolution'
          )
        }

        setConflictContext({
          partialMerged: mergeResult.merged,
          conflicts: mergeResult.conflicts,
          initialTimestamp: initialStateTimestamp,
          localModified: localData.lastModified,
          remoteModified: remote.lastModified,
        })

        setSyncStatus('error')
        throw new Error(
          `Sync conflicts detected: ${mergeResult.conflicts.length} items need resolution`
        )
      }

      if (!mergeResult.merged) {
        throw new Error('Merge failed: no merged data returned')
      }

      // Steps 7-10: Apply merged data and finalize
      await applyMergedDataAndFinalize(
        mergeResult.merged,
        initialStateTimestamp
      )

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

    if (!cloudStorage.currentProvider || !selectedFile) {
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
      await applyMergedDataAndFinalize(
        resolveResult.merged,
        conflictContext.initialTimestamp
      )

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
    if (!cloudStorage.currentProvider) {
      throw new Error('Not connected')
    }

    if (!selectedFile) {
      throw new Error('No file selected')
    }

    try {
      setSyncStatus('syncing')

      // Download remote data
      const remoteJson = await cloudStorage.downloadFile(selectedFile)
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
   * Check if there's a stored file in localStorage
   */
  const hasSelectedFile = (): boolean => {
    return (
      selectedFile !== null || localStorage.getItem(SELECTED_FILE_KEY) !== null
    )
  }

  /**
   * Upload local data to remote file, creating or overwriting the file
   * Use this for first-time upload or when you want to overwrite remote with local data
   */
  const uploadToRemote = async (): Promise<void> => {
    if (!cloudStorage.currentProvider) {
      throw new Error('Not connected')
    }

    if (!selectedFile) {
      throw new Error('No file selected')
    }

    try {
      setSyncStatus('syncing')

      // Capture current state timestamp
      const stateTimestamp = Math.max(
        getRecipesLastModified(),
        getMealPlansLastModified(),
        getIngredientsLastModified(),
        getGroceryListsLastModified()
      )

      // Create local data snapshot
      const localData: SyncData = {
        recipes,
        mealPlans,
        ingredients,
        groceryLists,
        groceryItems,
        lastModified: stateTimestamp,
        version: 1,
      }

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
      setConflictContext(null) // Clear any previous conflicts
    } catch (error) {
      console.error('Upload to remote failed:', error)
      setSyncStatus('error')
      throw error
    }
  }

  // Derive conflicts from conflictContext (memoized)
  const conflicts: SyncConflict[] = useMemo(() => {
    if (!conflictContext) return []

    return conflictContext.conflicts.map((c: MergeConflictInfo) => {
      // Extract name from different entity types
      let itemName = 'Unknown'
      if (c.localVersion && 'name' in c.localVersion) {
        itemName = c.localVersion.name || 'Unknown'
      } else if (c.remoteVersion && 'name' in c.remoteVersion) {
        itemName = c.remoteVersion.name || 'Unknown'
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
        syncStatus,
        lastSyncTime,
        conflicts,
        selectedFile,
        isInitializing,
        connectProvider,
        disconnectAndReset,
        syncNow,
        importFromRemote,
        uploadToRemote,
        resolveConflict,
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
