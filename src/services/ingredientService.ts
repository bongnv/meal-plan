import { db } from '@/db/database'
import { generateId } from '@/utils/idGenerator'

import type { MealPlanDB } from '@/db/database'
import type { Ingredient, IngredientFormValues } from '@/types/ingredient'

/**
 * Ingredient Service
 * Stateless business logic for ingredient operations
 * Database instance injected via constructor
 */
export const createIngredientService = (db: MealPlanDB) => ({
  /**
   * Get all ingredients
   */
  async getAll(): Promise<Ingredient[]> {
    return await db.ingredients.filter(i => i.isDeleted !== true).toArray()
  },

  /**
   * Get all ingredients (alias for useLiveQuery compatibility)
   */
  async getIngredients(): Promise<Ingredient[]> {
    return await db.ingredients.toArray()
  },

  /**
   * Get ingredient by ID
   */
  async getById(id: string): Promise<Ingredient | undefined> {
    return await db.ingredients.get(id)
  },

  /**
   * Add a new ingredient
   */
  async add(ingredient: IngredientFormValues): Promise<string> {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.ingredients.add(newIngredient)
    await db.updateLastModified()
    return newIngredient.id
  },

  /**
   * Add multiple ingredients
   */
  async addMany(ingredients: IngredientFormValues[]): Promise<string[]> {
    const newIngredients: Ingredient[] = ingredients.map(ing => ({
      ...ing,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
    await db.ingredients.bulkAdd(newIngredients)
    await db.updateLastModified()
    return newIngredients.map(ing => ing.id)
  },

  /**
   * Update an existing ingredient
   */
  async update(ingredient: Ingredient): Promise<void> {
    await db.ingredients.put({ ...ingredient, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Delete an ingredient (soft delete)
   */
  async delete(id: string): Promise<void> {
    await db.ingredients.update(id, { isDeleted: true, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Replace all ingredients (used for sync)
   */
  async replaceAll(ingredients: Ingredient[]): Promise<void> {
    await db.transaction('rw', db.ingredients, async () => {
      await db.ingredients.clear()
      await db.ingredients.bulkAdd(ingredients)
    })
    await db.updateLastModified()
  },

  /**
   * Get last modified timestamp
   */
  async getLastModified(): Promise<number> {
    return await db.getLastModified()
  },

  /**
   * Filter ingredients by search text and category (pure function)
   * @param ingredients Array of ingredients to filter
   * @param searchText Text to search in ingredient name
   * @param category Category to filter by (undefined or 'all' = no category filter)
   * @returns Filtered array of ingredients
   */
  filterIngredients(
    ingredients: Ingredient[],
    searchText: string,
    category?: string
  ): Ingredient[] {
    const lowerSearchText = searchText.toLowerCase()

    return ingredients.filter(ingredient => {
      // Filter by search text
      const matchesSearch =
        !searchText || ingredient.name.toLowerCase().includes(lowerSearchText)

      // Filter by category
      const matchesCategory =
        !category || category === 'all' || ingredient.category === category

      return matchesSearch && matchesCategory
    })
  },
})

// Singleton instance
export const ingredientService = createIngredientService(db)
