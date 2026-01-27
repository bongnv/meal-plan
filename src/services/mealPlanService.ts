import { db } from '../db/database'
import { generateId } from '../utils/idGenerator'

import type { MealPlanDB } from '../db/database'
import type {
  MealPlan,
  CopyOptions,
  CopyResult,
  CopyPreviewItem,
  ConflictResolution,
} from '../types/mealPlan'

/**
 * Meal Plan Service
 * Stateless business logic for meal plan operations
 * Database instance injected via constructor
 */
export const createMealPlanService = (db: MealPlanDB) => ({
  /**
   * Get all meal plans
   */
  async getAll(): Promise<MealPlan[]> {
    return await db.mealPlans.toArray()
  },

  /**
   * Get meal plan by ID
   */
  async getById(id: string): Promise<MealPlan | undefined> {
    return await db.mealPlans.get(id)
  },

  /**
   * Add a new meal plan
   */
  async add(mealPlan: Omit<MealPlan, 'id'>): Promise<string> {
    const newMealPlan = {
      ...mealPlan,
      id: generateId(),
    } as MealPlan
    await db.mealPlans.add(newMealPlan)
    await db.updateLastModified()
    return newMealPlan.id
  },

  /**
   * Update an existing meal plan
   */
  async update(mealPlan: MealPlan): Promise<void> {
    await db.mealPlans.put({ ...mealPlan, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Delete a meal plan
   */
  async delete(id: string): Promise<void> {
    await db.mealPlans.delete(id)
    await db.updateLastModified()
  },

  /**
   * Replace all meal plans (used for sync)
   */
  async replaceAll(mealPlans: MealPlan[]): Promise<void> {
    await db.transaction('rw', db.mealPlans, async () => {
      await db.mealPlans.clear()
      await db.mealPlans.bulkAdd(mealPlans)
    })
    await db.updateLastModified()
  },

  /**
   * Generate target dates based on copy options
   */
  generateTargetDates(options: CopyOptions): string[] {
    const dates: string[] = []

    // Helper to convert Date to ISO date string (YYYY-MM-DD) in local timezone
    const toISODate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startDate = new Date(options.targetDate)
    startDate.setHours(0, 0, 0, 0)

    if (options.frequency === 'one-time') {
      return [toISODate(startDate)]
    }

    // For recurring patterns, validate end condition
    if (!options.endCondition) {
      return []
    }

    let currentDate = new Date(startDate)
    let count = 0
    const maxIterations = 1000 // Safety limit

    while (count < maxIterations) {
      const dateString = toISODate(currentDate)
      dates.push(dateString)
      count++

      // Check end condition before calculating next date
      if (options.endCondition === 'after-occurrences') {
        if (count >= (options.occurrences || 1)) {
          break
        }
      } else if (options.endCondition === 'until-date' && options.endDate) {
        const endDate = new Date(options.endDate)
        endDate.setHours(0, 0, 0, 0)
        // Check if next iteration would exceed end date
        const nextDate = new Date(currentDate)

        if (options.frequency === 'weekly') {
          const weeksToAdd = options.weeklyInterval || 1
          nextDate.setDate(nextDate.getDate() + 7 * weeksToAdd)
        } else if (options.frequency === 'specific-weekday') {
          nextDate.setDate(nextDate.getDate() + 1)
          const targetWeekday = options.specificWeekday ?? 0
          while (nextDate.getDay() !== targetWeekday) {
            nextDate.setDate(nextDate.getDate() + 1)
          }
        } else if (options.frequency === 'custom-interval') {
          const daysToAdd = options.customIntervalDays || 1
          nextDate.setDate(nextDate.getDate() + daysToAdd)
        }

        if (nextDate > endDate) {
          break
        }
        currentDate = nextDate
        continue
      }

      // Calculate next date based on frequency
      if (options.frequency === 'weekly') {
        const weeksToAdd = options.weeklyInterval || 1
        currentDate.setDate(currentDate.getDate() + 7 * weeksToAdd)
      } else if (options.frequency === 'specific-weekday') {
        // Find next occurrence of specified weekday
        const targetWeekday = options.specificWeekday ?? 0
        currentDate.setDate(currentDate.getDate() + 1)
        while (currentDate.getDay() !== targetWeekday) {
          currentDate.setDate(currentDate.getDate() + 1)
        }
      } else if (options.frequency === 'custom-interval') {
        const daysToAdd = options.customIntervalDays || 1
        currentDate.setDate(currentDate.getDate() + daysToAdd)
      }
    }

    return dates
  },

  /**
   * Generate copy preview with conflict detection
   */
  async generateCopyPreview(
    id: string,
    options: CopyOptions
  ): Promise<CopyResult> {
    const sourceMeal = await db.mealPlans.get(id)
    if (!sourceMeal) {
      return { targetDates: [], conflicts: [], preview: [] }
    }

    const allMealPlans = await db.mealPlans.toArray()
    const targetDates = this.generateTargetDates(options)
    const preview: CopyPreviewItem[] = []
    const conflicts: CopyPreviewItem[] = []

    targetDates.forEach(date => {
      const existingMeal = allMealPlans.find(
        mp => mp.date === date && mp.mealType === sourceMeal.mealType
      )
      const hasConflict = !!existingMeal
      const item: CopyPreviewItem = {
        date,
        hasConflict,
        existingMeal,
      }
      preview.push(item)
      if (hasConflict) {
        conflicts.push(item)
      }
    })

    return { targetDates, conflicts, preview }
  },

  /**
   * Copy meal plan with conflict resolution
   */
  async copyMealPlan(
    id: string,
    options: CopyOptions,
    conflictResolution: ConflictResolution = 'skip'
  ): Promise<string[]> {
    const sourceMeal = await db.mealPlans.get(id)
    if (!sourceMeal) {
      return []
    }

    const copyResult = await this.generateCopyPreview(id, options)

    // Handle cancel resolution
    if (conflictResolution === 'cancel' && copyResult.conflicts.length > 0) {
      return []
    }

    const copiedIds: string[] = []
    const mealPlansToDelete: string[] = []
    const mealPlansToAdd: MealPlan[] = []

    copyResult.preview.forEach(previewItem => {
      if (previewItem.hasConflict) {
        if (conflictResolution === 'skip') {
          return // Skip this date
        } else if (
          conflictResolution === 'replace' &&
          previewItem.existingMeal
        ) {
          // Mark existing meal for deletion
          mealPlansToDelete.push(previewItem.existingMeal.id)
        }
      }

      // Create new meal plan with new ID
      const newMealPlan: MealPlan = {
        ...sourceMeal,
        id: generateId(),
        date: previewItem.date,
      }
      mealPlansToAdd.push(newMealPlan)
      copiedIds.push(newMealPlan.id)
    })

    // Execute operations in transaction
    await db.transaction('rw', db.mealPlans, async () => {
      // Delete conflicting meal plans if replacing
      if (mealPlansToDelete.length > 0) {
        await db.mealPlans.bulkDelete(mealPlansToDelete)
      }
      // Add new meal plans
      if (mealPlansToAdd.length > 0) {
        await db.mealPlans.bulkAdd(mealPlansToAdd)
      }
    })
    await db.updateLastModified()

    return copiedIds
  },

  /**
   * Get last modified timestamp
   */
  async getLastModified(): Promise<number> {
    return await db.getLastModified()
  },
})

// Singleton instance
export const mealPlanService = createMealPlanService(db)
