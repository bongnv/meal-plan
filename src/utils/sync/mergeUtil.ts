import type {
  SyncData,
  ConflictInfo,
  ConflictResolution,
  RecordChanges,
} from './types'
import type { GroceryList, GroceryItem } from '@/types/groceryList'
import type { Ingredient } from '@/types/ingredient'
import type { MealPlan } from '@/types/mealPlan'
import type { Recipe } from '@/types/recipe'

/**
 * Result of a merge operation
 */
export interface MergeResult {
  success: boolean
  merged?: SyncData
  conflicts?: ConflictInfo[]
  error?: string
}

/**
 * Three-way merge utility for syncing local and remote data
 *
 * Pure functions that handle merge logic without side effects.
 * Caller (SyncContext) orchestrates download, merge, apply to state, and upload.
 */

/**
 * Merge local and remote data using three-way merge algorithm
 *
 * REQUIRES: base must exist (not null). For initial sync without base,
 * caller should use importFromRemote() or uploadToRemote() instead.
 *
 * @param base Last successfully synced version (common ancestor) - REQUIRED
 * @param local Current local state
 * @param remote Current remote state
 * @returns MergeResult with merged data or conflicts
 */
export function merge(
  base: SyncData,
  local: SyncData,
  remote: SyncData
): MergeResult {
  try {
    // Handle simple cases first
    const baseTimestamp = base.lastModified
    const remoteChanged = remote.lastModified > baseTimestamp
    const localChanged = local.lastModified > baseTimestamp

    // No changes - nothing to merge
    if (!remoteChanged && !localChanged) {
      return { success: true, merged: local }
    }

    // Only remote changed - use remote
    if (remoteChanged && !localChanged) {
      return { success: true, merged: remote }
    }

    // Only local changed - use local
    if (localChanged && !remoteChanged) {
      return { success: true, merged: local }
    }

    // Both changed - perform three-way merge
    const mergeResult = performThreeWayMerge(base, local, remote)

    if (mergeResult.conflicts.length > 0) {
      // Conflicts detected - return partial merged data with conflicts
      // Caller can use merged data after resolving conflicts
      return {
        success: false,
        merged: mergeResult.merged,
        conflicts: mergeResult.conflicts,
      }
    }

    // No conflicts - return merged data
    const merged: SyncData = {
      ...mergeResult.merged,
      lastModified: Date.now(),
      version: 1,
    }

    return { success: true, merged }
  } catch (error) {
    console.error('Merge operation failed:', error)
    return {
      success: false,
      error: `Merge failed: ${error}`,
    }
  }
}

/**
 * Apply conflict resolutions to produce final merged data
 *
 * @param partialMerged Partially merged data from merge() call (non-conflicting changes already applied)
 * @param conflicts List of conflicts to resolve
 * @param resolutions Map of conflict ID to resolution choice ('local' or 'remote')
 * @returns MergeResult with resolved data
 */
export function resolveConflicts(
  partialMerged: SyncData,
  conflicts: ConflictInfo[],
  resolutions: Map<string, ConflictResolution>
): MergeResult {
  try {
    // Apply resolutions to partial merged data
    const recipes = [...partialMerged.recipes]
    const mealPlans = [...partialMerged.mealPlans]
    const ingredients = [...partialMerged.ingredients]
    const groceryLists = [...partialMerged.groceryLists]
    const groceryItems = [...partialMerged.groceryItems]

    for (const conflict of conflicts) {
      const resolution = resolutions.get(conflict.id)
      if (!resolution) {
        return {
          success: false,
          error: `Missing resolution for conflict ${conflict.id}`,
        }
      }

      const version =
        resolution === 'local' ? conflict.localVersion : conflict.remoteVersion

      if (conflict.entity === 'recipe') {
        const index = recipes.findIndex(r => r.id === conflict.entityId)
        if (version === null) {
          // Delete
          if (index >= 0) recipes.splice(index, 1)
        } else {
          // Update or add
          if (index >= 0) {
            recipes[index] = version as Recipe
          } else {
            recipes.push(version as Recipe)
          }
        }
      } else if (conflict.entity === 'mealPlan') {
        const index = mealPlans.findIndex(mp => mp.id === conflict.entityId)
        if (version === null) {
          if (index >= 0) mealPlans.splice(index, 1)
        } else {
          if (index >= 0) {
            mealPlans[index] = version as MealPlan
          } else {
            mealPlans.push(version as MealPlan)
          }
        }
      } else if (conflict.entity === 'ingredient') {
        const index = ingredients.findIndex(i => i.id === conflict.entityId)
        if (version === null) {
          if (index >= 0) ingredients.splice(index, 1)
        } else {
          if (index >= 0) {
            ingredients[index] = version as Ingredient
          } else {
            ingredients.push(version as Ingredient)
          }
        }
      } else if (conflict.entity === 'groceryList') {
        const index = groceryLists.findIndex(gl => gl.id === conflict.entityId)
        if (version === null) {
          if (index >= 0) groceryLists.splice(index, 1)
        } else {
          if (index >= 0) {
            groceryLists[index] = version as GroceryList
          } else {
            groceryLists.push(version as GroceryList)
          }
        }
      } else if (conflict.entity === 'groceryItem') {
        const index = groceryItems.findIndex(gi => gi.id === conflict.entityId)
        if (version === null) {
          if (index >= 0) groceryItems.splice(index, 1)
        } else {
          if (index >= 0) {
            groceryItems[index] = version as GroceryItem
          } else {
            groceryItems.push(version as GroceryItem)
          }
        }
      }
    }

    const merged: SyncData = {
      recipes,
      mealPlans,
      ingredients,
      groceryLists,
      groceryItems,
      lastModified: Date.now(),
      version: 1,
    }

    return { success: true, merged }
  } catch (error) {
    console.error('Conflict resolution failed:', error)
    return {
      success: false,
      error: `Conflict resolution failed: ${error}`,
    }
  }
}

