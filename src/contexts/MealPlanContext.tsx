import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

import { generateId } from '../utils/idGenerator'
import { MealPlanStorageService } from '../utils/storage/mealPlanStorage'

import type { MealPlan } from '../types/mealPlan'

interface MealPlanContextType {
  mealPlans: MealPlan[]
  loading: boolean
  error: string | null
  addMealPlan: (mealPlan: Omit<MealPlan, 'id'>) => void
  updateMealPlan: (mealPlan: MealPlan) => void
  deleteMealPlan: (id: string) => void
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined)

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storageService] = useState(() => new MealPlanStorageService())

  // Load meal plans on mount
  useEffect(() => {
    try {
      const loadedMealPlans = storageService.loadMealPlans()
      setMealPlans(loadedMealPlans)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load meal plans:', err)
      setError('Failed to load meal plans')
      setLoading(false)
    }
  }, [storageService])

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
      setError(null)
    } catch (err) {
      console.error('Failed to delete meal plan:', err)
      setError('Failed to delete meal plan')
    }
  }

  return (
    <MealPlanContext.Provider
      value={{
        mealPlans,
        loading,
        error,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMealPlans(): MealPlanContextType {
  const context = useContext(MealPlanContext)
  if (context === undefined) {
    throw new Error('useMealPlans must be used within a MealPlanProvider')
  }
  return context
}
