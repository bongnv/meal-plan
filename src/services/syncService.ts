import { z } from 'zod'

import { db, type MealPlanDB } from '../db/database'
import {
  isExistingFile,
  type FileInfo,
  type ICloudStorageProvider,
} from '../utils/storage/ICloudStorageProvider'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { Ingredient } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

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
 * SyncData represents the complete application state for syncing
 */
export interface SyncData {
  recipes: Recipe[]
  mealPlans: MealPlan[]
  ingredients: Ingredient[]
  groceryLists: GroceryList[]
  groceryItems: GroceryItem[]
  lastModified: number
  version: number
}

/**
 * SyncResult returned from performSync operation
 */
export interface SyncResult {
  merged: SyncData
  updatedFileInfo?: FileInfo
}

/**
 * SyncService
 * Stateless business logic for syncing data with Last Write Wins (LWW) strategy
 * Dependencies injected via constructor for testability
 */
export class SyncService {
  constructor(
    private readonly storage: ICloudStorageProvider,
    private readonly db: MealPlanDB
  ) {}

  /**
   * Perform complete sync operation with cloud storage
   * Downloads remote data, merges with local, applies changes, and uploads if needed
   *
   * @param fileInfo - File to sync with
   * @returns SyncResult with merged data and optional updated file info
   */
  async performSync(fileInfo: FileInfo): Promise<SyncResult> {
    // Get local snapshot
    const local = await this.getLocalSnapshot()

    // Download and validate remote data (or use empty for new files)
    const remote = await this.downloadAndValidateRemote(fileInfo)

    // Merge using LWW strategy
    const merged = await this.mergeWithLWW(local, remote)

    // Apply merged data
    await this.applyMergedData(merged)

    // Upload if local has newer changes than remote
    if (local.lastModified !== remote.lastModified) {
      const updatedFileInfo = await this.storage.uploadFile(
        fileInfo,
        JSON.stringify(merged)
      )

      return {
        merged,
        updatedFileInfo,
      }
    }

    return { merged }
  }

  /**
   * Download and validate remote sync data
   * For new files, returns empty sync data structure
   *
   * @param fileInfo - File to download
   * @returns Validated SyncData
   * @private
   */
  private async downloadAndValidateRemote(
    fileInfo: FileInfo
  ): Promise<SyncData> {
    const isNewFile = !isExistingFile(fileInfo)

    if (isNewFile) {
      // New file doesn't exist yet, treat as empty remote
      return {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 0,
        version: 1,
      }
    }

    // Download and validate remote data
    const remoteJson = await this.storage.downloadFile(fileInfo)
    const parsedRemote = JSON.parse(remoteJson)

    const validationResult = SyncDataSchema.safeParse(parsedRemote)
    if (!validationResult.success) {
      console.error('Remote data validation failed:', validationResult)
      throw new Error('Invalid remote data format')
    }

    const remote = validationResult.data as SyncData

    // Migrate recipes from old format if needed
    remote.recipes = remote.recipes.map(recipe =>
      this.migrateRecipeToSections(recipe)
    )

    return remote
  }

  /**
   * Migrate a recipe from old flat structure to new sections structure
   * Handles recipes that already have sections (no-op) and old format recipes
   *
   * @param recipe - Recipe to migrate (any format)
   * @returns Recipe with sections structure
   * @private
   */
  private migrateRecipeToSections(recipe: any): Recipe {
    // Already migrated - return as-is
    if (recipe.sections) {
      return recipe as Recipe
    }

    // Old format - migrate to sections
    const migratedRecipe: Recipe = {
      ...recipe,
      sections: [
        {
          name: undefined,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
        },
      ],
    }

    // Clean up old fields (TypeScript will warn if we try to access them)
    delete (migratedRecipe as any).ingredients
    delete (migratedRecipe as any).instructions
    delete (migratedRecipe as any).subRecipes

    return migratedRecipe
  }

  /**
   * Get current local state snapshot
   * @private
   */
  private async getLocalSnapshot(): Promise<SyncData> {
    const lastModified = await this.db.getLastModified()
    return {
      recipes: await this.db.recipes.toArray(),
      mealPlans: await this.db.mealPlans.toArray(),
      ingredients: await this.db.ingredients.toArray(),
      groceryLists: await this.db.groceryLists.toArray(),
      groceryItems: await this.db.groceryItems.toArray(),
      lastModified,
      version: 1,
    }
  }

