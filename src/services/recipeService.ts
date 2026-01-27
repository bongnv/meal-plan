import { db } from '../db/database'
import { generateId } from '../utils/idGenerator'

import type { MealPlanDB } from '../db/database'
import type { Recipe } from '../types/recipe'

/**
 * Recipe Service
 * Stateless business logic for recipe operations
 * Database instance injected via constructor
 */
export const createRecipeService = (db: MealPlanDB) => ({
  /**
   * Get all recipes
   */
  async getAll(): Promise<Recipe[]> {
    return await db.recipes.toArray()
  },

  /**
   * Get recipe by ID
   */
  async getById(id: string): Promise<Recipe | undefined> {
    return await db.recipes.get(id)
  },

  /**
   * Add a new recipe
   */
  async add(recipe: Omit<Recipe, 'id'>): Promise<string> {
    const newRecipe: Recipe = {
      ...recipe,
      id: generateId(),
    }
    await db.recipes.add(newRecipe)
    await db.updateLastModified()
    return newRecipe.id
  },

  /**
   * Update an existing recipe
   */
  async update(recipe: Recipe): Promise<void> {
    await db.recipes.put({ ...recipe, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Delete a recipe
   */
  async delete(id: string): Promise<void> {
    await db.recipes.delete(id)
    await db.updateLastModified()
  },

  /**
   * Replace all recipes (used for sync)
   */
  async replaceAll(recipes: Recipe[]): Promise<void> {
    await db.transaction('rw', db.recipes, async () => {
      await db.recipes.clear()
      await db.recipes.bulkAdd(recipes)
    })
    await db.updateLastModified()
  },

  /**
   * Search recipes by name (case-insensitive)
   */
  async searchByName(query: string): Promise<Recipe[]> {
    const lowerQuery = query.toLowerCase()
    return await db.recipes
      .filter(recipe => recipe.name.toLowerCase().includes(lowerQuery))
      .toArray()
  },

  /**
   * Filter recipes by tag
   */
  async filterByTag(tag: string): Promise<Recipe[]> {
    return await db.recipes.where('tags').equals(tag).toArray()
  },

  /**
   * Get all unique tags from recipes
   */
  async getAllTags(): Promise<string[]> {
    const recipes = await db.recipes.toArray()
    const tagSet = new Set<string>()
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  },

  /**
   * Get last modified timestamp
   */
  async getLastModified(): Promise<number> {
    return await db.getLastModified()
  },
})

// Singleton instance
export const recipeService = createRecipeService(db)
