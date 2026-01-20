import { z } from 'zod'

import { IngredientItemSchema, type IngredientItem } from '../../types/recipe'

const STORAGE_KEY = 'ingredients'

export class IngredientStorageService {
  static loadIngredients(): IngredientItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []

      const parsed = JSON.parse(data)
      const validated = z.array(IngredientItemSchema).safeParse(parsed)

      if (!validated.success) {
        console.error('Invalid ingredient data in localStorage:', validated.error)
        return []
      }

      return validated.data
    } catch (error) {
      console.error('Error loading ingredients from localStorage:', error)
      return []
    }
  }

  static saveIngredients(ingredients: IngredientItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
  }

  static generateId(): string {
    return crypto.randomUUID()
  }
}
