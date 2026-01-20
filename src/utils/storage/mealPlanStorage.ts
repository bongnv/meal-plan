import { z } from 'zod'

import { MealPlanSchema, type MealPlan } from '../../types/mealPlan'

const STORAGE_KEY = 'mealPlans'

/**
 * MealPlanStorageService
 * Handles persistence of meal plans to localStorage with Zod validation
 */
export class MealPlanStorageService {
  /**
   * Load all meal plans from localStorage
   * Returns empty array if no meal plans found or on error
   * Validates data with Zod schema
   */
  loadMealPlans(): MealPlan[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      const parsed = JSON.parse(stored)
      const validated = z.array(MealPlanSchema).parse(parsed)
      return validated
    } catch (error) {
      console.error('Error loading meal plans from localStorage:', error)
      return []
    }
  }

  /**
   * Save meal plans to localStorage
   * Overwrites existing meal plans
   * Validates data with Zod schema before saving
   */
  saveMealPlans(mealPlans: MealPlan[]): void {
    try {
      const validated = z.array(MealPlanSchema).parse(mealPlans)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
    } catch (error) {
      console.error('Error saving meal plans to localStorage:', error)
    }
  }
}
