import type { Recipe } from '../../types/recipe'
import type { MealPlan } from '../../types/mealPlan'
import type { Ingredient } from '../../types/ingredient'

/**
 * Structure of synced data
 * Represents the complete app state that gets synced to cloud storage
 */
export interface SyncData {
  recipes: Recipe[]
  mealPlans: MealPlan[]
  ingredients: Ingredient[]
  lastModified: number // Unix timestamp
  version: number // Data format version for future migrations
}

/**
 * Type of conflict that occurred during sync
 */
export type ConflictType = 
  | 'update-update' // Same record updated on both sides
  | 'update-delete' // Updated locally, deleted remotely
  | 'delete-update' // Deleted locally, updated remotely

/**
 * Represents a single conflict that needs user resolution
 */
export interface ConflictInfo {
  id: string // Unique conflict identifier
  type: ConflictType
  entity: 'recipe' | 'mealPlan' | 'ingredient'
  entityId: string // ID of the conflicting entity
  localVersion: Recipe | MealPlan | Ingredient | null // null if deleted locally
  remoteVersion: Recipe | MealPlan | Ingredient | null // null if deleted remotely
  baseVersion: Recipe | MealPlan | Ingredient | null // null if created after last sync
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean
  conflicts?: ConflictInfo[] // Present if manual resolution needed
  error?: string
  mergedData?: SyncData // Present if sync succeeded
}

/**
 * Options for resolving a conflict
 */
export type ConflictResolution = 'local' | 'remote'

/**
 * Record-level change detection
 */
export interface RecordChanges<T> {
  created: T[] // Records that exist in target but not in base
  updated: T[] // Records that exist in both but are different
  deleted: string[] // IDs of records that exist in base but not in target
}

/**
 * Three-way merge changes for all entities
 */
export interface MergeChanges {
  recipes: {
    local: RecordChanges<Recipe>
    remote: RecordChanges<Recipe>
  }
  mealPlans: {
    local: RecordChanges<MealPlan>
    remote: RecordChanges<MealPlan>
  }
  ingredients: {
    local: RecordChanges<Ingredient>
    remote: RecordChanges<Ingredient>
  }
}

/**
 * Snapshot of current local state for race condition detection
 */
export interface LocalStateSnapshot {
  data: SyncData
  timestamp: number // When snapshot was taken
}
