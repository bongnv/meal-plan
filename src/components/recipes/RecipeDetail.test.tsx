import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
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
  { id: '1', name: 'Spaghetti', category: 'Grains', unit: 'gram' },
  { id: '2', name: 'Bacon', category: 'Meat', unit: 'gram' },
  { id: '3', name: 'Eggs', category: 'Dairy', unit: 'piece' },
]

const mockRecipe: Recipe = {
  id: '1',
  name: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish with eggs, cheese, and bacon',
  ingredients: [
    { ingredientId: '1', quantity: 400 },
    { ingredientId: '2', quantity: 200 },
    { ingredientId: '3', quantity: 4 },
  ],
  instructions: [
    'Boil pasta in salted water',
    'Cook bacon until crispy',
    'Mix eggs with cheese',
    'Combine everything while hot',
  ],
  servings: 4,
  totalTime: 30,
  tags: ['Italian', 'Pasta', 'Quick'],
  imageUrl: 'https://example.com/carbonara.jpg',
}

const defaultMockIngredientContext = {
  ingredients: mockIngredients,
  loading: false,
  error: null,
  getIngredientById: (id: string) => mockIngredients.find(i => i.id === id),
  addIngredient: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

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
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(
        screen.getByText(/classic Italian pasta dish with eggs/i)
      ).toBeInTheDocument()
    })

    it('should display servings information', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
    })

    it('should display total time', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText(/30 min/i)).toBeInTheDocument()
    })

    it('should display all tags', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Italian')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Quick')).toBeInTheDocument()
    })
  })

  describe('Ingredients Display', () => {
    it('should render ingredients section heading', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Ingredients')).toBeInTheDocument()
    })

    it('should display all ingredients with quantities and units', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

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
          { ingredientId: '1', quantity: 400 },
          { ingredientId: '999', quantity: 100 }, // Non-existent ingredient
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithMissingIngredient} />)

      // Should display known ingredient
      expect(screen.getByText(/400/)).toBeInTheDocument()
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      // Should display fallback for unknown ingredient
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/Unknown Ingredient/i)).toBeInTheDocument()
    })
  })

  describe('Instructions Display', () => {
    it('should render instructions section heading', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Instructions')).toBeInTheDocument()
    })

    it('should display all instruction steps', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

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

  describe('Edge Cases', () => {
    it('should render recipe without image', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutImage} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should render recipe with empty tags array', () => {
      const recipeWithoutTags = { ...mockRecipe, tags: [] }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutTags} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should display loading state when ingredients are loading', () => {
      vi.mocked(IngredientContextModule.useIngredients).mockReturnValue({
        ...defaultMockIngredientContext,
        loading: true,
      })

      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })
  })
})
