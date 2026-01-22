import { createContext, useContext, useState, type ReactNode } from 'react'

import { generateId } from '../utils/idGenerator'
import { MealPlanStorageService } from '../utils/storage/mealPlanStorage'

import type {
  MealPlan,
  CopyOptions,
  CopyResult,
  CopyPreviewItem,
  ConflictResolution,
} from '../types/mealPlan'

interface MealPlanContextType {
  mealPlans: MealPlan[]
  loading: boolean
  error: string | null
  getMealPlanById: (id: string) => MealPlan | undefined
  addMealPlan: (mealPlan: Omit<MealPlan, 'id'>) => void
  updateMealPlan: (mealPlan: MealPlan) => void
  deleteMealPlan: (id: string) => void
  copyMealPlan: (
    id: string,
    options: CopyOptions,
    conflictResolution?: ConflictResolution
  ) => string[]
  generateCopyPreview: (id: string, options: CopyOptions) => CopyResult
  replaceAllMealPlans: (mealPlans: MealPlan[]) => void
  getLastModified: () => number
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(
  undefined
)

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [storageService] = useState(() => new MealPlanStorageService())

  // Load meal plans and capture any initialization error
  const [mealPlansState, setMealPlansState] = useState<{
    mealPlans: MealPlan[]
    error: string | null
  }>(() => {
    try {
      return {
        mealPlans: storageService.loadMealPlans(),
        error: null,
      }
    } catch (err) {
      console.error('Failed to load meal plans:', err)
      return {
        mealPlans: [],
        error: 'Failed to load meal plans',
      }
    }
  })

  const mealPlans = mealPlansState.mealPlans
  const setMealPlans = (newMealPlans: MealPlan[]) => {
    setMealPlansState({ mealPlans: newMealPlans, error: mealPlansState.error })
  }

  const [loading, _setLoading] = useState(false)
  const [error, setError] = useState<string | null>(mealPlansState.error)
  const [lastModified, setLastModified] = useState<number>(() => Date.now())

  // Get meal plan by ID from in-memory state
  const getMealPlanById = (id: string): MealPlan | undefined => {
    return mealPlans.find(mp => mp.id === id)
  }

  // Add meal plan to in-memory state and persist
  const addMealPlan = (mealPlan: Omit<MealPlan, 'id'>): void => {
    try {
      const newMealPlan: MealPlan = {
        ...mealPlan,
        id: generateId(),
      } as MealPlan
      const updatedMealPlans = [...mealPlans, newMealPlan]
      setMealPlans(updatedMealPlans)
      storageService.saveMealPlans(updatedMealPlans)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to add meal plan:', err)
      setError('Failed to add meal plan')
    }
  }

  // Update meal plan in in-memory state and persist
  const updateMealPlan = (mealPlan: MealPlan): void => {
    try {
      const index = mealPlans.findIndex(mp => mp.id === mealPlan.id)
      if (index === -1) {
        return // Meal plan not found, do nothing
      }
      const updatedMealPlans = [...mealPlans]
      updatedMealPlans[index] = mealPlan
      setMealPlans(updatedMealPlans)
      storageService.saveMealPlans(updatedMealPlans)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to update meal plan:', err)
      setError('Failed to update meal plan')
    }
  }

  // Delete meal plan from in-memory state and persist
  const deleteMealPlan = (id: string): void => {
    try {
      const updatedMealPlans = mealPlans.filter(mealPlan => mealPlan.id !== id)
      if (updatedMealPlans.length === mealPlans.length) {
        return // Meal plan not found, do nothing
      }
      setMealPlans(updatedMealPlans)
      storageService.saveMealPlans(updatedMealPlans)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to delete meal plan:', err)
      setError('Failed to delete meal plan')
    }
  }

  // Generate target dates based on copy options
  const generateTargetDates = (options: CopyOptions): string[] => {
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
  }

  // Generate preview with conflict detection
  const generateCopyPreview = (
    id: string,
    options: CopyOptions
  ): CopyResult => {
    const sourceMeal = getMealPlanById(id)
    if (!sourceMeal) {
      return { targetDates: [], conflicts: [], preview: [] }
    }

    const targetDates = generateTargetDates(options)
    const preview: CopyPreviewItem[] = []
    const conflicts: CopyPreviewItem[] = []

    targetDates.forEach(date => {
      const existingMeal = mealPlans.find(
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
  }

  // Copy meal plan with conflict resolution
  const copyMealPlan = (
    id: string,
    options: CopyOptions,
    conflictResolution: ConflictResolution = 'skip'
  ): string[] => {
    try {
      const sourceMeal = getMealPlanById(id)
      if (!sourceMeal) {
        return []
      }

      const copyResult = generateCopyPreview(id, options)

      // Handle cancel resolution
      if (conflictResolution === 'cancel' && copyResult.conflicts.length > 0) {
        return []
      }

      const copiedIds: string[] = []
      let updatedMealPlans = [...mealPlans]

      copyResult.preview.forEach(previewItem => {
        if (previewItem.hasConflict) {
          if (conflictResolution === 'skip') {
            return // Skip this date
          } else if (conflictResolution === 'replace') {
            // Remove existing meal
            updatedMealPlans = updatedMealPlans.filter(
              mp =>
                !(
                  mp.date === previewItem.date &&
                  mp.mealType === sourceMeal.mealType
                )
            )
          }
        }

        // Create new meal plan
        const newId = generateId()
        const newMealPlan: MealPlan = {
          ...sourceMeal,
          id: newId,
          date: previewItem.date,
        }
        updatedMealPlans.push(newMealPlan)
        copiedIds.push(newId)
      })

      setMealPlans(updatedMealPlans)
      storageService.saveMealPlans(updatedMealPlans)
      setError(null)

      return copiedIds
    } catch (err) {
      console.error('Failed to copy meal plan:', err)
      setError('Failed to copy meal plan')
      return []
    }
  }

  // Replace all meal plans (used for sync)
  const replaceAllMealPlans = (newMealPlans: MealPlan[]): void => {
    try {
      setMealPlans(newMealPlans)
      storageService.saveMealPlans(newMealPlans)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to replace meal plans:', err)
      setError('Failed to replace meal plans')
    }
  }

  // Get last modified timestamp
  const getLastModified = (): number => {
    return lastModified
  }

  return (
    <MealPlanContext.Provider
      value={{
        mealPlans,
        loading,
        error,
        getMealPlanById,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
        copyMealPlan,
        generateCopyPreview,
        replaceAllMealPlans,
        getLastModified,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  )
}

export function useMealPlans(): MealPlanContextType {
  const context = useContext(MealPlanContext)
  if (context === undefined) {
    throw new Error('useMealPlans must be used within a MealPlanProvider')
  }
  return context
}
