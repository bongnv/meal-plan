import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { db } from '@/db/database'
import { createGroceryListService } from '@/services/groceryListService'
import { createIngredientService } from '@/services/ingredientService'
import { createMealPlanService } from '@/services/mealPlanService'
import { createRecipeService } from '@/services/recipeService'

/**
 * Services Context
 *
 * Provides dependency injection for all services throughout the application.
 * Services are stateless and contain business logic for database operations.
 */
interface Services {
  recipeService: ReturnType<typeof createRecipeService>
  mealPlanService: ReturnType<typeof createMealPlanService>
  groceryListService: ReturnType<typeof createGroceryListService>
  ingredientService: ReturnType<typeof createIngredientService>
}

const ServicesContext = createContext<Services | undefined>(undefined)

interface ServicesProviderProps {
  children: ReactNode
}

/**
 * ServicesProvider
 *
 * Creates and provides service instances to the component tree.
 * Services are instantiated once and shared across all components.
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  const services = useMemo<Services>(
    () => ({
      recipeService: createRecipeService(db),
      mealPlanService: createMealPlanService(db),
      groceryListService: createGroceryListService(db),
      ingredientService: createIngredientService(db),
    }),
    []
  )

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  )
}

/**
 * useServices Hook
 *
 * Access services from any component within ServicesProvider.
 * Throws an error if used outside of ServicesProvider.
 *
 * @example
 * const { recipeService, mealPlanService } = useServices()
 * const recipes = await recipeService.getAll()
 */
export function useServices(): Services {
  const context = useContext(ServicesContext)
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider')
  }
  return context
}
