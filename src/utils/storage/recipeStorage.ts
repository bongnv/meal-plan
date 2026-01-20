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
   * Returns empty array if no recipes found
   * Validates data with Zod schema
   */
  loadRecipes(): Recipe[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    const validated = z.array(RecipeSchema).parse(parsed)
    return validated
  }

  /**
   * Save recipes to localStorage
   * Overwrites existing recipes
   * Validates data with Zod schema before saving
   */
  saveRecipes(recipes: Recipe[]): void {
    const validated = z.array(RecipeSchema).parse(recipes)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
  }
}
