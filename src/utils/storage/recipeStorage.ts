import { z } from 'zod'

import { RecipeSchema, type Recipe } from '../../types/recipe'

const STORAGE_KEY = 'recipes'

/**
 * RecipeStorageService
 * Handles persistence of recipes to localStorage with Zod validation
 */
export class RecipeStorageService {
  /**
   * Load all recipes from localStorage
   * Returns empty array if no recipes found or on error
   * Validates data with Zod schema
   */
  loadRecipes(): Recipe[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      const parsed = JSON.parse(stored)
      const validated = z.array(RecipeSchema).parse(parsed)
      return validated
    } catch (error) {
      console.error('Error loading recipes from localStorage:', error)
      return []
    }
  }

  /**
   * Save recipes to localStorage
   * Overwrites existing recipes
   * Validates data with Zod schema before saving
   */
  saveRecipes(recipes: Recipe[]): void {
    try {
      const validated = z.array(RecipeSchema).parse(recipes)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
    } catch (error) {
      console.error('Error saving recipes to localStorage:', error)
    }
  }
}
