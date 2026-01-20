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
   * Returns empty array if no meal plans found
   * Validates data with Zod schema
   */
  loadMealPlans(): MealPlan[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    const validated = z.array(MealPlanSchema).parse(parsed)
    return validated
  }

  /**
   * Save meal plans to localStorage
   * Overwrites existing meal plans
   * Validates data with Zod schema before saving
   */
  saveMealPlans(mealPlans: MealPlan[]): void {
    const validated = z.array(MealPlanSchema).parse(mealPlans)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
  }
}
