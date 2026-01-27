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
