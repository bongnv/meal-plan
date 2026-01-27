import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'

import { RecipeDetail } from './RecipeDetail'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the useIngredients hook
vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockIngredients: Ingredient[] = [
  { id: '1', name: 'Spaghetti', category: 'Grains' },
  { id: '2', name: 'Bacon', category: 'Meat' },
  { id: '3', name: 'Eggs', category: 'Dairy' },
]

const mockRecipe: Recipe = {
  id: '1',
  name: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish with eggs, cheese, and bacon',
  ingredients: [
    { ingredientId: '1', servings: 400, unit: 'gram' },
    { ingredientId: '2', servings: 200, unit: 'gram' },
    { ingredientId: '3', servings: 4, unit: 'whole' },
  ],
  instructions: [
    'Boil pasta in salted water',
    'Cook bacon until crispy',
    'Mix eggs with cheese',
    'Combine everything while hot',
  ],
  subRecipes: [],
  servings: 4,
  prepTime: 15,
  cookTime: 15,
  tags: ['Italian', 'Pasta', 'Quick'],
  imageUrl: 'https://example.com/carbonara.jpg',
}

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

// Default mock for getRecipeById (returns undefined for all recipes)
const defaultGetRecipeById = vi.fn(() => undefined)

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </MantineProvider>
  )
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock for useIngredients
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  describe('Recipe Information Display', () => {
    it('should render recipe description', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(
        screen.getByText(/classic Italian pasta dish with eggs/i)
      ).toBeInTheDocument()
    })

    it('should display servings information', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
    })

    it('should display prep and cook time', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Mock recipe has prepTime: 15, cookTime: 15
      // Display shows separate sections for prep and cook
      expect(screen.getByText('Prep: 15 min')).toBeInTheDocument()
      expect(screen.getByText('Cook: 15 min')).toBeInTheDocument()
    })

    it('should display all tags', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText('Italian')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Quick')).toBeInTheDocument()
    })
  })

  describe('Ingredients Display', () => {
    it('should render ingredients section heading', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText('Ingredients')).toBeInTheDocument()
    })

    it('should display all ingredients with quantities and units', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Check each ingredient is displayed with its quantity
      expect(screen.getByText(/400/)).toBeInTheDocument()
      expect(screen.getByText(/200/)).toBeInTheDocument()

      // Check ingredient names - there may be multiple matches (title + ingredient)
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      const baconMatches = screen.getAllByText(/Bacon/i)
      expect(baconMatches.length).toBeGreaterThanOrEqual(1)

      const eggsMatches = screen.getAllByText(/Eggs/i)
      expect(eggsMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle missing ingredient from library gracefully', () => {
      const recipeWithMissingIngredient: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400 },
          { ingredientId: '999', servings: 100 }, // Non-existent ingredient
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithMissingIngredient}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display known ingredient
      expect(screen.getByText(/400/)).toBeInTheDocument()
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      // Should display fallback for unknown ingredient
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/Unknown Ingredient/i)).toBeInTheDocument()
    })

    it('should display custom displayName when provided', () => {
      const recipeWithDisplayNames: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400, displayName: 'pasta' },
          { ingredientId: '2', servings: 200, displayName: 'pancetta' },
          { ingredientId: '3', servings: 4 }, // No displayName, should use library name
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithDisplayNames}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display custom names - use getAllByText since "pasta" appears in multiple places
      const pastaMatches = screen.getAllByText(/pasta/i)
      expect(pastaMatches.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/pancetta/i)).toBeInTheDocument()

      // Should display library name when no displayName
      const eggsMatches = screen.getAllByText(/Eggs/i)
      expect(eggsMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should fall back to library name when displayName is not provided', () => {
      const recipeWithoutDisplayNames: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400 }, // No displayName
          { ingredientId: '2', servings: 200 }, // No displayName
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutDisplayNames}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display library names as fallback
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      const baconMatches = screen.getAllByText(/Bacon/i)
      expect(baconMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle displayName with special characters', () => {
      const recipeWithSpecialChars: Recipe = {
        ...mockRecipe,
        ingredients: [
          {
            ingredientId: '1',
            servings: 400,
            displayName: 'spaghetti (al dente)',
          },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSpecialChars}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText(/spaghetti \(al dente\)/i)).toBeInTheDocument()
    })

    it('should handle displayName when ingredient is missing from library', () => {
      const recipeWithDisplayNameAndMissingIngredient: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '999', servings: 100, displayName: 'mystery meat' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithDisplayNameAndMissingIngredient}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display custom displayName even when ingredient not found in library
      expect(screen.getByText(/mystery meat/i)).toBeInTheDocument()
      expect(screen.queryByText(/Unknown Ingredient/i)).not.toBeInTheDocument()
    })

    it('should adjust displayName quantities when servings change', async () => {
      const user = userEvent.setup()
      const recipeWithDisplayName: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400, displayName: 'pasta' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithDisplayName}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Initial quantity (now formatted without trailing .0)
      expect(screen.getByText(/400/)).toBeInTheDocument()
      const pastaMatchesInitial = screen.getAllByText(/pasta/i)
      expect(pastaMatchesInitial.length).toBeGreaterThanOrEqual(1)

      // Increase servings from 4 to 5
      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      // Quantity should be adjusted (400 * 5/4 = 500, formatted without .0)
      expect(screen.getByText(/500/)).toBeInTheDocument()
      const pastaMatchesAfter = screen.getAllByText(/pasta/i)
      expect(pastaMatchesAfter.length).toBeGreaterThanOrEqual(1)
    })

    it('should prefer recipe ingredient unit over library unit', () => {
      const recipeWithRecipeUnit: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400, unit: 'cup' }, // Override library unit (gram)
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithRecipeUnit}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display recipe unit (cup), not library unit (gram)
      expect(screen.getByText(/400 cup/i)).toBeInTheDocument()
      expect(screen.queryByText(/gram/i)).not.toBeInTheDocument()
    })

    it('should display empty unit when recipe unit is not provided (pre-migration)', () => {
      const recipeWithoutUnit: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400 }, // No unit specified (will be migrated)
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutUnit}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display quantity without unit (migration will fix this)
      expect(screen.getByText(/400/i)).toBeInTheDocument()
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should hide "whole" unit for natural reading', () => {
      const recipeWithWholeUnit: Recipe = {
        ...mockRecipe,
        servings: 2, // Different from ingredient quantity to avoid confusion
        ingredients: [
          { ingredientId: '3', servings: 4, unit: 'whole' }, // 4 whole eggs
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithWholeUnit}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display ingredient name (may appear multiple times in the rendered component)
      const eggsMatches = screen.getAllByText(/Eggs/i)
      expect(eggsMatches.length).toBeGreaterThanOrEqual(1)
      // Should NOT display "whole" unit anywhere
      expect(screen.queryByText(/whole/i)).not.toBeInTheDocument()
    })

    it('should display non-whole units normally', () => {
      const recipeWithVariousUnits: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 2, unit: 'cup' },
          { ingredientId: '2', servings: 100, unit: 'gram' },
          { ingredientId: '3', servings: 3, unit: 'tablespoon' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithVariousUnits}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should display all non-whole units
      expect(screen.getByText(/2 cup/i)).toBeInTheDocument()
      expect(screen.getByText(/100 gram/i)).toBeInTheDocument()
      expect(screen.getByText(/3 tablespoon/i)).toBeInTheDocument()
    })

    it('should handle missing ingredient with recipe unit', () => {
      const recipeWithMissingIngredient: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '999', servings: 2, unit: 'cup' }, // Non-existent ingredient
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithMissingIngredient}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Should use recipe unit even when ingredient not found
      expect(screen.getByText(/2 cup/i)).toBeInTheDocument()
      expect(screen.getByText(/Unknown Ingredient/i)).toBeInTheDocument()
    })
  })

  describe('Instructions Display', () => {
    it('should render instructions section heading', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText('Instructions')).toBeInTheDocument()
    })

    it('should display all instruction steps', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(
        screen.getByText(/Boil pasta in salted water/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Cook bacon until crispy/i)).toBeInTheDocument()
      expect(screen.getByText(/Mix eggs with cheese/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Combine everything while hot/i)
      ).toBeInTheDocument()
    })
  })

  describe('Interactive Features', () => {
    it('should increase servings when clicking increase button', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      expect(screen.getByText(/5 servings/i)).toBeInTheDocument()
    })

    it('should decrease servings when clicking decrease button', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const decreaseButton = screen.getByLabelText('Decrease servings')
      await user.click(decreaseButton)

      expect(screen.getByText(/3 servings/i)).toBeInTheDocument()
    })

    it('should not decrease servings below 1', async () => {
      const user = userEvent.setup()
      const recipeWith1Serving = { ...mockRecipe, servings: 1 }
      renderWithProviders(
        <RecipeDetail
          recipe={recipeWith1Serving}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const decreaseButton = screen.getByLabelText('Decrease servings')
      await user.click(decreaseButton)

      // Should stay at 1 serving
      expect(screen.getByText(/1 servings/i)).toBeInTheDocument()
    })

    it('should adjust ingredient quantities based on servings', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      // Initial quantities for 4 servings (now formatted without trailing .0)
      expect(screen.getByText(/400/)).toBeInTheDocument()

      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      // After increasing to 5 servings, quantities should be scaled
      expect(screen.getByText(/500/)).toBeInTheDocument()
    })

    it('should use initialServings prop if provided', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          initialServings={6}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText(/6 servings/i)).toBeInTheDocument()
      // Quantity should be scaled to 6 servings (400 * 6/4 = 600, formatted without .0)
      expect(screen.getByText(/600/)).toBeInTheDocument()
    })

    it('should toggle ingredient checkbox when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const firstIngredientCheckbox = checkboxes[0]

      expect(firstIngredientCheckbox).not.toBeChecked()

      await user.click(firstIngredientCheckbox)
      expect(firstIngredientCheckbox).toBeChecked()

      await user.click(firstIngredientCheckbox)
      expect(firstIngredientCheckbox).not.toBeChecked()
    })
  })

  describe('Edge Cases', () => {
    it('should render recipe without image', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutImage}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should render recipe with empty tags array', () => {
      const recipeWithoutTags = { ...mockRecipe, tags: [] }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutTags}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should render recipe with no description', () => {
      const recipeWithoutDescription = { ...mockRecipe, description: '' }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutDescription}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.getByText('No description')).toBeInTheDocument()
    })

    it('should display loading state when ingredients are loading', () => {
      vi.mocked(IngredientContextModule.useIngredients).mockReturnValue({
        ...defaultMockIngredientContext,
        loading: true,
      })

      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Hero Image Display', () => {
    it('should display hero image when imageUrl is provided', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/carbonara.jpg')
    })

    it('should not display image section when imageUrl is absent', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithoutImage}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const images = screen.queryByRole('img')
      expect(images).not.toBeInTheDocument()
    })

    it('should use recipe name as alt text for accessibility', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const image = screen.getByAltText('Spaghetti Carbonara')
      expect(image).toBeInTheDocument()
    })

    it('should handle broken image URLs gracefully', () => {
      const recipeWithBrokenImage = {
        ...mockRecipe,
        imageUrl: 'https://example.com/broken.jpg',
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithBrokenImage}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
    })

    it('should maintain responsive design with image', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
      // Mantine Image component handles responsive design internally
    })
  })

  describe('Sub-Recipes Display', () => {
    it('should not display sub-recipes section when subRecipes is empty', () => {
      renderWithProviders(
        <RecipeDetail
          recipe={mockRecipe}
          getRecipeById={defaultGetRecipeById}
        />
      )

      expect(screen.queryByText('Sub-Recipes')).not.toBeInTheDocument()
    })

    it('should display sub-recipes section when recipe has sub-recipes', () => {
      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [
          { recipeId: 'sub1', servings: 2 },
          { recipeId: 'sub2', servings: 1, displayName: 'Special Sauce' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={defaultGetRecipeById}
          onRecipeClick={vi.fn()}
        />
      )

      expect(screen.getByText('Sub-Recipes')).toBeInTheDocument()
    })

    it('should display sub-recipe with recipe name when no displayName', () => {
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [{ recipeId: 'sub1', servings: 2 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Format: 🍳 Pasta Dough (2× 4 servings)
      expect(screen.getByText(/🍳/)).toBeInTheDocument()
      expect(screen.getByText(/Pasta Dough/)).toBeInTheDocument()
      expect(screen.getByText(/2×/)).toBeInTheDocument()
    })

    it('should display sub-recipe with displayName when provided', () => {
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [
          { recipeId: 'sub1', servings: 2, displayName: 'Fresh Pasta' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Should show displayName instead of recipe name
      expect(screen.getByText(/Fresh Pasta/)).toBeInTheDocument()
      expect(screen.queryByText(/Pasta Dough/)).not.toBeInTheDocument()
    })

    it('should make sub-recipe clickable when onRecipeClick is provided', async () => {
      const user = userEvent.setup()
      const mockOnRecipeClick = vi.fn()
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [{ recipeId: 'sub1', servings: 2 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
          onRecipeClick={mockOnRecipeClick}
        />
      )

      const subRecipeLink = screen.getByText(/Pasta Dough/)
      await user.click(subRecipeLink)

      expect(mockOnRecipeClick).toHaveBeenCalledWith('sub1')
    })

    it('should handle missing sub-recipe gracefully', () => {
      const getRecipeById = vi.fn(() => undefined)

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [{ recipeId: 'missing', servings: 1 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Should show placeholder or recipe ID
      expect(screen.getByText(/Sub-Recipes/)).toBeInTheDocument()
      expect(screen.getByText(/missing/)).toBeInTheDocument()
    })

    it('should display multiple sub-recipes', () => {
      const getRecipeById = vi.fn((id: string) => {
        const recipes: Record<string, Recipe> = {
          sub1: { id: 'sub1', name: 'Pasta Dough', servings: 4 } as Recipe,
          sub2: { id: 'sub2', name: 'Tomato Sauce', servings: 6 } as Recipe,
        }
        return recipes[id]
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [
          { recipeId: 'sub1', servings: 1 },
          { recipeId: 'sub2', servings: 2, displayName: 'Special Sauce' },
        ],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      expect(screen.getByText(/Pasta Dough/)).toBeInTheDocument()
      expect(screen.getByText(/Special Sauce/)).toBeInTheDocument()
      expect(screen.queryByText(/Tomato Sauce/)).not.toBeInTheDocument() // displayName overrides
    })

    it('should support expand/collapse for sub-recipes', async () => {
      const user = userEvent.setup()
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
            prepTime: 10,
            cookTime: 5,
            ingredients: [
              { ingredientId: '1', servings: 500, unit: 'gram' },
              { ingredientId: '2', servings: 100, unit: 'gram' }, // Bacon - unique to sub-recipe
            ],
            instructions: ['Mix flour and eggs', 'Knead for 10 minutes'],
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400, unit: 'gram' }, // Main recipe has 400g spaghetti
          { ingredientId: '3', servings: 4, unit: 'whole' }, // Main recipe has 4 eggs
        ],
        subRecipes: [{ recipeId: 'sub1', servings: 2 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Find expand button - should be present initially
      const expandButton = screen.getByLabelText(/expand details/i)
      expect(expandButton).toBeInTheDocument()

      // Click expand button
      await user.click(expandButton)

      // Sub-recipe details should now be visible
      expect(screen.getByText(/100/)).toBeInTheDocument() // 100g bacon from sub-recipe
      expect(screen.getByText(/500/)).toBeInTheDocument() // 500g spaghetti from sub-recipe
      expect(screen.getByText(/⏱️ Prep:/)).toBeInTheDocument()
      expect(screen.getByText('10 min')).toBeInTheDocument()
      expect(screen.getByText(/🔥 Cook:/)).toBeInTheDocument()
      expect(screen.getByText('5 min')).toBeInTheDocument()
      expect(screen.getByText(/Mix flour and eggs/)).toBeInTheDocument()
      expect(screen.getByText(/Knead for 10 minutes/)).toBeInTheDocument()

      // Collapse button should now be present
      const collapseButton = screen.getByLabelText(/collapse details/i)
      await user.click(collapseButton)

      // Expand button should be back
      expect(screen.getByLabelText(/expand details/i)).toBeInTheDocument()
    })

    it('should show sub-recipe ingredients as read-only when expanded', async () => {
      const user = userEvent.setup()
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
            prepTime: 10,
            cookTime: 5,
            ingredients: [
              { ingredientId: '1', servings: 500, unit: 'gram' },
              { ingredientId: '2', servings: 100, unit: 'gram' },
            ],
            instructions: ['Mix ingredients'],
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', servings: 400, unit: 'gram' },
          { ingredientId: '3', servings: 4, unit: 'whole' },
        ],
        subRecipes: [{ recipeId: 'sub1', servings: 2 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Expand sub-recipe
      const expandButton = screen.getByLabelText(/expand details/i)
      await user.click(expandButton)

      // Sub-recipe ingredients should be visible as text
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/500/)).toBeInTheDocument()

      // Count total checkboxes - only main recipe ingredients should have checkboxes
      const checkboxes = screen.getAllByRole('checkbox')
      // Main recipe has 2 ingredients (changed from 3), sub-recipe ingredients should not be checkboxes
      expect(checkboxes).toHaveLength(2)
    })

    it('should show sub-recipe instructions when expanded', async () => {
      const user = userEvent.setup()
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
            prepTime: 10,
            cookTime: 5,
            ingredients: [{ ingredientId: '1', servings: 500, unit: 'gram' }],
            instructions: [
              'Mix flour and water',
              'Knead for 10 minutes',
              'Let rest for 30 minutes',
            ],
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [{ recipeId: 'sub1', servings: 1 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Expand sub-recipe
      const expandButton = screen.getByLabelText(/expand details/i)
      await user.click(expandButton)

      // Instructions should now be visible with numbering
      expect(screen.getByText(/Mix flour and water/)).toBeInTheDocument()
      expect(screen.getByText(/Knead for 10 minutes/)).toBeInTheDocument()
      expect(screen.getByText(/Let rest for 30 minutes/)).toBeInTheDocument()
    })

    it('should show cooking times when sub-recipe is expanded', async () => {
      const user = userEvent.setup()
      const getRecipeById = vi.fn((id: string) => {
        if (id === 'sub1') {
          return {
            id: 'sub1',
            name: 'Pasta Dough',
            servings: 4,
            prepTime: 25, // Different from main recipe (15) to avoid conflicts
            cookTime: 30, // Different from main recipe (15) to avoid conflicts
            ingredients: [{ ingredientId: '1', servings: 500, unit: 'gram' }],
            instructions: ['Cook'],
          } as Recipe
        }
        return undefined
      })

      const recipeWithSubRecipes: Recipe = {
        ...mockRecipe,
        subRecipes: [{ recipeId: 'sub1', servings: 1 }],
      }

      renderWithProviders(
        <RecipeDetail
          recipe={recipeWithSubRecipes}
          getRecipeById={getRecipeById}
        />
      )

      // Expand sub-recipe
      const expandButton = screen.getByLabelText(/expand details/i)
      await user.click(expandButton)

      // Cooking times should be visible (use unique values to avoid conflict with main recipe)
      expect(screen.getByText(/⏱️ Prep:/)).toBeInTheDocument()
      expect(screen.getByText('25 min')).toBeInTheDocument()
      expect(screen.getByText(/🔥 Cook:/)).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
    })
  })
})
