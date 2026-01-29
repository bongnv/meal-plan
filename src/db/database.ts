import Dexie, { type EntityTable } from 'dexie'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { Ingredient } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

export interface Metadata {
  key: string
  value: number
}

/**
 * MealPlanDB - Dexie database for offline-first meal planning
 *
 * Database schema with indexed fields for efficient queries.
 * Replaces localStorage with IndexedDB for better performance and structure.
 */
export class MealPlanDB extends Dexie {
  // Entity tables with TypeScript types
  recipes!: EntityTable<Recipe, 'id'>
  ingredients!: EntityTable<Ingredient, 'id'>
  mealPlans!: EntityTable<MealPlan, 'id'>
  groceryLists!: EntityTable<GroceryList, 'id'>
  groceryItems!: EntityTable<GroceryItem, 'id'>
  metadata!: EntityTable<Metadata, 'key'>

  constructor() {
    super('MealPlanDB')

    // Define database schema version 1
    this.version(1).stores({
      // Recipes: indexed by id, name for search, tags for filtering
      recipes: 'id, name, *tags',

      // Ingredients: indexed by id, name, and category
      ingredients: 'id, name, category',

      // MealPlans: indexed by id, date for calendar views, type for filtering
      mealPlans: 'id, date, mealType, type',

      // GroceryLists: indexed by id and date range for filtering
      groceryLists: 'id, dateRange.start, dateRange.end',

      // GroceryItems: indexed by id, listId for filtering by list, category for grouping
      groceryItems: 'id, listId, category, checked',

      // Metadata: key-value store for lastModified timestamps
      metadata: 'key',
    })

    // Version 2: Add sections to recipes (breaking change)
    // Migration: Convert flat ingredients/instructions to single unnamed section
    this.version(2)
      .stores({
        // Same schema, no index changes
        recipes: 'id, name, *tags',
        ingredients: 'id, name, category',
        mealPlans: 'id, date, mealType, type',
        groceryLists: 'id, dateRange.start, dateRange.end',
        groceryItems: 'id, listId, category, checked',
        metadata: 'key',
      })
      .upgrade(async tx => {
        // Migrate all recipes from flat structure to sections
        const recipes = await tx.table('recipes').toArray()

        for (const recipe of recipes) {
          // Skip if already migrated (has sections field)
          if (recipe.sections) {
            continue
          }

          // Migrate: flat structure → single unnamed section
          const migratedRecipe = {
            ...recipe,
            sections: [
              {
                name: undefined,
                ingredients: recipe.ingredients || [],
                instructions: recipe.instructions || [],
              },
            ],
          }

          // Remove old flat fields (Dexie will ignore, but cleaner)
          delete migratedRecipe.ingredients
          delete migratedRecipe.instructions
          delete migratedRecipe.subRecipes // Also remove subRecipes

          await tx.table('recipes').put(migratedRecipe)
        }

        // Store schema version in metadata
        await tx.table('metadata').put({
          key: 'schemaVersion',
          value: 2,
        })
      })
  }

  // Helper methods for lastModified tracking
  // Uses single 'data' key for all data modifications
  async getLastModified(): Promise<number> {
    const record = await this.metadata.get('lastModified')
    return record?.value ?? 0
  }

  async updateLastModified(): Promise<void> {
    await this.metadata.put({ key: 'lastModified', value: Date.now() })
  }

  // Clear all data from database
  async clearAllData(): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.recipes,
        this.mealPlans,
        this.ingredients,
        this.groceryLists,
        this.groceryItems,
        this.metadata,
      ],
      async () => {
        await this.recipes.clear()
        await this.mealPlans.clear()
        await this.ingredients.clear()
        await this.groceryLists.clear()
        await this.groceryItems.clear()
        await this.metadata.clear()
      }
    )
  }
}

// Export singleton instance
export const db = new MealPlanDB()
