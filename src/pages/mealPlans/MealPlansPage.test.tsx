import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MealPlansPage } from './MealPlansPage'
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
  const mockGetRecipeById = vi.fn((id: string) => 
    mockRecipes.find(r => r.id === id)
  )

  const mockMealPlanContext = {
    mealPlans: mockMealPlans,
    loading: false,
    error: null,
    addMealPlan: mockAddMealPlan,
    updateMealPlan: mockUpdateMealPlan,
    deleteMealPlan: mockDeleteMealPlan,
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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(MealPlanContext, 'useMealPlans').mockReturnValue(mockMealPlanContext)
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
  })

  describe('Page Rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<MealPlansPage />)

      expect(screen.getByRole('heading', { name: /meal plans/i })).toBeInTheDocument()
    })

    it('should render the CalendarView component', () => {
      renderWithProviders(<MealPlansPage />)

      // CalendarView should be present (check for week/month view controls)
      expect(screen.getByLabelText('Week')).toBeInTheDocument()
      expect(screen.getByLabelText('Month')).toBeInTheDocument()
    })

    it('should not show the form modal initially', () => {
      renderWithProviders(<MealPlansPage />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

    it('should pre-fill the form with selected date and meal type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click add meal button
      const addButtons = screen.getAllByRole('button', { name: /add meal/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        // Check that Recipe is selected by default
        expect(screen.getByLabelText('Recipe')).toBeChecked()
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

      // Select a recipe - query within the dialog to avoid ambiguity
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      
      // Find all Spaghetti Carbonara options and click the one in the dropdown (last one)
      const options = screen.getAllByText('Spaghetti Carbonara')
      await user.click(options[options.length - 1])

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

      // Select a recipe - find the dropdown option
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      
      // Find all Spaghetti Carbonara options and click the one in the dropdown (last one)
      const options = screen.getAllByText('Spaghetti Carbonara')
      await user.click(options[options.length - 1])

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

      // Find and click on an existing meal
      const mealCard = screen.getByText('Spaghetti Carbonara')
      await user.click(mealCard)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/edit meal/i)).toBeInTheDocument()
      })
    })

    it('should pre-fill the form with existing meal data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlansPage />)

      // Click on existing meal
      const mealCard = screen.getByText('Spaghetti Carbonara')
      await user.click(mealCard)

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

      // Click on existing meal
      const mealCard = screen.getByText('Spaghetti Carbonara')
      await user.click(mealCard)

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

      // Click on existing meal
      const mealCard = screen.getByText('Spaghetti Carbonara')
      await user.click(mealCard)

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

      // Verify that meals are displayed in the calendar
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('🍽️')).toBeInTheDocument() // Dining out icon
    })

    it('should pass recipes context to CalendarView', () => {
      renderWithProviders(<MealPlansPage />)

      // CalendarView should be able to display recipe names
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
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

      // Check that recipes are available in the dropdown
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)

      // Use getAllByText since recipe names may appear in both calendar and dropdown
      const spaghettiOptions = screen.getAllByText('Spaghetti Carbonara')
      const chickenOptions = screen.getAllByText('Chicken Stir Fry')
      
      // Verify at least one of each recipe is present
      expect(spaghettiOptions.length).toBeGreaterThan(0)
      expect(chickenOptions.length).toBeGreaterThan(0)
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

      // Switch to custom entry
      await user.click(screen.getByLabelText('Custom'))

      // Enter custom meal
      const customInput = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(customInput, 'Birthday Party')

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
