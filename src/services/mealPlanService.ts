import { db } from '../db/database'
import { generateId } from '../utils/idGenerator'

import type { MealPlanDB } from '../db/database'
import type {
  MealPlan,
  MealType,
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
    return await db.mealPlans.filter(m => m.isDeleted !== true).toArray()
  },

  /**
   * Get all meal plans (alias for useLiveQuery compatibility)
   */
  async getMealPlans(): Promise<MealPlan[]> {
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
   * Delete a meal plan (soft delete)
   */
  async delete(id: string): Promise<void> {
    await db.mealPlans.update(id, { isDeleted: true, updatedAt: Date.now() })
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

  /**
   * Generate array of dates between start and end dates (inclusive)
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of Date objects for each day in range
   */
  generateDateRange(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = []
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  },

  /**
   * Convert Date to local date string (YYYY-MM-DD)
   * @param date Date object
   * @returns ISO date string in local timezone
   */
  getLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  /**
   * Calculate date range based on filter type
   * @param filterType Type of filter ('today', 'nextweek', 'custom')
   * @param customDate Custom date if filter is 'custom'
   * @returns Object with start and end dates (7 days total)
   */
  calculateDateRange(
    filterType: 'today' | 'nextweek' | 'custom',
    customDate?: Date | null
  ): { start: Date; end: Date } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)

    switch (filterType) {
      case 'today':
        // Start from today
        break
      case 'nextweek': {
        // Start from next Monday
        const daysUntilMonday = (8 - start.getDay()) % 7 || 7
        start.setDate(start.getDate() + daysUntilMonday)
        break
      }
      case 'custom':
        if (customDate) {
          start.setTime(customDate.getTime())
        }
        break
    }

    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    return { start, end }
  },

  /**
   * Format date string to long format
   * @param dateString Date string in YYYY-MM-DD format
   * @returns Formatted date string (e.g., "Monday, February 5, 2026")
   */
  formatLongDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },

  /**
   * Group meal plans by date
   * @param mealPlans Array of meal plans
   * @param dates Array of dates to group by
   * @returns Array of grouped meals with date info
   */
  groupMealsByDate(
    mealPlans: MealPlan[],
    dates: Date[]
  ): Array<{ date: string; dateObj: Date; meals: MealPlan[] }> {
    const grouped: Array<{ date: string; dateObj: Date; meals: MealPlan[] }> =
      []

    dates.forEach(day => {
      const dateString = this.getLocalDateString(day)
      const mealsForDay = mealPlans.filter(mp => mp.date === dateString)

      grouped.push({
        date: dateString,
        dateObj: day,
        meals: this.sortMealsByType(mealsForDay),
      })
    })

    return grouped
  },

  /**
   * Sort meals by meal type (breakfast, lunch, dinner, snack)
   * @param meals Array of meal plans
   * @returns Sorted array of meal plans
   */
  sortMealsByType(meals: MealPlan[]): MealPlan[] {
    const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }
    return [...meals].sort((a, b) => {
      const orderA = order[a.mealType] ?? 999
      const orderB = order[b.mealType] ?? 999
      return orderA - orderB
    })
  },

  /**
   * Count recipe-based meals in a date range
   * @param mealPlans Array of all meal plans
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of recipe meals in range
   */
  countRecipeMealsInRange(
    mealPlans: MealPlan[],
    startDate: Date,
    endDate: Date
  ): number {
    const startDateStr = this.getLocalDateString(startDate)
    const endDateStr = this.getLocalDateString(endDate)

    return mealPlans.filter(
      mp =>
        mp.type === 'recipe' &&
        'recipeId' in mp &&
        mp.recipeId &&
        mp.date >= startDateStr &&
        mp.date <= endDateStr
    ).length
  },

  /**
   * Determine default meal type for a date based on existing meals (pure function)
   * Returns 'lunch' if no meals exist or if lunch is missing
   * Returns 'dinner' if lunch exists but dinner is missing
   * Returns 'lunch' if both exist (can be changed by user)
   * @param mealPlans Array of all meal plans
   * @param date Date string (YYYY-MM-DD)
   * @returns Default meal type
   */
  determineDefaultMealType(mealPlans: MealPlan[], date: string): MealType {
    const existingMeals = mealPlans.filter(mp => mp.date === date)

    if (existingMeals.length === 0) {
      return 'lunch'
    }

    const hasLunch = existingMeals.some(mp => mp.mealType === 'lunch')
    const hasDinner = existingMeals.some(mp => mp.mealType === 'dinner')

    if (!hasLunch) {
      return 'lunch'
    } else if (!hasDinner) {
      return 'dinner'
    } else {
      // Both exist, default to lunch (user can change)
      return 'lunch'
    }
  },
})

// Singleton instance
export const mealPlanService = createMealPlanService(db)