/**
 * Perform three-way merge with conflict detection
 */
function performThreeWayMerge(
  base: SyncData,
  local: SyncData,
  remote: SyncData
): { merged: SyncData; conflicts: ConflictInfo[] } {
  const conflicts: ConflictInfo[] = []

  // Detect changes
  const recipeChanges = detectChanges(
    base.recipes,
    local.recipes,
    remote.recipes
  )
  const mealPlanChanges = detectChanges(
    base.mealPlans,
    local.mealPlans,
    remote.mealPlans
  )
  const ingredientChanges = detectChanges(
    base.ingredients,
    local.ingredients,
    remote.ingredients
  )
  const groceryListChanges = detectChanges(
    base.groceryLists,
    local.groceryLists,
    remote.groceryLists
  )
  const groceryItemChanges = detectChanges(
    base.groceryItems,
    local.groceryItems,
    remote.groceryItems
  )

  // Merge with conflict detection
  const recipes = mergeRecords(
    base.recipes,
    recipeChanges.local,
    recipeChanges.remote,
    'recipe',
    conflicts
  )

  const mealPlans = mergeRecords(
    base.mealPlans,
    mealPlanChanges.local,
    mealPlanChanges.remote,
    'mealPlan',
    conflicts
  )

  const ingredients = mergeRecords(
    base.ingredients,
    ingredientChanges.local,
    ingredientChanges.remote,
    'ingredient',
    conflicts
  )

  const groceryLists = mergeRecords(
    base.groceryLists,
    groceryListChanges.local,
    groceryListChanges.remote,
    'groceryList',
    conflicts
  )

  const groceryItems = mergeRecords(
    base.groceryItems,
    groceryItemChanges.local,
    groceryItemChanges.remote,
    'groceryItem',
    conflicts
  )

  return {
    merged: {
      recipes,
      mealPlans,
      ingredients,
      groceryLists,
      groceryItems,
      lastModified: Date.now(),
      version: 1,
    },
    conflicts,
  }
}

/**
 * Detect changes between base and local/remote
 */
function detectChanges<T extends { id: string }>(
  base: T[],
  local: T[],
  remote: T[]
): { local: RecordChanges<T>; remote: RecordChanges<T> } {
  const baseMap = new Map(base.map(item => [item.id, item]))
  const localMap = new Map(local.map(item => [item.id, item]))
  const remoteMap = new Map(remote.map(item => [item.id, item]))

  const localChanges: RecordChanges<T> = {
    created: [],
    updated: [],
    deleted: [],
  }
  const remoteChanges: RecordChanges<T> = {
    created: [],
    updated: [],
    deleted: [],
  }

  // Detect local changes
  for (const item of local) {
    const baseItem = baseMap.get(item.id)
    if (!baseItem) {
      localChanges.created.push(item)
    } else if (JSON.stringify(item) !== JSON.stringify(baseItem)) {
      localChanges.updated.push(item)
    }
  }

  for (const baseItem of base) {
    if (!localMap.has(baseItem.id)) {
      localChanges.deleted.push(baseItem.id)
    }
  }

  // Detect remote changes
  for (const item of remote) {
    const baseItem = baseMap.get(item.id)
    if (!baseItem) {
      remoteChanges.created.push(item)
    } else if (JSON.stringify(item) !== JSON.stringify(baseItem)) {
      remoteChanges.updated.push(item)
    }
  }

  for (const baseItem of base) {
    if (!remoteMap.has(baseItem.id)) {
      remoteChanges.deleted.push(baseItem.id)
    }
  }

  return { local: localChanges, remote: remoteChanges }
}

