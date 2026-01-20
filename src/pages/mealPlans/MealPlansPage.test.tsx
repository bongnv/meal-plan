import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MealPlansPage } from './MealPlansPage'
import * as IngredientContext from '../../contexts/IngredientContext'
import * as MealPlanContext from '../../contexts/MealPlanContext'
import * as RecipeContext from '../../contexts/RecipeContext'

import type { MealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </MantineProvider>
  )
}

describe('MealPlansPage', () => {
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta',
      ingredients: [],
      instructions: [],
      servings: 4,
      totalTime: 30,
      tags: [],
    },
    {
      id: '2',
      name: 'Chicken Stir Fry',
      description: 'Quick Asian dish',
      ingredients: [],
      instructions: [],
      servings: 2,
      totalTime: 20,
      tags: [],
    },
  ]

  const mockMealPlans: MealPlan[] = [
    {
      id: '1',
      date: '2026-01-20',
      mealType: 'lunch',
      type: 'recipe',
      recipeId: '1',
      servings: 4,
    },
    {
      id: '2',
      date: '2026-01-20',
      mealType: 'dinner',
      type: 'dining-out',
    },
  ]

  const mockAddMealPlan = vi.fn()
  const mockUpdateMealPlan = vi.fn()
  const mockDeleteMealPlan = vi.fn()
  const mockGetMealPlanById = vi.fn((id: string) =>
    mockMealPlans.find(mp => mp.id === id)
  )
  const mockGetRecipeById = vi.fn((id: string) => 
    mockRecipes.find(r => r.id === id)
  )

  const mockMealPlanContext = {
    mealPlans: mockMealPlans,
    loading: false,
    error: null,
    getMealPlanById: mockGetMealPlanById,
    addMealPlan: mockAddMealPlan,
    updateMealPlan: mockUpdateMealPlan,
    deleteMealPlan: mockDeleteMealPlan,
    copyMealPlan: vi.fn(),
    generateCopyPreview: vi.fn(),
  }

  const mockRecipeContext = {
    recipes: mockRecipes,
    loading: false,
    error: null,
    getRecipeById: mockGetRecipeById,
    addRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  }

  const mockIngredientContext = {
    ingredients: [],
    loading: false,
    error: null,
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    deleteIngredient: vi.fn(),
    getIngredientById: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(MealPlanContext, 'useMealPlans').mockReturnValue(mockMealPlanContext)
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(mockIngredientContext)
  })

  describe('Page Rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<MealPlansPage />)

      expect(screen.getByRole('heading', { name: /meal plans/i })).toBeInTheDocument()
    })

    it('should render the calendar view with navigation controls', () => {
      renderWithProviders(<MealPlansPage />)

      // Calendar grid should be present (check for navigation)
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should render the recipe sidebar', () => {
      renderWithProviders(<MealPlansPage />)

      // Recipe sidebar should always be visible
      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()
    })

    it('should not show the form modal initially', () => {
      renderWithProviders(<MealPlansPage />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show view mode switcher in CalendarView header', () => {
      renderWithProviders(<MealPlansPage />)

      // View switcher should be in CalendarView header
      expect(screen.getByLabelText('Month')).toBeInTheDocument()
      expect(screen.getByLabelText('List')).toBeInTheDocument()
    })

    it('should keep recipe sidebar visible when switching to list view', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Recipe sidebar should be present initially
      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()

      // Switch to list view (within CalendarView)
      await user.click(screen.getByLabelText('List'))

      // Recipe sidebar should still be present (not hidden in list view anymore)
      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()
    })
  })

  describe('Adding a Meal', () => {
    it('should open the form modal when adding a meal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Find the current day's lunch cell and click the add button
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        // Check for the modal title
        expect(screen.getByRole('heading', { name: /add meal/i })).toBeInTheDocument()
      })
    })

    it('should show unified meal selection autocomplete', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click add meal button
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        // Check that unified autocomplete is present
        expect(screen.getByRole('textbox', { name: /select or enter meal/i })).toBeInTheDocument()
      })
    })

    it('should call addMealPlan when form is submitted', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Open form
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      let dialog: HTMLElement
      await waitFor(() => {
        dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })

      // Select a recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      
      // Click the recipe option in the dropdown
      await waitFor(() => {
        const spagOption = screen.getByText(/🍽.*Spaghetti Carbonara/)
        expect(spagOption).toBeInTheDocument()
      })
      await user.click(screen.getByText(/🍽.*Spaghetti Carbonara/))

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockAddMealPlan).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'recipe',
            recipeId: '1',
            servings: 4,
          })
        )
      })
    })

    it('should close the form modal after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Open form
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Select a recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/🍽.*Spaghetti Carbonara/))

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should close the form modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Open form
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Editing a Meal', () => {
    it('should open the form modal when editing a meal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Find and click the edit button for the meal in the calendar
      // The calendar has edit/delete icons for each meal
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      // First edit button should be for the lunch meal on 2026-01-20
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/edit meal/i)).toBeInTheDocument()
      })
    })

    it('should pre-fill the form with existing meal data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click the edit button for the meal in the calendar
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        // Check that the form shows the existing data
        expect(screen.getByText(/edit meal/i)).toBeInTheDocument()
        // Servings should be pre-filled
        expect(screen.getByLabelText(/servings/i)).toHaveValue('4')
      })
    })

    it('should call updateMealPlan when form is submitted', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click the edit button for the meal in the calendar
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Change servings
      const servingsInput = screen.getByLabelText(/servings/i)
      await user.clear(servingsInput)
      await user.type(servingsInput, '6')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateMealPlan).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            servings: 6,
          })
        )
      })
    })

    it('should close the form modal after successful update', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click the edit button for the meal in the calendar
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Submit form without changes
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Integration with CalendarView', () => {
    it('should pass meal plans to CalendarView', () => {
      renderWithProviders(<MealPlansPage />)

      // Verify that meals are displayed (appears in both sidebar and calendar)
      const mealElements = screen.getAllByText('Spaghetti Carbonara')
      expect(mealElements.length).toBeGreaterThan(0)
      expect(screen.getByText('🍽️')).toBeInTheDocument() // Dining out icon
    })

    it('should pass recipes context to CalendarView', () => {
      renderWithProviders(<MealPlansPage />)

      // CalendarView should be able to display recipe names (appears in both sidebar and calendar)
      const mealElements = screen.getAllByText('Spaghetti Carbonara')
      expect(mealElements.length).toBeGreaterThan(0)
      expect(mockGetRecipeById).toHaveBeenCalled()
    })
  })

  describe('Integration with MealPlanForm', () => {
    it('should pass recipes to the form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Open form
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Check that the unified meal selection autocomplete is available
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      expect(mealSelect).toBeInTheDocument()
      
      // Type to trigger autocomplete dropdown
      await user.type(mealSelect, 'Spa')
      
      // Verify recipes appear with icon in autocomplete (recipes should contain icon prefix)
      await waitFor(() => {
        const spaghettiOptions = screen.getAllByText(/Spaghetti Carbonara/i)
        expect(spaghettiOptions.length).toBeGreaterThan(0)
      })
    })

    it('should handle custom meal entry', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Open form
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Enter custom meal directly (no need to switch, unified autocomplete)
      const mealInput = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealInput, 'Birthday Party')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockAddMealPlan).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'other',
            customText: 'Birthday Party',
          })
        )
      })
    })
  })
})
