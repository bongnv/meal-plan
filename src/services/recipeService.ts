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

  /**
   * Extract all unique tags from an array of recipes (pure function)
   * @param recipes Array of recipes
   * @returns Sorted array of unique tags
   */
  extractUniqueTags(recipes: Recipe[]): string[] {
    const tagSet = new Set<string>()
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  },

  /**
   * Filter recipes by search text and tags (pure function)
   * @param recipes Array of recipes to filter
   * @param searchText Text to search in recipe name
   * @param selectedTags Tags to filter by (empty array = no tag filter)
   * @returns Filtered array of recipes
   */
  filterRecipes(
    recipes: Recipe[],
    searchText: string,
    selectedTags: string[] = []
  ): Recipe[] {
    const lowerSearchText = searchText.toLowerCase()

    return recipes.filter(recipe => {
      // Filter by search text
      const matchesSearch =
        !searchText || recipe.name.toLowerCase().includes(lowerSearchText)

      // Filter by tags (if any tags selected)
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some(tag => recipe.tags?.includes(tag))

      return matchesSearch && matchesTags
    })
  },

  /**
   * Find recipe by ID from array (pure function)
   * @param recipes Array of recipes
   * @param recipeId Recipe ID to find
   * @returns Recipe if found, undefined otherwise
   */
  findRecipeById(recipes: Recipe[], recipeId: string): Recipe | undefined {
    return recipes.find(r => r.id === recipeId)
  },
})

// Singleton instance
export const recipeService = createRecipeService(db)
