import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServicesProvider } from '../contexts/ServicesContext'

import { HomePage } from './HomePage'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ServicesProvider>
      <MantineProvider>
        <MemoryRouter>{component}</MemoryRouter>
      </MantineProvider>
    </ServicesProvider>
  )
}

describe('HomePage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useLiveQuery } = await import('dexie-react-hooks')

    // Default: return empty arrays
    vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
      const query = queryFn.toString()
      if (
        query.includes('getActiveRecipes') ||
        query.includes('getActiveRecipes')
      ) {
        return []
      } else if (query.includes('getMealPlans')) {
        return []
      } else if (query.includes('getAllLists')) {
        return []
      } else if (query.includes('getAllItems')) {
        return []
      }
      return []
    })
  })

  describe('Empty States', () => {
    it('should render without crashing', () => {
      renderWithProviders(<HomePage />)
      expect(screen.getByText(/Next Meal/i)).toBeInTheDocument()
    })

    it('should show empty state when no meals are planned', () => {
      renderWithProviders(<HomePage />)
      expect(screen.getByText(/No meals planned yet/i)).toBeInTheDocument()
    })

    it('should show empty state for shopping list when none exist', () => {
      renderWithProviders(<HomePage />)
      expect(screen.getByText(/No active shopping list/i)).toBeInTheDocument()
    })

    it('should show quick action buttons', () => {
      renderWithProviders(<HomePage />)
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()
      const planButtons = screen.getAllByText(/Plan a Meal/i)
      const browseButtons = screen.getAllByText(/Browse Recipes/i)
      expect(planButtons.length).toBeGreaterThan(0)
      expect(browseButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Next Meal Section', () => {
    it('should display the next upcoming meal', async () => {
      // Use tomorrow's date to ensure the meal is in the future
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]

      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: tomorrowDate,
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const mockRecipes: Recipe[] = [
        {
          id: 'recipe1',
          name: 'Chicken Curry',
          description: 'Delicious curry',
          sections: [
            {
              name: undefined,
              ingredients: [],
              instructions: [],
            },
          ],
          servings: 4,
          prepTime: 15,
          cookTime: 30,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (query.includes('getActiveRecipes')) {
          return mockRecipes
        } else if (query.includes('getMealPlans')) {
          return mockMealPlans
        } else if (query.includes('getAllLists')) {
          return []
        } else if (query.includes('getAllItems')) {
          return []
        }
        return []
      })

      renderWithProviders(<HomePage />)

      expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
      expect(screen.getByText('4 servings')).toBeInTheDocument()
    })

    it('should display custom meal text for non-recipe meals', async () => {
      // Use tomorrow's date to ensure the meal is in the future
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]

      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: tomorrowDate,
          mealType: 'dinner',
          type: 'dining-out',
          customText: 'Italian Restaurant',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (query.includes('getMealPlans')) {
          return mockMealPlans
        }
        return []
      })

      renderWithProviders(<HomePage />)

      expect(screen.getByText('Italian Restaurant')).toBeInTheDocument()
      expect(screen.getByText(/Dining Out/i)).toBeInTheDocument()
    })

    it('should navigate to meal plan detail when Next Meal card is clicked', async () => {
      const user = userEvent.setup()
      // Use tomorrow's date to ensure the meal is in the future
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]

      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: tomorrowDate,
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const mockRecipes: Recipe[] = [
        {
          id: 'recipe1',
          name: 'Chicken Curry',
          description: 'Delicious curry',
          sections: [
            {
              name: undefined,
              ingredients: [],
              instructions: [],
            },
          ],
          servings: 4,
          prepTime: 15,
          cookTime: 30,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (
          query.includes('getActiveRecipes') ||
          query.includes('getActiveRecipes')
        ) {
          return mockRecipes
        } else if (query.includes('getMealPlans')) {
          return mockMealPlans
        }
        return []
      })

      renderWithProviders(<HomePage />)

      const mealCard = screen
        .getByText('Chicken Curry')
        .closest('div[style*="cursor: pointer"]')
      expect(mealCard).toBeInTheDocument()

      await user.click(mealCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/meal-plans/1')
    })
  })

  describe('Coming Up Section', () => {
    it('should display upcoming meals', async () => {
      // Use dynamic dates: tomorrow and day after tomorrow to ensure meals are in the future
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]

      const dayAfter = new Date()
      dayAfter.setDate(dayAfter.getDate() + 2)
      const dayAfterDate = dayAfter.toISOString().split('T')[0]

      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: tomorrowDate,
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          date: tomorrowDate,
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe2',
          servings: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          date: dayAfterDate,
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'recipe3',
          servings: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const mockRecipes: Recipe[] = [
        {
          id: 'recipe1',
          name: 'Pasta',
          description: '',
          sections: [
            {
              name: undefined,
              ingredients: [],
              instructions: [],
            },
          ],
          servings: 4,
          prepTime: 10,
          cookTime: 15,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'recipe2',
          name: 'Salad',
          description: '',
          sections: [
            {
              name: undefined,
              ingredients: [],
              instructions: [],
            },
          ],
          servings: 2,
          prepTime: 5,
          cookTime: 0,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'recipe3',
          name: 'Tacos',
          description: '',
          sections: [
            {
              name: undefined,
              ingredients: [],
              instructions: [],
            },
          ],
          servings: 3,
          prepTime: 15,
          cookTime: 20,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (
          query.includes('getActiveRecipes') ||
          query.includes('getActiveRecipes')
        ) {
          return mockRecipes
        } else if (query.includes('getMealPlans')) {
          return mockMealPlans
        }
        return []
      })

      renderWithProviders(<HomePage />)

      expect(screen.getByText('Salad')).toBeInTheDocument()
      expect(screen.getByText('Tacos')).toBeInTheDocument()
    })
  })

  describe('Shopping List Section', () => {
    it('should display active shopping list preview', async () => {
      const mockGroceryLists: GroceryList[] = [
        {
          id: '1',
          name: 'Weekly Groceries',
          dateRange: {
            start: '2026-01-28',
            end: '2026-02-04',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const mockGroceryItems: GroceryItem[] = [
        {
          id: '1',
          listId: '1',
          name: 'Chicken breast',
          quantity: 500,
          unit: 'gram',
          category: 'Poultry',
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          listId: '1',
          name: 'Curry powder',
          quantity: 2,
          unit: 'tablespoon',
          category: 'Herbs & Spices',
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          listId: '1',
          name: 'Coconut milk',
          quantity: 1,
          unit: 'can',
          category: 'Other',
          checked: true,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (query.includes('getAllLists')) {
          return mockGroceryLists
        } else if (query.includes('getAllItems')) {
          return mockGroceryItems
        }
        return []
      })

      renderWithProviders(<HomePage />)

      expect(screen.getByText('Weekly Groceries')).toBeInTheDocument()
      expect(screen.getByText(/3 items/i)).toBeInTheDocument()
    })

    it('should show View List button that navigates correctly', async () => {
      const user = userEvent.setup()
      const mockGroceryLists: GroceryList[] = [
        {
          id: 'list1',
          name: 'Weekly Groceries',
          dateRange: {
            start: '2026-01-28',
            end: '2026-02-04',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const mockGroceryItems: GroceryItem[] = [
        {
          id: '1',
          listId: 'list1',
          name: 'Chicken breast',
          quantity: 500,
          unit: 'gram',
          category: 'Poultry',
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const { useLiveQuery } = await import('dexie-react-hooks')
      vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
        const query = queryFn.toString()
        if (query.includes('getAllLists')) {
          return mockGroceryLists
        } else if (query.includes('getAllItems')) {
          return mockGroceryItems
        }
        return []
      })

      renderWithProviders(<HomePage />)

      const viewButton = screen.getByText('View List')
      await user.click(viewButton)

      expect(mockNavigate).toHaveBeenCalledWith('/grocery-lists/list1')
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to meal plans when Plan a Meal is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HomePage />)

      // Get all buttons and click the one in Quick Actions section
      const buttons = screen.getAllByText('Plan a Meal')
      // The last one should be in Quick Actions
      await user.click(buttons[buttons.length - 1])

      expect(mockNavigate).toHaveBeenCalledWith('/meal-plans')
    })

    it('should navigate to recipes when Browse Recipes is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HomePage />)

      // Get all buttons and click the one in Quick Actions section
      const buttons = screen.getAllByText('Browse Recipes')
      // The last one should be in Quick Actions
      await user.click(buttons[buttons.length - 1])

      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })

    it('should navigate to grocery lists when New Grocery List is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HomePage />)

      const button = screen.getByText('New Grocery List')
      await user.click(button)

      expect(mockNavigate).toHaveBeenCalledWith('/grocery-lists')
    })
  })
})
