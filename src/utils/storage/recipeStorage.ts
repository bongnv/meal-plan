import { z } from 'zod'

import { RecipeSchema, type Recipe } from '../../types/recipe'
import { migrateRecipes } from '../migration/recipeMigration'

import type { Ingredient } from '../../types/ingredient'

const STORAGE_KEY = 'recipes'

/**
 * RecipeStorageService
 * Handles persistence of recipes to localStorage with Zod validation
 * Applies migration to ensure all recipe ingredients have units
 */
export class RecipeStorageService {
  /**
   * Load all recipes from localStorage
   * Returns empty array if no recipes found
   * Validates data with Zod schema and applies migration
   * 
   * @param ingredients - Ingredient library for migration (copying units to recipe ingredients)
   */
  loadRecipes(ingredients: Ingredient[] = []): Recipe[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    const validated = z.array(RecipeSchema).parse(parsed)
    
    // Apply migration to ensure all recipe ingredients have units
    const migrated = migrateRecipes(validated, ingredients)
    
    return migrated
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
