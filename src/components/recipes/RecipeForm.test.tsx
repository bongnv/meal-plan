import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RecipeForm } from './RecipeForm'
import { Recipe, RecipeInput } from '../../types/recipe'

describe('RecipeForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  const validRecipeInput: RecipeInput = {
    name: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: [
      { ingredientId: '1', quantity: 2 },
      { ingredientId: '2', quantity: 1.5 },
    ],
    instructions: ['Step 1: Do this', 'Step 2: Do that'],
    servings: 4,
    totalTime: 30,
    tags: ['dinner', 'quick'],
  }

  const existingRecipe: Recipe = {
    id: 'recipe-123',
    ...validRecipeInput,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })

  describe('rendering', () => {
    it('should render form with all fields', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/total time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
    })

    it('should render ingredient section', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByText(/ingredients/i)).toBeInTheDocument()
    })

    it('should render instruction section', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByText(/instructions/i)).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })
  })

  describe('create mode', () => {
    it('should render with empty form when no recipe is provided', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement
      const servingsInput = screen.getByLabelText(
        /servings/i
      ) as HTMLInputElement
      const totalTimeInput = screen.getByLabelText(
        /total time/i
      ) as HTMLInputElement

      expect(nameInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
      expect(servingsInput.value).toBe('')
      expect(totalTimeInput.value).toBe('')
    })

    it('should show "Create Recipe" as title in create mode', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByText(/create recipe/i)).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('should populate form with existing recipe data', () => {
      render(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement
      const servingsInput = screen.getByLabelText(
        /servings/i
      ) as HTMLInputElement
      const totalTimeInput = screen.getByLabelText(
        /total time/i
      ) as HTMLInputElement

      expect(nameInput.value).toBe(existingRecipe.name)
      expect(descriptionInput.value).toBe(existingRecipe.description)
      expect(servingsInput.value).toBe(String(existingRecipe.servings))
      expect(totalTimeInput.value).toBe(String(existingRecipe.totalTime))
    })

    it('should show "Edit Recipe" as title in edit mode', () => {
      render(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/edit recipe/i)).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('should show error when submitting empty form', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it.skip('should show error for invalid servings', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText(/name/i)
      const servingsInput = screen.getByLabelText(/servings/i)

      await user.type(nameInput, 'Test Recipe')
      await user.clear(servingsInput)
      await user.type(servingsInput, '0')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
        expect(
          screen.getByText(/servings must be a positive number/i)
        ).toBeInTheDocument()
      })
    })

    it.skip('should show error for negative total time', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText(/name/i)
      const totalTimeInput = screen.getByLabelText(/total time/i)

      await user.type(nameInput, 'Test Recipe')
      await user.clear(totalTimeInput)
      await user.type(totalTimeInput, '-1')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
        expect(
          screen.getByText(/total time cannot be negative/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText(/name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const servingsInput = screen.getByLabelText(/servings/i)
      const totalTimeInput = screen.getByLabelText(/total time/i)

      await user.type(nameInput, 'New Recipe')
      await user.type(descriptionInput, 'A great recipe')
      await user.clear(servingsInput)
      await user.type(servingsInput, '4')
      await user.clear(totalTimeInput)
      await user.type(totalTimeInput, '30')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Recipe',
            description: 'A great recipe',
            servings: 4,
            totalTime: 30,
          })
        )
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should submit with updated data in edit mode', async () => {
      const user = userEvent.setup()
      render(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Recipe Name')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Recipe Name',
          })
        )
      })
    })
  })

  describe('dynamic ingredient list', () => {
    it('should add new ingredient when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const addIngredientButton = screen.getByRole('button', {
        name: /add ingredient/i,
      })

      await user.click(addIngredientButton)

      const ingredientInputs = screen.getAllByLabelText(/ingredient/i)
      expect(ingredientInputs.length).toBeGreaterThan(0)
    })

    it('should remove ingredient when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const removeButtons = screen.getAllByRole('button', {
        name: /remove ingredient/i,
      })
      const initialCount = removeButtons.length

      await user.click(removeButtons[0])

      await waitFor(() => {
        const updatedRemoveButtons = screen.queryAllByRole('button', {
          name: /remove ingredient/i,
        })
        expect(updatedRemoveButtons.length).toBe(initialCount - 1)
      })
    })
  })

  describe('dynamic instruction list', () => {
    it('should add new instruction when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const addInstructionButton = screen.getByRole('button', {
        name: /add instruction/i,
      })

      await user.click(addInstructionButton)

      const instructionInputs = screen.getAllByLabelText(/step/i)
      expect(instructionInputs.length).toBeGreaterThan(0)
    })

    it('should remove instruction when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeForm
          recipe={existingRecipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const removeButtons = screen.getAllByRole('button', {
        name: /remove step/i,
      })
      const initialCount = removeButtons.length

      await user.click(removeButtons[0])

      await waitFor(() => {
        const updatedRemoveButtons = screen.queryAllByRole('button', {
          name: /remove step/i,
        })
        expect(updatedRemoveButtons.length).toBe(initialCount - 1)
      })
    })
  })

  describe('tags input', () => {
    it('should accept comma-separated tags', async () => {
      const user = userEvent.setup()
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText(/name/i)
      const tagsInput = screen.getByLabelText(/tags/i)
      const servingsInput = screen.getByLabelText(/servings/i)
      const totalTimeInput = screen.getByLabelText(/total time/i)

      await user.type(nameInput, 'Test Recipe')
      await user.type(tagsInput, 'dinner, quick, healthy')
      await user.clear(servingsInput)
      await user.type(servingsInput, '4')
      await user.clear(totalTimeInput)
      await user.type(totalTimeInput, '30')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.arrayContaining(['dinner', 'quick', 'healthy']),
          })
        )
      })
    })
  })
})
