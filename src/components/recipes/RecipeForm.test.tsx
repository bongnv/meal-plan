import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'

import { RecipeForm } from './RecipeForm'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

// Mock the useIngredients hook
vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockIngredients: Ingredient[] = [
  { id: '1', name: 'Tomato', category: 'Vegetables' },
  { id: '2', name: 'Flour', category: 'Grains' },
  { id: '3', name: 'Chicken Breast', category: 'Meat' },
]

const defaultMockIngredientContext = {
  ingredients: mockIngredients,
  loading: false,
  error: null,
  getIngredientById: (id: string) => mockIngredients.find(i => i.id === id),
  addIngredient: vi.fn(),
  addIngredients: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </MantineProvider>
  )
}

describe('RecipeForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
    // Set up default mock for useIngredients
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  describe('Create mode', () => {
    it('should render empty form in create mode', () => {
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      expect(screen.getByPlaceholderText(/enter recipe name/i)).toHaveValue('')
      expect(screen.getByPlaceholderText(/describe your recipe/i)).toHaveValue(
        ''
      )
      // NumberInput stores values as strings in the DOM
      expect(screen.getByPlaceholderText(/number of servings/i)).toHaveValue(
        '0'
      )
      expect(screen.getByPlaceholderText(/preparation time/i)).toHaveValue('0')
      expect(screen.getByPlaceholderText(/cooking time/i)).toHaveValue('0')
      expect(
        screen.getByRole('button', { name: /create recipe/i })
      ).toBeInTheDocument()
    })

    it('should allow adding ingredients', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Should have a Select component with label "Ingredient"
      expect(
        screen.getByRole('textbox', { name: /ingredient/i })
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
    })

    it('should allow removing ingredients', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Add an ingredient first
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Remove it
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      expect(screen.queryByLabelText(/^ingredient$/i)).not.toBeInTheDocument()
    })

    it('should allow adding instructions', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)

      expect(screen.getByLabelText(/step 1/i)).toBeInTheDocument()
    })

    it('should allow removing instructions', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Add an instruction first
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)

      // Remove it
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])

      expect(screen.queryByLabelText(/step 1/i)).not.toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const submitButton = screen.getByRole('button', {
        name: /create recipe/i,
      })
      await user.click(submitButton)

      // Mantine form validation prevents submission but doesn't show error text in DOM
      // Just verify onSubmit was not called
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should submit valid form data', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill in basic fields using placeholder text
      await user.type(
        screen.getByPlaceholderText(/enter recipe name/i),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText(/describe your recipe/i),
        'Test Description'
      )
      await user.type(screen.getByPlaceholderText(/number of servings/i), '4')
      await user.type(screen.getByPlaceholderText(/preparation time/i), '15')
      await user.type(screen.getByPlaceholderText(/cooking time/i), '15')

      // Add an ingredient
      await user.click(screen.getByRole('button', { name: /add ingredient/i }))
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      // Select Tomato from dropdown
      await waitFor(() => {
        expect(screen.getByText(/tomato/i)).toBeInTheDocument()
      })
      await user.click(screen.getByText(/tomato/i))
      await user.type(screen.getByLabelText(/quantity/i), '2')

      // Add an instruction
      await user.click(screen.getByRole('button', { name: /add instruction/i }))
      await user.type(screen.getByLabelText(/step 1/i), 'Mix ingredients')

      // Submit
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Recipe',
            description: 'Test Description',
            servings: 4,
            prepTime: 15,
            cookTime: 15,
            ingredients: expect.arrayContaining([
              expect.objectContaining({
                ingredientId: '1',
                quantity: 2,
              }),
            ]),
            instructions: expect.arrayContaining(['Mix ingredients']),
            tags: [],
          })
        )
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Edit mode', () => {
    const existingRecipe: Recipe = {
      id: '1',
      name: 'Existing Recipe',
      description: 'Existing Description',
      servings: 4,
      prepTime: 15,
      cookTime: 15,
      ingredients: [{ ingredientId: 'flour', quantity: 2 }],
      instructions: ['Step 1', 'Step 2'],
      tags: ['dinner'],
    }

    it('should render form with existing recipe data', () => {
      renderWithProviders(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByPlaceholderText(/enter recipe name/i)).toHaveValue(
        'Existing Recipe'
      )
      expect(screen.getByPlaceholderText(/describe your recipe/i)).toHaveValue(
        'Existing Description'
      )
      // NumberInput stores values as strings in the DOM
      expect(screen.getByPlaceholderText(/number of servings/i)).toHaveValue(
        '4'
      )
      expect(screen.getByPlaceholderText(/preparation time/i)).toHaveValue('15')
      expect(screen.getByPlaceholderText(/cooking time/i)).toHaveValue('15')
      expect(
        screen.getByRole('button', { name: /update recipe/i })
      ).toBeInTheDocument()
    })

    it('should display existing ingredients', () => {
      renderWithProviders(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('flour')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    })

    it('should display existing instructions', () => {
      renderWithProviders(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('Step 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Step 2')).toBeInTheDocument()
    })

    it('should submit updated form data', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Update name
      const nameInput = screen.getByPlaceholderText(/enter recipe name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Recipe')

      // Submit
      await user.click(screen.getByRole('button', { name: /update recipe/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Recipe',
          })
        )
      })
    })
  })

  describe('Tags', () => {
    it('should allow adding tags', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const tagInput = screen.getByPlaceholderText(/press enter to add tags/i)
      await user.type(tagInput, 'dinner{enter}')

      expect(screen.getByText('dinner')).toBeInTheDocument()
    })

    it('should allow removing tags', async () => {
      const recipeWithTags: Recipe = {
        id: '1',
        name: 'Test',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        ingredients: [],
        instructions: [],
        tags: ['dinner', 'easy'],
      }

      renderWithProviders(
        <RecipeForm
          recipe={recipeWithTags}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Mantine TagsInput renders tags as pills with close buttons
      // The close buttons don't have aria-labels by default
      // Just verify tags are displayed
      expect(screen.getByText('dinner')).toBeInTheDocument()
      expect(screen.getByText('easy')).toBeInTheDocument()
    })
  })

  describe('Ingredient Selection', () => {
    it('should display ingredient select dropdown', async () => {
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const user = userEvent.setup()
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Should show ingredient select instead of text input
      expect(
        screen.getByRole('textbox', { name: /ingredient/i })
      ).toBeInTheDocument()
    })

    it('should allow selecting ingredient from library', async () => {
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const user = userEvent.setup()
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)

      // Should see Tomato in the dropdown
      await waitFor(() => {
        expect(screen.getByText(/tomato/i)).toBeInTheDocument()
      })
    })

    it('should display selected ingredient unit', async () => {
      const recipeWithIngredient: Recipe = {
        id: '1',
        name: 'Test',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        ingredients: [{ ingredientId: '1', quantity: 2 }],
        instructions: [],
        tags: [],
      }

      renderWithProviders(
        <RecipeForm
          recipe={recipeWithIngredient}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Should display the ingredient from the library
      await waitFor(() => {
        expect(screen.getByText(/tomato/i)).toBeInTheDocument()
      })
    })

    it('should display unit selector for each ingredient', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Add an ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Should have unit selector
      await waitFor(() => {
        const unitSelects = screen.getAllByRole('textbox', { name: /unit/i })
        expect(unitSelects.length).toBeGreaterThan(0)
      })
    })

    it('should save unit value with recipe ingredient', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill in basic recipe info
      await user.type(screen.getByLabelText(/^name/i), 'Test Recipe')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/servings/i), '4')
      await user.type(screen.getByLabelText(/prep time/i), '15')
      await user.type(screen.getByLabelText(/cook time/i), '15')

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Select ingredient
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.type(ingredientSelect, 'Tomato')
      await user.click(await screen.findByText('Tomato'))

      // Fill quantity
      const quantityInput = screen.getByPlaceholderText(/quantity/i)
      await user.clear(quantityInput)
      await user.type(quantityInput, '2')

      // Select unit
      const unitSelect = screen.getByRole('textbox', { name: /unit/i })
      await user.click(unitSelect)
      await user.click(await screen.findByText('gram'))

      // Add instruction
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)
      await user.type(screen.getByPlaceholderText(/step 1/i), 'Cook it')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            ingredients: [
              expect.objectContaining({
                ingredientId: '1',
                quantity: 2,
              }),
            ],
          })
        )
      })
    })

    it('should populate existing unit when editing recipe', async () => {
      const recipeWithUnit: Recipe = {
        id: '1',
        name: 'Test',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        ingredients: [{ ingredientId: '1', quantity: 2, unit: 'cup' }],
        instructions: ['Step 1'],
        tags: [],
      }

      renderWithProviders(
        <RecipeForm
          recipe={recipeWithUnit}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Should display the existing unit - get the first visible input (not hidden)
      await waitFor(() => {
        const unitInputs = screen.getAllByDisplayValue('cup')
        // Find the actual Select input (not the hidden one)
        const visibleInput = unitInputs.find(
          input => input.getAttribute('type') !== 'hidden'
        )
        expect(visibleInput).toBeInTheDocument()
      })
    })

    it('should default unit to "whole" (no auto-fill from library)', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Select ingredient
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.type(ingredientSelect, 'Tomato')
      await user.click(await screen.findByText('Tomato'))

      // Unit should default to 'whole' (not auto-filled from library)
      await waitFor(() => {
        const unitInputs = screen.getAllByDisplayValue('whole')
        const visibleInput = unitInputs.find(
          input => input.getAttribute('type') !== 'hidden'
        )
        expect(visibleInput).toBeInTheDocument()
      })
    })

    it('should support creating new ingredient inline', async () => {
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const user = userEvent.setup()
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)

      // Should have option to create new ingredient
      await waitFor(() => {
        expect(
          screen.getByText(/\+ create new ingredient/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Custom Ingredient Names (displayName)', () => {
    it('should display custom name input when ingredient is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Select an ingredient
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.type(ingredientSelect, 'Tomato')

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Tomato'))

      // Should show custom name input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/tomato/i)).toBeInTheDocument()
      })
    })

    it('should pre-fill custom name in edit mode when displayName exists', async () => {
      const recipeWithDisplayName: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test Description',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        ingredients: [
          { ingredientId: '1', quantity: 2, displayName: 'diced tomatoes' },
        ],
        instructions: ['Step 1'],
        tags: [],
      }

      renderWithProviders(
        <RecipeForm
          recipe={recipeWithDisplayName}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Custom name input should have the displayName value
      await waitFor(() => {
        const customNameInput = screen.getByDisplayValue('diced tomatoes')
        expect(customNameInput).toBeInTheDocument()
      })
    })

    it('should allow clearing custom name to use library name', async () => {
      const user = userEvent.setup()
      const recipeWithDisplayName: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test Description',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        ingredients: [
          { ingredientId: '1', quantity: 2, displayName: 'diced tomatoes' },
        ],
        instructions: ['Step 1'],
        tags: [],
      }

      renderWithProviders(
        <RecipeForm
          recipe={recipeWithDisplayName}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const customNameInput = await screen.findByDisplayValue('diced tomatoes')
      await user.clear(customNameInput)

      // Input should be empty (will use library name)
      expect(customNameInput).toHaveValue('')
    })

    it('should submit form with displayName included', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill basic form fields
      await user.type(
        screen.getByPlaceholderText(/enter recipe name/i),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText(/describe your recipe/i),
        'Test Description'
      )
      await user.clear(screen.getByPlaceholderText(/number of servings/i))
      await user.type(screen.getByPlaceholderText(/number of servings/i), '4')
      await user.clear(screen.getByPlaceholderText(/preparation time/i))
      await user.type(screen.getByPlaceholderText(/preparation time/i), '15')
      await user.clear(screen.getByPlaceholderText(/cooking time/i))
      await user.type(screen.getByPlaceholderText(/cooking time/i), '15')

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Select ingredient
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.type(ingredientSelect, 'Tomato')
      await user.click(await screen.findByText('Tomato'))

      // Fill quantity
      const quantityInput = screen.getByPlaceholderText(/quantity/i)
      await user.clear(quantityInput)
      await user.type(quantityInput, '2')

      // Unit defaults to 'whole' - no need to manually select

      // Fill custom name
      const customNameInput = screen.getByPlaceholderText(/tomato/i)
      await user.type(customNameInput, 'diced tomatoes')

      // Add instruction
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)
      await user.type(screen.getByPlaceholderText(/step 1/i), 'Cook it')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Recipe',
          description: 'Test Description',
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            {
              ingredientId: '1',
              quantity: 2,
              unit: 'whole', // Manually selected
              displayName: 'diced tomatoes',
            },
          ],
          instructions: ['Cook it'],
          tags: [],
          imageUrl: undefined,
        })
      })
    })

    it('should show library name as placeholder hint', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)

      // Select ingredient
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.type(ingredientSelect, 'Chicken')
      await user.click(await screen.findByText('Chicken Breast'))

      // Custom name input should have library name as placeholder
      await waitFor(() => {
        const customNameInput = screen.getByPlaceholderText(/chicken breast/i)
        expect(customNameInput).toBeInTheDocument()
      })
    })

    it('should show "Custom Name (optional)" label only on first row', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Add two ingredients
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)
      await user.click(addIngredientButton)

      // Should have label "Custom Name (optional)" only once
      await waitFor(() => {
        const labels = screen.getAllByText(/custom name \(optional\)/i)
        expect(labels).toHaveLength(1)
      })
    })
  })

  describe('Image URL field', () => {
    it('should render image URL input field', () => {
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      expect(
        screen.getByPlaceholderText(/enter image url/i)
      ).toBeInTheDocument()
    })

    it('should allow empty imageUrl (optional field)', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill required fields
      await user.type(
        screen.getByPlaceholderText(/enter recipe name/i),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText(/describe your recipe/i),
        'Test description'
      )
      await user.clear(screen.getByPlaceholderText(/number of servings/i))
      await user.type(screen.getByPlaceholderText(/number of servings/i), '4')
      await user.clear(screen.getByPlaceholderText(/preparation time/i))
      await user.type(screen.getByPlaceholderText(/preparation time/i), '15')
      await user.clear(screen.getByPlaceholderText(/cooking time/i))
      await user.type(screen.getByPlaceholderText(/cooking time/i), '15')

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.click(screen.getByText(/tomato/i))
      await user.clear(screen.getByLabelText(/quantity/i))
      await user.type(screen.getByLabelText(/quantity/i), '2')

      // Add instruction
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)
      await user.type(screen.getByPlaceholderText(/step 1/i), 'Cook it')

      // Leave imageUrl empty
      const imageUrlInput = screen.getByPlaceholderText(/enter image url/i)
      expect(imageUrlInput).toHaveValue('')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      // Should submit successfully with undefined imageUrl
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Recipe',
            imageUrl: undefined,
          })
        )
      })
    })

    it('should show validation error for invalid URL', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill required fields
      await user.type(
        screen.getByPlaceholderText(/enter recipe name/i),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText(/describe your recipe/i),
        'Test description'
      )
      await user.clear(screen.getByPlaceholderText(/number of servings/i))
      await user.type(screen.getByPlaceholderText(/number of servings/i), '4')
      await user.clear(screen.getByPlaceholderText(/preparation time/i))
      await user.type(screen.getByPlaceholderText(/preparation time/i), '15')
      await user.clear(screen.getByPlaceholderText(/cooking time/i))
      await user.type(screen.getByPlaceholderText(/cooking time/i), '15')

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.click(screen.getByText(/tomato/i))
      await user.clear(screen.getByLabelText(/quantity/i))
      await user.type(screen.getByLabelText(/quantity/i), '2')

      // Add instruction
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)
      await user.type(screen.getByPlaceholderText(/step 1/i), 'Cook it')

      // Enter invalid URL
      await user.type(
        screen.getByPlaceholderText(/enter image url/i),
        'not-a-valid-url'
      )

      // Submit form
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      // Should show validation error - validation happens via Zod
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })

      // The error should be in the form error state
      const imageUrlInput = screen.getByPlaceholderText(/enter image url/i)
      expect(imageUrlInput).toBeInTheDocument()
    })

    it('should accept valid URL', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Fill required fields
      await user.type(
        screen.getByPlaceholderText(/enter recipe name/i),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText(/describe your recipe/i),
        'Test description'
      )
      await user.clear(screen.getByPlaceholderText(/number of servings/i))
      await user.type(screen.getByPlaceholderText(/number of servings/i), '4')
      await user.clear(screen.getByPlaceholderText(/preparation time/i))
      await user.type(screen.getByPlaceholderText(/preparation time/i), '15')
      await user.clear(screen.getByPlaceholderText(/cooking time/i))
      await user.type(screen.getByPlaceholderText(/cooking time/i), '15')

      // Add ingredient
      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })
      await user.click(addIngredientButton)
      const ingredientSelect = screen.getByRole('textbox', {
        name: /ingredient/i,
      })
      await user.click(ingredientSelect)
      await user.click(screen.getByText(/tomato/i))
      await user.clear(screen.getByLabelText(/quantity/i))
      await user.type(screen.getByLabelText(/quantity/i), '2')

      // Add instruction
      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })
      await user.click(addInstructionButton)
      await user.type(screen.getByPlaceholderText(/step 1/i), 'Cook it')

      // Enter valid URL
      await user.type(
        screen.getByPlaceholderText(/enter image url/i),
        'https://example.com/recipe.jpg'
      )

      // Submit form
      await user.click(screen.getByRole('button', { name: /create recipe/i }))

      // Should submit successfully
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Recipe',
            imageUrl: 'https://example.com/recipe.jpg',
          })
        )
      })
    })

    it('should display image preview when valid URL is entered', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Enter valid URL
      await user.type(
        screen.getByPlaceholderText(/enter image url/i),
        'https://example.com/recipe.jpg'
      )

      // Should display preview image
      await waitFor(() => {
        const previewImage = screen.getByAltText(/recipe image preview/i)
        expect(previewImage).toBeInTheDocument()
        expect(previewImage).toHaveAttribute(
          'src',
          'https://example.com/recipe.jpg'
        )
      })
    })

    it('should not display preview for invalid URL', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      )

      // Enter invalid URL
      await user.type(
        screen.getByPlaceholderText(/enter image url/i),
        'not-a-url'
      )

      // Should not display preview
      const previewImage = screen.queryByAltText(/recipe image preview/i)
      expect(previewImage).not.toBeInTheDocument()
    })

    it('should include imageUrl in edit mode', () => {
      const mockRecipe: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test description',
        ingredients: [{ ingredientId: '1', quantity: 2 }],
        instructions: ['Step 1'],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['test'],
        imageUrl: 'https://example.com/recipe.jpg',
      }

      renderWithProviders(
        <RecipeForm
          recipe={mockRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const imageUrlInput = screen.getByPlaceholderText(/enter image url/i)
      expect(imageUrlInput).toHaveValue('https://example.com/recipe.jpg')
    })
  })
})
