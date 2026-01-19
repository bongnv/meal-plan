import { Recipe, RecipeSchema } from '../../types/recipe'
import { z } from 'zod'

const STORAGE_KEY = 'recipes'

export class RecipeStorageService {
  /**
   * Load all recipes from localStorage
   * This should be called once on application mount
   */
  loadRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return []
      }
      const parsed = JSON.parse(data)

      // Validate with Zod
      const recipesSchema = z.array(RecipeSchema)
      const result = recipesSchema.safeParse(parsed)

      if (!result.success) {
        console.error('Invalid recipe data in localStorage:', result.error)
        return []
      }

      return result.data
    } catch (error) {
      console.error('Error reading recipes from localStorage:', error)
      return []
    }
  }

  /**
   * Save all recipes to localStorage
   * This should be called by React Context after state updates
   */
  saveRecipes(recipes: Recipe[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
    } catch (error) {
      console.error('Error saving recipes to localStorage:', error)
      // Handle quota exceeded or other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Data not saved.')
      }
    }
  }

  /**
   * Generate a unique ID for a new recipe
   */
  generateId(): string {
    return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
