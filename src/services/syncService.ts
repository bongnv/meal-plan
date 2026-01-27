import { db, type MealPlanDB } from '../db/database'
import {
  migrateRecipes,
  migrateRecipeTime,
} from '../utils/migration/recipeMigration'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { Ingredient } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

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
 * MergeResult contains the merged data
 */
export interface MergeResult {
  merged: SyncData
}

/**
 * SyncService
 * Stateless business logic for syncing data with Last Write Wins (LWW) strategy
 * Database instance injected via constructor
 */
export const createSyncService = (db: MealPlanDB) => ({
  /**
   * Get current local state snapshot
   */
  async getLocalSnapshot(): Promise<SyncData> {
    const lastModified = await db.getLastModified()
    return {
      recipes: await db.recipes.toArray(),
      mealPlans: await db.mealPlans.toArray(),
      ingredients: await db.ingredients.toArray(),
      groceryLists: await db.groceryLists.toArray(),
      groceryItems: await db.groceryItems.toArray(),
      lastModified,
      version: 1,
    }
  },

  /**
   * Apply remote data to local database, migrating if needed
   */
  async applyRemoteData(remote: SyncData): Promise<void> {
    // Apply migrations to remote data (converts old schema to new schema)
    // 1. Ensure all recipe ingredients have units
    const unitMigrated = migrateRecipes(remote.recipes, remote.ingredients)
    // 2. Split totalTime into prepTime and cookTime
    const timeMigrated = migrateRecipeTime(unitMigrated)

    const migratedRemote = {
      ...remote,
      recipes: timeMigrated,
    }

    // Replace all data in database
    await db.transaction(
      'rw',
      [
        db.recipes,
        db.mealPlans,
        db.ingredients,
        db.groceryLists,
        db.groceryItems,
      ],
      async () => {
        await db.recipes.clear()
        await db.recipes.bulkAdd(migratedRemote.recipes)

        await db.mealPlans.clear()
        await db.mealPlans.bulkAdd(migratedRemote.mealPlans)

        await db.ingredients.clear()
        await db.ingredients.bulkAdd(migratedRemote.ingredients)

        await db.groceryLists.clear()
        await db.groceryLists.bulkAdd(migratedRemote.groceryLists)

        await db.groceryItems.clear()
        await db.groceryItems.bulkAdd(migratedRemote.groceryItems)
      }
    )
    await db.updateLastModified()
  },

  /**
   * Merge local and remote data using Last Write Wins (LWW) strategy
   * No user input needed - automatically resolves conflicts based on updatedAt timestamp
   *
   * @param local - Local data snapshot
   * @param remote - Remote data snapshot
   * @returns MergeResult with merged data and conflict information
   */
  async mergeWithLWW(local: SyncData, remote: SyncData): Promise<MergeResult> {
    // Merge recipes using LWW
    const recipeMap = new Map<string, Recipe>()
    for (const recipe of local.recipes) {
      recipeMap.set(recipe.id, recipe)
    }
    for (const recipe of remote.recipes) {
      const existing = recipeMap.get(recipe.id)
      if (!existing) {
        // New recipe from remote
        recipeMap.set(recipe.id, recipe)
      } else if (recipe.updatedAt > existing.updatedAt) {
        // Remote is newer - use it
        recipeMap.set(recipe.id, recipe)
      }
      // If equal or local is newer, keep local
    }

    // Merge ingredients using LWW
    const ingredientMap = new Map<string, Ingredient>()
    for (const ingredient of local.ingredients) {
      ingredientMap.set(ingredient.id, ingredient)
    }
    for (const ingredient of remote.ingredients) {
      const existing = ingredientMap.get(ingredient.id)
      if (!existing) {
        ingredientMap.set(ingredient.id, ingredient)
      } else if (ingredient.updatedAt > existing.updatedAt) {
        ingredientMap.set(ingredient.id, ingredient)
      }
    }

    // Merge meal plans using LWW
    const mealPlanMap = new Map<string, MealPlan>()
    for (const mealPlan of local.mealPlans) {
      mealPlanMap.set(mealPlan.id, mealPlan)
    }
    for (const mealPlan of remote.mealPlans) {
      const existing = mealPlanMap.get(mealPlan.id)
      if (!existing) {
        mealPlanMap.set(mealPlan.id, mealPlan)
      } else if (mealPlan.updatedAt > existing.updatedAt) {
        mealPlanMap.set(mealPlan.id, mealPlan)
      }
    }

    // Merge grocery lists using LWW
    const groceryListMap = new Map<string, GroceryList>()
    for (const list of local.groceryLists) {
      groceryListMap.set(list.id, list)
    }
    for (const list of remote.groceryLists) {
      const existing = groceryListMap.get(list.id)
      if (!existing) {
        groceryListMap.set(list.id, list)
      } else if (list.updatedAt > existing.updatedAt) {
        groceryListMap.set(list.id, list)
      }
    }

    // Merge grocery items using LWW
    const groceryItemMap = new Map<string, GroceryItem>()
    for (const item of local.groceryItems) {
      groceryItemMap.set(item.id, item)
    }
    for (const item of remote.groceryItems) {
      const existing = groceryItemMap.get(item.id)
      if (!existing) {
        groceryItemMap.set(item.id, item)
      } else if (item.updatedAt > existing.updatedAt) {
        groceryItemMap.set(item.id, item)
      }
    }

    const merged: SyncData = {
      recipes: Array.from(recipeMap.values()),
      ingredients: Array.from(ingredientMap.values()),
      mealPlans: Array.from(mealPlanMap.values()),
      groceryLists: Array.from(groceryListMap.values()),
      groceryItems: Array.from(groceryItemMap.values()),
      lastModified: Date.now(),
      version: 1,
    }

    return { merged }
  },

  /**
   * Apply merged data to database
   */
  async applyMergedData(merged: SyncData): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.recipes,
        db.mealPlans,
        db.ingredients,
        db.groceryLists,
        db.groceryItems,
      ],
      async () => {
        await db.recipes.clear()
        await db.recipes.bulkAdd(merged.recipes)

        await db.mealPlans.clear()
        await db.mealPlans.bulkAdd(merged.mealPlans)

        await db.ingredients.clear()
        await db.ingredients.bulkAdd(merged.ingredients)

        await db.groceryLists.clear()
        await db.groceryLists.bulkAdd(merged.groceryLists)

        await db.groceryItems.clear()
        await db.groceryItems.bulkAdd(merged.groceryItems)

        // Update lastModified to match the merged data timestamp
        await db.metadata.put({
          key: 'lastModified',
          value: merged.lastModified,
        })
      }
    )
  },
})

// Singleton instance
export const syncService = createSyncService(db)