  /**
   * Merge local and remote data using Last Write Wins (LWW) strategy
   * Handles soft deletes: items with isDeleted are kept if they have the latest updatedAt
   * No user input needed - automatically resolves conflicts based on updatedAt timestamp
   *
   * @param local - Local data snapshot
   * @param remote - Remote data snapshot
   * @returns Merged SyncData
   * @private
   */
  private async mergeWithLWW(
    local: SyncData,
    remote: SyncData
  ): Promise<SyncData> {
    // Merge all entity types
    const merged: SyncData = {
      recipes: this.mergeLWWItems(local.recipes, remote.recipes),
      ingredients: this.mergeLWWItems(local.ingredients, remote.ingredients),
      mealPlans: this.mergeLWWItems(local.mealPlans, remote.mealPlans),
      groceryLists: this.mergeLWWItems(local.groceryLists, remote.groceryLists),
      groceryItems: this.mergeLWWItems(local.groceryItems, remote.groceryItems),
      lastModified: Math.max(local.lastModified, remote.lastModified),
      version: 1,
    }

    return merged
  }

  /**
   * Generic merge function using Last Write Wins strategy
   * Compares items by updatedAt timestamp and keeps the most recent version
   *
   * @param localItems - Local items
   * @param remoteItems - Remote items
   * @returns Merged array with latest versions of all items
   * @private
   */
  private mergeLWWItems<T extends { id: string; updatedAt: number }>(
    localItems: T[],
    remoteItems: T[]
  ): T[] {
    const itemMap = new Map<string, T>()

    // Add all local items
    for (const item of localItems) {
      itemMap.set(item.id, item)
    }

    // Merge with remote items using LWW
    for (const item of remoteItems) {
      const existing = itemMap.get(item.id)
      if (!existing) {
        // New item from remote
        itemMap.set(item.id, item)
      } else if (item.updatedAt > existing.updatedAt) {
        // Remote is newer - use it (even if deleted)
        itemMap.set(item.id, item)
      }
      // If equal or local is newer, keep local
    }

    return Array.from(itemMap.values())
  }

  /**
   * Apply merged data to database
   * @private
   */
  private async applyMergedData(merged: SyncData): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.recipes,
        this.db.mealPlans,
        this.db.ingredients,
        this.db.groceryLists,
        this.db.groceryItems,
        this.db.metadata,
      ],
      async () => {
        await this.db.recipes.clear()
        await this.db.recipes.bulkAdd(merged.recipes)

        await this.db.mealPlans.clear()
        await this.db.mealPlans.bulkAdd(merged.mealPlans)

        await this.db.ingredients.clear()
        await this.db.ingredients.bulkAdd(merged.ingredients)

        await this.db.groceryLists.clear()
        await this.db.groceryLists.bulkAdd(merged.groceryLists)

        await this.db.groceryItems.clear()
        await this.db.groceryItems.bulkAdd(merged.groceryItems)

        // Update lastModified to MAX of current and merged
        // This handles race condition: if user made changes during sync,
        // we preserve the newer timestamp
        const currentLastModified = await this.db.getLastModified()
        const newLastModified = Math.max(
          currentLastModified,
          merged.lastModified
        )
        await this.db.metadata.put({
          key: 'lastModified',
          value: newLastModified,
        })
      }
    )
  }

  /**
   * Validate sync file name (pure function)
   * Checks for empty names, invalid characters, and ensures .json.gz extension
   * @param name File name to validate
   * @param existingFileNames Array of existing file names in the same folder
   * @returns Error message if invalid, null if valid
   */
  validateSyncFileName(
    name: string,
    existingFileNames: string[]
  ): string | null {
    if (!name.trim()) {
      return 'File name is required'
    }

    // Check for invalid characters
    if (/[/\\:*?"<>|]/.test(name)) {
      return 'Invalid characters in file name'
    }

    // Ensure .json.gz extension
    const finalName = name.endsWith('.json.gz') ? name : `${name}.json.gz`

    // Check if file already exists
    if (existingFileNames.includes(finalName)) {
      return 'File already exists in this folder'
    }

    return null
  }

  /**
   * Normalize file name by ensuring .json.gz extension (pure function)
   * @param name File name to normalize
   * @returns Normalized file name with .json.gz extension
   */
  normalizeSyncFileName(name: string): string {
    return name.endsWith('.json.gz') ? name : `${name}.json.gz`
  }
}

// Singleton instance for backward compatibility
// Note: New code should inject dependencies instead of using singleton
export const syncService = new SyncService(
  {} as ICloudStorageProvider, // Will be replaced by dependency injection
  db
)
