import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'

import { CookingSubRecipeCard } from './CookingSubRecipeCard'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe, SubRecipe } from '../../types/recipe'

// Mock the useIngredients hook
vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockIngredients: Ingredient[] = [
  { id: '1', name: 'Flour', category: 'Grains' },
  { id: '2', name: 'Eggs', category: 'Dairy' },
  { id: '3', name: 'Butter', category: 'Dairy' },
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
  recipeId: 'pasta-recipe',
  servings: 6, // 6 servings of the sub-recipe
  displayName: 'Fresh Pasta',
}

const mockSubRecipeData: Recipe = {
  id: 'pasta-recipe',
  name: 'Pasta Dough',
  description: 'Fresh homemade pasta',
  ingredients: [
    { ingredientId: '1', quantity: 200, unit: 'gram' },
    { ingredientId: '2', quantity: 3, unit: 'whole' },
    { ingredientId: '3', quantity: 50, unit: 'gram' },
  ],
  instructions: [
    'Mix flour and eggs',
    'Knead for 10 minutes',
    'Rest for 30 minutes',
  ],
  subRecipes: [],
  servings: 4,
  prepTime: 20,
  cookTime: 0,
  tags: ['italian'],
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('CookingSubRecipeCard', () => {
  const mockOnToggleComplete = vi.fn()
  const mockOnViewDetails = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  describe('Display', () => {
    it('should render sub-recipe with display name', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1.5}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      expect(screen.getByText('Fresh Pasta')).toBeInTheDocument()
    })

    it('should fallback to recipe name when no displayName', () => {
      const subRecipeNoDisplay: SubRecipe = {
        recipeId: 'pasta-recipe',
        servings: 4,
      }

      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={subRecipeNoDisplay}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      expect(screen.getByText('Pasta Dough')).toBeInTheDocument()
    })

    it('should display servings in Makes section', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1.5}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Should display scaled servings (4 original * 1.5 = 6) with emoji icon
      expect(screen.getByText('6 servings')).toBeInTheDocument()
      expect(screen.getByText('🍽️')).toBeInTheDocument()
    })

    it('should display prep and cook times', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1.5}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Times are now shown with emoji icons and text labels
      expect(screen.getByText(/Prep: 20 min/)).toBeInTheDocument()
      expect(screen.getByText(/Cook: 0 min/)).toBeInTheDocument()
      expect(screen.getByText('⏱️')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('should display servings information', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1.5}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Check for servings info with emoji icon and text
      expect(screen.getByText('6 servings')).toBeInTheDocument()
      expect(screen.getByText('🍽️')).toBeInTheDocument()
    })

    it('should display ingredients with scaled quantities when expanded', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={2}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see ingredients
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Ingredients now in natural format: quantity unit name
      // Flour: 200 * 2 = 400 gram
      await waitFor(() => {
        expect(screen.getByText(/400 gram Flour/)).toBeInTheDocument()
      })
      // Eggs: 3 * 2 = 6 whole
      expect(screen.getByText(/6 Eggs/)).toBeInTheDocument()
    })

    it('should display ingredient names when expanded', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see ingredients
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Ingredients now in natural format
      await waitFor(() => {
        expect(screen.getByText(/200 gram Flour/)).toBeInTheDocument()
        expect(screen.getByText(/3 Eggs/)).toBeInTheDocument()
        expect(screen.getByText(/50 gram Butter/)).toBeInTheDocument()
      })
    })

    it('should handle missing sub-recipe data', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={undefined}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      expect(screen.getByText(/sub-recipe not found/i)).toBeInTheDocument()
    })

    it('should apply strikethrough when completed', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={true}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      const title = screen.getByText('Fresh Pasta')
      expect(title).toHaveStyle({ textDecoration: 'line-through' })
    })

    it('should change opacity when completed', () => {
      const { container } = renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={true}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      const card = container.querySelector('.mantine-Card-root')
      expect(card).toHaveStyle({ opacity: '0.6' })
    })
  })

  describe('Interactions', () => {
    it('should call onToggleComplete when checkbox is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      const checkbox = screen.getByRole('checkbox', {
        name: /mark fresh pasta as complete/i,
      })
      await user.click(checkbox)

      expect(mockOnToggleComplete).toHaveBeenCalledTimes(1)
    })

    it('should toggle entire card to show/hide ingredients and instructions', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Initially card should be collapsed - wait for initial render
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /expand details/i })
        ).toBeInTheDocument()
      })

      // Note: Mantine Collapse renders content but hides it with CSS when collapsed
      // So we just verify the expand button is there and test the interaction

      // Click expand button (chevron icon)
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Ingredients and instructions should now be visible
      await waitFor(() => {
        expect(screen.getByText('Mix flour and eggs')).toBeInTheDocument()
        expect(screen.getByText('Knead for 10 minutes')).toBeInTheDocument()
        expect(screen.getByText('📋 Ingredients')).toBeInTheDocument()
      })
    })

    it('should call onViewDetails when button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
          onViewDetails={mockOnViewDetails}
        />
      )

      const viewButton = screen.getByRole('button', {
        name: /view full recipe/i,
      })
      await user.click(viewButton)

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1)
    })

    it('should not show view details button when callback not provided', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      expect(
        screen.queryByRole('button', { name: /view full recipe/i })
      ).not.toBeInTheDocument()
    })

    it('should track ingredient checkboxes independently', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see ingredients
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Wait for ingredients to be visible and check checkboxes
      await waitFor(() => {
        const ingredientCheckboxes = screen.getAllByRole('checkbox').slice(1) // Skip main checkbox
        expect(ingredientCheckboxes).toHaveLength(3) // 3 ingredients
      })
    })

    it('should show instructions count when expanded', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see instructions
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Instructions count should be visible
      await waitFor(() => {
        expect(screen.getByText(/3 steps/)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle recipe with no instructions', () => {
      const recipeNoInstructions: Recipe = {
        ...mockSubRecipeData,
        instructions: [],
      }

      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={recipeNoInstructions}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Instructions section should not render
      expect(screen.queryByText(/instructions/i)).not.toBeInTheDocument()
    })

    it('should handle recipe with custom ingredient display names', async () => {
      const user = userEvent.setup()
      const recipeWithCustomNames: Recipe = {
        ...mockSubRecipeData,
        ingredients: [
          {
            ingredientId: '1',
            quantity: 200,
            unit: 'gram',
            displayName: 'All-purpose flour (sifted)',
          },
        ],
      }

      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={recipeWithCustomNames}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see ingredients
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Should display custom name in natural format
      await waitFor(() => {
        expect(
          screen.getByText(/200 gram All-purpose flour \(sifted\)/)
        ).toBeInTheDocument()
      })
    })

    it('should handle recipe with whole unit', async () => {
      const user = userEvent.setup()
      const recipeWholeUnit: Recipe = {
        ...mockSubRecipeData,
        ingredients: [{ ingredientId: '2', quantity: 3, unit: 'whole' }],
      }

      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={recipeWholeUnit}
          servingMultiplier={1}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Expand card to see ingredients
      const expandButton = screen.getByRole('button', {
        name: /expand details/i,
      })
      await user.click(expandButton)

      // Should show quantity without unit for whole items
      await waitFor(
        () => {
          // Check that we can find the number 3 (the quantity)
          const allText = screen.getAllByText(/3/)
          expect(allText.length).toBeGreaterThan(0)
        },
        { timeout: 2000 }
      )

      // Unit column should be empty for 'whole' - no "whole" text should appear
      const unitElements = screen.queryAllByText('whole')
      expect(unitElements).toHaveLength(0)
    })

    it('should handle fractional quantities', () => {
      renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={0.5}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Servings: 4 * 0.5 = 2 servings displayed in metadata
      expect(screen.getByText(/2 servings/)).toBeInTheDocument()
    })

    it('should handle large serving multipliers', () => {
      const { container } = renderWithProviders(
        <CookingSubRecipeCard
          subRecipe={mockSubRecipe}
          subRecipeData={mockSubRecipeData}
          servingMultiplier={10}
          isCompleted={false}
          onToggleComplete={mockOnToggleComplete}
        />
      )

      // Should render without errors and display servings info (4 * 10 = 40)
      expect(screen.getByText(/40 servings/)).toBeInTheDocument()

      // Check that card is rendered
      const card = container.querySelector('.mantine-Card-root')
      expect(card).toBeInTheDocument()
    })
  })
})
