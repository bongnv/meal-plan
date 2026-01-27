import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'

import { SubRecipeCard } from './SubRecipeCard'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe, SubRecipe } from '../../types/recipe'

// Mock the useIngredients hook
vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockIngredients: Ingredient[] = [
  { id: '1', name: 'Flour', category: 'Grains' },
  { id: '2', name: 'Eggs', category: 'Dairy' },
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

const mockSubRecipe: SubRecipe = {
  recipeId: 'sub1',
  servings: 8, // 8 servings (2x of the 4 servings recipe)
}

const mockRecipeData: Recipe = {
  id: 'sub1',
  name: 'Pasta Dough',
  description: 'Fresh homemade pasta',
  ingredients: [
    { ingredientId: '1', quantity: 400, unit: 'gram' },
    { ingredientId: '2', quantity: 4, unit: 'whole' },
  ],
  instructions: ['Mix ingredients', 'Knead dough'],
  subRecipes: [],
  servings: 4,
  prepTime: 30,
  cookTime: 0,
  tags: [],
}

function renderWithProviders(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

describe('SubRecipeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock for useIngredients
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  describe('Display', () => {
    it('should render sub-recipe with recipe name when no displayName', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(screen.getByText(/Pasta Dough/)).toBeInTheDocument()
      expect(screen.getByText(/8 servings/)).toBeInTheDocument()
    })

    it('should render sub-recipe with displayName when provided', () => {
      const subRecipeWithDisplayName: SubRecipe = {
        ...mockSubRecipe,
        displayName: 'Fresh Pasta',
      }

      renderWithProviders(
        <SubRecipeCard
          subRecipe={subRecipeWithDisplayName}
          recipeData={mockRecipeData}
        />
      )

      expect(screen.getByText(/Fresh Pasta/)).toBeInTheDocument()
      expect(screen.queryByText(/Pasta Dough/)).not.toBeInTheDocument()
    })

    it('should display SUB-RECIPE badge', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(screen.getByText('SUB-RECIPE')).toBeInTheDocument()
    })

    it('should show recipe ID when recipe data is not available', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={undefined} />
      )

      expect(screen.getByText(/sub1/)).toBeInTheDocument()
    })

    it('should display servings information', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(screen.getByText(/8 servings/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnRemove = vi.fn()

      renderWithProviders(
        <SubRecipeCard
          subRecipe={mockSubRecipe}
          recipeData={mockRecipeData}
          onRemove={mockOnRemove}
        />
      )

      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('should not show remove button when onRemove is not provided', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(
        screen.queryByRole('button', { name: /remove/i })
      ).not.toBeInTheDocument()
    })

    it('should call onClick when card is clicked (if provided)', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(
        <SubRecipeCard
          subRecipe={mockSubRecipe}
          recipeData={mockRecipeData}
          onClick={mockOnClick}
        />
      )

      // Click on the card (not the remove button)
      const cardText = screen.getByText(/Pasta Dough/)
      await user.click(cardText)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not be clickable when onClick is not provided', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      const cardText = screen.getByText(/Pasta Dough/)
      // Should not have pointer cursor or button role
      expect(cardText).not.toHaveStyle({ cursor: 'pointer' })
    })
  })

  describe('Expandable Content', () => {
    it('should show ingredients preview when expanded', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <SubRecipeCard
          subRecipe={mockSubRecipe}
          recipeData={mockRecipeData}
          expandable
        />
      )

      // Initially collapsed - ingredients label not visible
      expect(screen.queryByText('Ingredients:')).not.toBeInTheDocument()

      // Find and click expand button
      const expandButton = screen.getByRole('button', {
        name: /expand|show|details/i,
      })
      await user.click(expandButton)

      // Ingredients should now be visible (wait for animation)
      await waitFor(() => {
        expect(screen.getByText('Ingredients:')).toBeInTheDocument()
      })
      // Check that ingredient quantity is scaled (800 = 400 * (8/4))
      await waitFor(() => {
        expect(screen.getByText(/800/)).toBeInTheDocument()
      })
    })

    it('should not show expand button when expandable is false', () => {
      renderWithProviders(
        <SubRecipeCard
          subRecipe={mockSubRecipe}
          recipeData={mockRecipeData}
          expandable={false}
        />
      )

      expect(
        screen.queryByRole('button', { name: /expand|show|details/i })
      ).not.toBeInTheDocument()
    })

    it('should not show expand button by default', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(
        screen.queryByRole('button', { name: /expand|show|details/i })
      ).not.toBeInTheDocument()
    })

    it('should toggle expanded state when clicking expand button', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <SubRecipeCard
          subRecipe={mockSubRecipe}
          recipeData={mockRecipeData}
          expandable
        />
      )

      const expandButton = screen.getByRole('button', {
        name: /expand|show|details/i,
      })

      // Expand
      await user.click(expandButton)
      await waitFor(() => {
        expect(screen.getByText('Ingredients:')).toBeInTheDocument()
      })

      // Collapse
      await user.click(expandButton)
      await waitFor(() => {
        expect(screen.queryByText('Ingredients:')).not.toBeInTheDocument()
      })
    })
  })

  describe('Styling', () => {
    it('should have blue border style', () => {
      const { container } = renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      // Mantine Card should have border styling
      const card = container.querySelector('.mantine-Card-root')
      expect(card).toBeInTheDocument()
    })

    it('should display emoji icon', () => {
      renderWithProviders(
        <SubRecipeCard subRecipe={mockSubRecipe} recipeData={mockRecipeData} />
      )

      expect(screen.getByText('🍳')).toBeInTheDocument()
    })
  })
})
