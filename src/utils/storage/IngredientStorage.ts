import { z } from 'zod'

import { IngredientSchema } from '../../types/ingredient'

import type { Ingredient } from '../../types/ingredient'

const STORAGE_KEY = 'ingredients'

export class IngredientStorageService {
  /**
   * Load all ingredients from localStorage
   */
  loadIngredients(): Ingredient[] {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return []
    }

    const parsed = JSON.parse(data)

    // Validate with Zod
    const IngredientsArraySchema = z.array(IngredientSchema)
    const validated = IngredientsArraySchema.parse(parsed)

    return validated
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
