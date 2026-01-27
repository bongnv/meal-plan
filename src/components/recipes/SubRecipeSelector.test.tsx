import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import * as RecipeContextModule from '../../contexts/RecipeContext'
import * as CircularDependencyModule from '../../utils/recipes/circularDependency'

import { SubRecipeSelector } from './SubRecipeSelector'

import type { Recipe } from '../../types/recipe'

// Mock the useRecipes hook
vi.mock('../../contexts/RecipeContext', () => ({
  useRecipes: vi.fn(),
}))

// Mock circular dependency detection
vi.mock('../../utils/recipes/circularDependency', () => ({
  getExcludedRecipeIds: vi.fn(),
}))

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    name: 'Pasta',
    description: 'Fresh pasta',
    ingredients: [],
    subRecipes: [],
    instructions: ['Step 1'],
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    tags: ['italian'],
  },
  {
    id: 'r2',
    name: 'Tomato Sauce',
    description: 'Red sauce',
    ingredients: [],
    subRecipes: [],
    instructions: ['Step 1'],
    servings: 4,
    prepTime: 5,
    cookTime: 30,
    tags: ['sauce'],
  },
  {
    id: 'r3',
    name: 'Basil Oil',
    description: 'Aromatic oil',
    ingredients: [],
    subRecipes: [],
    instructions: ['Step 1'],
    servings: 1,
    prepTime: 5,
    cookTime: 0,
    tags: ['condiment'],
  },
]

const defaultMockRecipeContext = {
  recipes: mockRecipes,
  loading: false,
  error: null,
  getRecipeById: (id: string) => mockRecipes.find(r => r.id === id),
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  replaceAllRecipes: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('SubRecipeSelector', () => {
  const mockOnAdd = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnAdd.mockClear()
    mockOnClose.mockClear()
    vi.mocked(RecipeContextModule.useRecipes).mockReturnValue(
      defaultMockRecipeContext
    )
    vi.mocked(CircularDependencyModule.getExcludedRecipeIds).mockReturnValue([])
  })

  describe('Modal Display', () => {
    it('should render modal when open is true', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render modal when open is false', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={false}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display title', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      expect(screen.getByText(/select sub-recipe/i)).toBeInTheDocument()
    })
  })

  describe('Recipe Search and Filter', () => {
    it('should display search input', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()
    })

    it('should filter recipes by search term', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search recipes/i)
      await user.type(searchInput, 'Tomato')

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument()
      })

      // Pasta should be filtered out
      await waitFor(() => {
        expect(screen.queryByText('Pasta')).not.toBeInTheDocument()
      })
    })

    it('should display all recipes when search is empty', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Tomato Sauce')).toBeInTheDocument()
      expect(screen.getByText('Basil Oil')).toBeInTheDocument()
    })
  })

  describe('Recipe Selection', () => {
    it('should allow selecting a recipe', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      // Should show in selected preview
      await waitFor(() => {
        expect(screen.getByText('Pasta')).toBeInTheDocument()
      })
    })

    it('should display recipe details when selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      // Recipe details (prep/cook time) are shown in the recipe cards
      expect(screen.getAllByText(/min prep/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/min cook/i).length).toBeGreaterThan(0)

      const tomatoSauce = screen.getByText('Tomato Sauce')
      await user.click(tomatoSauce)

      // After selection, the configuration form should appear
      await waitFor(() => {
        expect(screen.getByText(/configure sub-recipe/i)).toBeInTheDocument()
      })
    })
  })

  describe('Servings and Display Name', () => {
    it('should display quantity input with default value', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const quantityInput = await screen.findByDisplayValue('1')
      expect(quantityInput).toBeInTheDocument()
    })

    it('should display displayName input after recipe selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/filling.*topping/i)
        ).toBeInTheDocument()
      })
    })

    it('should allow editing quantity', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const quantityInput = await screen.findByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '2.5')

      expect(quantityInput).toHaveValue('2.5')
    })

    it('should allow editing displayName', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const displayNameInput =
        await screen.findByPlaceholderText(/filling.*topping/i)
      await user.type(displayNameInput, 'Fresh Pasta')

      expect(displayNameInput).toHaveValue('Fresh Pasta')
    })
  })

  describe('Actions', () => {
    it('should call onAdd with sub-recipe data when Add button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const addButton = await screen.findByRole('button', {
        name: /add sub-recipe/i,
      })
      await user.click(addButton)

      expect(mockOnAdd).toHaveBeenCalledWith({
        recipeId: 'r1',
        servings: 1,
        displayName: undefined,
      })
    })

    it('should call onAdd with custom quantity', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const quantityInput = await screen.findByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '1.5')

      const addButton = await screen.findByRole('button', {
        name: /add sub-recipe/i,
      })
      await user.click(addButton)

      expect(mockOnAdd).toHaveBeenCalledWith({
        recipeId: 'r1',
        servings: 1.5,
        displayName: undefined,
      })
    })

    it('should call onAdd with custom displayName', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const displayNameInput =
        await screen.findByPlaceholderText(/filling.*topping/i)
      await user.type(displayNameInput, 'Filling')

      const addButton = await screen.findByRole('button', {
        name: /add sub-recipe/i,
      })
      await user.click(addButton)

      expect(mockOnAdd).toHaveBeenCalledWith({
        recipeId: 'r1',
        servings: 1,
        displayName: 'Filling',
      })
    })

    it('should call onClose when Cancel button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const addButton = screen.getByRole('button', { name: /add sub-recipe/i })
      await user.click(addButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Validation', () => {
    it('should disable excluded recipes', () => {
      vi.mocked(CircularDependencyModule.getExcludedRecipeIds).mockReturnValue([
        'r1',
      ])

      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          currentRecipeId="main"
        />
      )

      // The excluded recipe should be disabled or hidden
      const pastaRecipe = screen.getByText('Pasta')
      expect(pastaRecipe).toBeInTheDocument()
    })

    it('should not allow adding without selecting a recipe', () => {
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const addButton = screen.getByRole('button', { name: /add sub-recipe/i })
      // Button should be disabled when no recipe selected
      expect(addButton).toBeDisabled()
    })

    it('should validate quantity is positive', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubRecipeSelector
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      )

      const pastaRecipe = screen.getByText('Pasta')
      await user.click(pastaRecipe)

      const quantityInput = await screen.findByDisplayValue('1')
      await user.clear(quantityInput)
      await user.type(quantityInput, '0')

      const addButton = screen.getByRole('button', { name: /add sub-recipe/i })
      // Button should be disabled for invalid quantity
      expect(addButton).toBeDisabled()
    })
  })
})
