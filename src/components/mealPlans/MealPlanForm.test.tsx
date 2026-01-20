import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MealPlanForm } from './MealPlanForm'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

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

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('MealPlanForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    recipes: mockRecipes,
    onSubmit: mockOnSubmit,
    onClose: mockOnClose,
    opened: true,
    date: '2026-01-20',
    mealType: 'lunch' as MealType,
  }

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnClose.mockClear()
  })

  describe('Rendering', () => {
    it('should render modal when opened', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/add meal/i)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} opened={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show edit title when editing', () => {
      const existingMeal: MealPlan = {
        id: '1',
        date: '2026-01-20',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: '1',
        servings: 4,
      }

      renderWithProviders(
        <MealPlanForm {...defaultProps} initialMeal={existingMeal} />
      )

      expect(screen.getByText(/edit meal/i)).toBeInTheDocument()
    })
  })

  describe('Meal Type Toggle', () => {
    it('should render meal type toggle with Recipe and Custom options', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByLabelText('Recipe')).toBeInTheDocument()
      expect(screen.getByLabelText('Custom')).toBeInTheDocument()
    })

    it('should default to Recipe type', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const recipeOption = screen.getByLabelText('Recipe')
      expect(recipeOption).toBeChecked()
    })

    it('should switch to custom entry when Custom is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const customOption = screen.getByLabelText('Custom')
      await user.click(customOption)

      expect(customOption).toBeChecked()
      expect(screen.getByPlaceholderText(/dining out, takeout/i)).toBeInTheDocument()
    })
  })

  describe('Recipe Selection', () => {
    it('should show recipe selector in recipe mode', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByRole('textbox', { name: /select recipe/i })).toBeInTheDocument()
    })

    it('should show servings input for recipe meals', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
    })

    it('should default servings to recipe default when recipe is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      await user.click(screen.getByText('Spaghetti Carbonara'))

      const servingsInput = screen.getByLabelText(/servings/i)
      await waitFor(() => {
        // NumberInput returns string values
        expect(servingsInput).toHaveValue('4')
      })
    })

    it('should allow adjusting servings', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const servingsInput = screen.getByLabelText(/servings/i)
      await user.clear(servingsInput)
      await user.type(servingsInput, '6')

      // NumberInput returns string values
      expect(servingsInput).toHaveValue('6')
    })
  })

  describe('Custom Entry', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const customOption = screen.getByLabelText('Custom')
      await user.click(customOption)
    })

    it('should show autocomplete input for custom meals', () => {
      expect(screen.getByPlaceholderText(/dining out, takeout/i)).toBeInTheDocument()
    })

    it('should show predefined options when typing', async () => {
      const user = userEvent.setup()

      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'D')

      await waitFor(() => {
        expect(screen.getByText(/Dining Out/)).toBeInTheDocument()
      })
    })

    it('should show icons for predefined options', async () => {
      const user = userEvent.setup()

      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'D')

      await waitFor(() => {
        expect(screen.getByText(/🍽️.*Dining Out/)).toBeInTheDocument()
      })
    })

    it('should allow selecting predefined option', async () => {
      const user = userEvent.setup()

      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'Din')
      await user.click(screen.getByText(/Dining Out/))

      await waitFor(() => {
        // Autocomplete value includes the icon
        expect(autocomplete).toHaveValue('🍽️ Dining Out')
      })
    })

    it('should allow typing custom text', async () => {
      const user = userEvent.setup()

      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'Pizza Night')

      expect(autocomplete).toHaveValue('Pizza Night')
    })
  })

  describe('Date and Meal Slot', () => {
    it('should show date input with default date', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // DatePickerInput renders as a button, not an input with a value
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    })

    it('should show meal slot selector', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByLabelText('Lunch')).toBeInTheDocument()
      expect(screen.getByLabelText('Dinner')).toBeInTheDocument()
    })

    it('should default to provided meal type', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} mealType="dinner" />)

      const dinnerOption = screen.getByLabelText('Dinner')
      expect(dinnerOption).toBeChecked()
    })
  })

  describe('Optional Note', () => {
    it('should show optional note field', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByLabelText(/note/i)).toBeInTheDocument()
    })

    it('should allow adding notes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const noteInput = screen.getByLabelText(/note/i)
      await user.type(noteInput, 'Make extra for leftovers')

      expect(noteInput).toHaveValue('Make extra for leftovers')
    })
  })

  describe('Form Submission', () => {
    it('should submit recipe meal plan', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Select recipe
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      await user.click(screen.getByText('Spaghetti Carbonara'))

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2026-01-20',
            mealType: 'lunch',
            type: 'recipe',
            recipeId: '1',
            servings: 4,
          })
        )
      })
    })

    it('should submit custom meal plan with predefined type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Switch to custom
      await user.click(screen.getByLabelText('Custom'))

      // Select predefined option
      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'Din')
      await user.click(screen.getByText(/Dining Out/))

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2026-01-20',
            mealType: 'lunch',
            type: 'dining-out',
          })
        )
      })
    })

    it('should submit custom meal plan with "other" type for free text', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Switch to custom
      await user.click(screen.getByLabelText('Custom'))

      // Type custom text
      const autocomplete = screen.getByPlaceholderText(/dining out, takeout/i)
      await user.type(autocomplete, 'Pizza Night')

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2026-01-20',
            mealType: 'lunch',
            type: 'other',
            customText: 'Pizza Night',
          })
        )
      })
    })

    it('should include note when provided', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Select recipe
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      await user.click(screen.getByText('Spaghetti Carbonara'))

      // Add note
      const noteInput = screen.getByLabelText(/note/i)
      await user.type(noteInput, 'Birthday dinner')

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            note: 'Birthday dinner',
          })
        )
      })
    })

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Select recipe
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      await user.click(screen.getByText('Spaghetti Carbonara'))

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Validation', () => {
    it('should require recipe selection for recipe meals', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Try to submit without selecting recipe
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/recipe is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should require servings for recipe meals', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Select recipe
      const recipeSelect = screen.getByRole('textbox', { name: /select recipe/i })
      await user.click(recipeSelect)
      await user.click(screen.getByText('Spaghetti Carbonara'))

      // Clear servings - need to wait for auto-fill first
      const servingsInput = screen.getByLabelText(/servings/i)
      await waitFor(() => {
        expect(servingsInput).toHaveValue('4')
      })
      await user.clear(servingsInput)

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/servings/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should require custom meal input for custom meals', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Switch to custom
      await user.click(screen.getByLabelText('Custom'))

      // Try to submit without entering anything
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/custom meal is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    it('should populate form with existing recipe meal data', () => {
      const existingMeal: MealPlan = {
        id: '1',
        date: '2026-01-20',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: '1',
        servings: 6,
        note: 'Extra guests',
      }

      renderWithProviders(
        <MealPlanForm {...defaultProps} initialMeal={existingMeal} />
      )

      // DatePickerInput doesn't have a text value, so we can't check it with toHaveValue
      expect(screen.getByLabelText('Dinner')).toBeChecked()
      // NumberInput returns strings
      expect(screen.getByLabelText(/servings/i)).toHaveValue('6')
      expect(screen.getByLabelText(/note/i)).toHaveValue('Extra guests')
    })

    it('should populate form with existing custom meal data', () => {
      const existingMeal: MealPlan = {
        id: '2',
        date: '2026-01-21',
        mealType: 'lunch',
        type: 'dining-out',
      }

      renderWithProviders(
        <MealPlanForm {...defaultProps} initialMeal={existingMeal} />
      )

      expect(screen.getByLabelText('Custom')).toBeChecked()
      expect(screen.getByPlaceholderText(/dining out, takeout/i)).toHaveValue('Dining Out')
    })

    it('should update existing meal when edited', async () => {
      const user = userEvent.setup()
      const existingMeal: MealPlan = {
        id: '1',
        date: '2026-01-20',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: '1',
        servings: 4,
      }

      renderWithProviders(
        <MealPlanForm {...defaultProps} initialMeal={existingMeal} />
      )

      // Change servings
      const servingsInput = screen.getByLabelText(/servings/i)
      await user.clear(servingsInput)
      await user.type(servingsInput, '8')

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            servings: 8,
          })
        )
      })
    })
  })

  describe('Cancel Action', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not submit when cancelled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })
})
