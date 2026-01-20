import { z } from 'zod'

import { IngredientSchema } from '../../types/ingredient'

import type { Ingredient } from '../../types/ingredient'

const STORAGE_KEY = 'ingredients'

export class IngredientStorageService {
  /**
   * Generate a unique ID for an ingredient
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Load all ingredients from localStorage
   */
  loadIngredients(): Ingredient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return []
      }

      const parsed = JSON.parse(data)

      // Validate with Zod
      const IngredientsArraySchema = z.array(IngredientSchema)
      const validated = IngredientsArraySchema.parse(parsed)

      return validated
    } catch (error) {
      console.error('Error loading ingredients from localStorage:', error)
      return []
    }
  }

  /**
   * Save ingredients to localStorage
   */
  saveIngredients(ingredients: Ingredient[]): void {
    // Validate with Zod before saving
    const IngredientsArraySchema = z.array(IngredientSchema)
    const validated = IngredientsArraySchema.parse(ingredients)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
  }
}