/**
 * Merge records with conflict detection
 */
function mergeRecords<T extends { id: string }>(
  base: T[],
  localChanges: RecordChanges<T>,
  remoteChanges: RecordChanges<T>,
  entityType:
    | 'recipe'
    | 'mealPlan'
    | 'ingredient'
    | 'groceryList'
    | 'groceryItem',
  conflicts: ConflictInfo[]
): T[] {
  const result = new Map<string, T>()

  // Start with base
  base.forEach(item => result.set(item.id, item))

  const localUpdatedIds = new Set(localChanges.updated.map(item => item.id))
  const remoteUpdatedIds = new Set(remoteChanges.updated.map(item => item.id))
  const localDeletedIds = new Set(localChanges.deleted)
  const remoteDeletedIds = new Set(remoteChanges.deleted)

  // Apply local-only changes
  for (const item of localChanges.created) {
    if (!remoteChanges.created.find(r => r.id === item.id)) {
      result.set(item.id, item)
    }
  }

  for (const item of localChanges.updated) {
    if (!remoteUpdatedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
      result.set(item.id, item)
    }
  }

  for (const id of localChanges.deleted) {
    if (!remoteUpdatedIds.has(id) && !remoteDeletedIds.has(id)) {
      result.delete(id)
    }
  }

  // Apply remote-only changes
  for (const item of remoteChanges.created) {
    if (!localChanges.created.find(l => l.id === item.id)) {
      result.set(item.id, item)
    }
  }

  for (const item of remoteChanges.updated) {
    if (!localUpdatedIds.has(item.id) && !localDeletedIds.has(item.id)) {
      result.set(item.id, item)
    }
  }

  for (const id of remoteChanges.deleted) {
    if (!localUpdatedIds.has(id) && !localDeletedIds.has(id)) {
      result.delete(id)
    }
  }

  // Detect conflicts
  // 1. Update-Update conflicts
  for (const localItem of localChanges.updated) {
    const remoteItem = remoteChanges.updated.find(r => r.id === localItem.id)
    if (
      remoteItem &&
      JSON.stringify(localItem) !== JSON.stringify(remoteItem)
    ) {
      const baseItem = base.find(b => b.id === localItem.id)
      conflicts.push({
        id: `${entityType}-${localItem.id}`,
        type: 'update-update',
        entity: entityType,
        entityId: localItem.id,
        localVersion: localItem as unknown as Recipe | MealPlan | Ingredient,
        remoteVersion: remoteItem as unknown as Recipe | MealPlan | Ingredient,
        baseVersion: baseItem as unknown as Recipe | MealPlan | Ingredient,
      })
    }
  }

  // 2. Update-Delete conflicts
  for (const localItem of localChanges.updated) {
    if (remoteDeletedIds.has(localItem.id)) {
      const baseItem = base.find(b => b.id === localItem.id)
      conflicts.push({
        id: `${entityType}-${localItem.id}`,
        type: 'update-delete',
        entity: entityType,
        entityId: localItem.id,
        localVersion: localItem as unknown as Recipe | MealPlan | Ingredient,
        remoteVersion: null,
        baseVersion: baseItem as unknown as Recipe | MealPlan | Ingredient,
      })
    }
  }

  // 3. Delete-Update conflicts
  for (const remoteItem of remoteChanges.updated) {
    if (localDeletedIds.has(remoteItem.id)) {
      const baseItem = base.find(b => b.id === remoteItem.id)
      conflicts.push({
        id: `${entityType}-${remoteItem.id}`,
        type: 'delete-update',
        entity: entityType,
        entityId: remoteItem.id,
        localVersion: null,
        remoteVersion: remoteItem as unknown as Recipe | MealPlan | Ingredient,
        baseVersion: baseItem as unknown as Recipe | MealPlan | Ingredient,
      })
    }
  }

  return Array.from(result.values())
}
