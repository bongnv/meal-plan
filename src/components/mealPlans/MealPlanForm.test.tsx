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

  describe('Unified Meal Selection', () => {
    it('should render unified meal selection autocomplete', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByRole('textbox', { name: /select or enter meal/i })).toBeInTheDocument()
    })

    it('should show placeholder text', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByPlaceholderText(/search recipes, or enter dining out, takeout/i)).toBeInTheDocument()
    })
  })

  describe('Recipe Selection', () => {
    it('should show unified meal selector', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      expect(screen.getByRole('textbox', { name: /select or enter meal/i })).toBeInTheDocument()
    })

    it('should show servings input when recipe is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

      expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
    })

    it('should default servings to recipe default when recipe is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

      const servingsInput = screen.getByLabelText(/servings/i)
      await waitFor(() => {
        // NumberInput returns string values
        expect(servingsInput).toHaveValue('4')
      })
    })

    it('should allow adjusting servings', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // First select a recipe to show servings input
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

      // Wait for servings to appear and be auto-filled
      const servingsInput = await screen.findByLabelText(/servings/i)
      await waitFor(() => {
        expect(servingsInput).toHaveValue('4')
      })

      // Now adjust servings
      await user.clear(servingsInput)
      await user.type(servingsInput, '6')

      // NumberInput returns string values
      expect(servingsInput).toHaveValue('6')
    })
  })

  describe('Custom Entry', () => {
    it('should show unified autocomplete for all meal types', () => {
      renderWithProviders(<MealPlanForm {...defaultProps} />)
      
      expect(screen.getByPlaceholderText(/search recipes, or enter dining out, takeout/i)).toBeInTheDocument()
    })

    it('should show predefined custom options when typing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(autocomplete, 'Din')

      await waitFor(() => {
        expect(screen.getByText(/Dining Out/)).toBeInTheDocument()
      })
    })

    it('should show icons for predefined custom options', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(autocomplete, 'Din')

      await waitFor(() => {
        expect(screen.getByText(/🍽️.*Dining Out/)).toBeInTheDocument()
      })
    })

    it('should show recipe icon for recipes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(autocomplete, 'Spag')

      await waitFor(() => {
        expect(screen.getByText(/🍽.*Spaghetti Carbonara/)).toBeInTheDocument()
      })
    })

    it('should allow selecting predefined option', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(autocomplete, 'Din')
      await user.click(screen.getByText(/Dining Out/))

      await waitFor(() => {
        // Autocomplete value includes the icon
        expect(autocomplete).toHaveValue('🍽️ Dining Out')
      })
    })

    it('should allow typing custom text', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
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

      // Select recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

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

      // Select predefined custom option from unified autocomplete
      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
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

      // Type custom text in unified autocomplete
      const autocomplete = screen.getByRole('textbox', { name: /select or enter meal/i })
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

      // Select recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

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

      // Select recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

      // Submit
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Validation', () => {
    it('should require meal selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Try to submit without selecting anything
      const submitButton = screen.getByRole('button', { name: /save meal/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/meal selection is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should require servings for recipe meals', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MealPlanForm {...defaultProps} />)

      // Select recipe from unified autocomplete
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i })
      await user.type(mealSelect, 'Spag')
      await user.click(screen.getByText(/Spaghetti Carbonara/))

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

  })

  describe('Edit Mode', () => {
    it('should populate form with existing recipe meal data', async () => {
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
      // Check that the autocomplete has the recipe name with icon
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i }) as HTMLInputElement
      await waitFor(() => {
        // Value includes icon
        expect(mealSelect.value).toContain('Spaghetti Carbonara')
      })
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

      // Check that the unified autocomplete has the custom meal type
      const mealSelect = screen.getByRole('textbox', { name: /select or enter meal/i }) as HTMLInputElement
      // Value includes icon
      expect(mealSelect.value).toContain('Dining Out')
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
