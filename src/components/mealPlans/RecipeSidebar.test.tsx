import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'
import * as RecipeContextModule from '../../contexts/RecipeContext'
import { render } from '../../test/test-utils'

import { RecipeSidebar } from './RecipeSidebar'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

// Mock the contexts
vi.mock('../../contexts/RecipeContext', () => ({
  useRecipes: vi.fn(),
}))

vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta',
    ingredients: [
      { ingredientId: 'ing1', quantity: 400 },
      { ingredientId: 'ing2', quantity: 200 },
    ],
    instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
    servings: 4,
    totalTime: 25,
    tags: ['italian', 'pasta', 'quick'],
    imageUrl: undefined,
  },
  {
    id: '2',
    name: 'Chicken Curry',
    description: 'Spicy Indian curry',
    ingredients: [
      { ingredientId: 'ing3', quantity: 500 },
      { ingredientId: 'ing4', quantity: 200 },
    ],
    instructions: ['Cook chicken', 'Add spices', 'Simmer'],
    servings: 6,
    totalTime: 45,
    tags: ['indian', 'spicy'],
    imageUrl: undefined,
  },
  {
    id: '3',
    name: 'Quick Salad',
    description: 'Fresh vegetable salad',
    ingredients: [{ ingredientId: 'ing5', quantity: 300 }],
    instructions: ['Chop vegetables', 'Mix dressing', 'Toss'],
    servings: 2,
    totalTime: 10,
    tags: ['vegetarian', 'quick', 'salad'],
    imageUrl: undefined,
  },
]

const mockIngredients: Ingredient[] = [
  { id: 'ing1', name: 'Spaghetti', category: 'Grains', unit: 'gram' },
  { id: 'ing2', name: 'Parmesan', category: 'Dairy', unit: 'gram' },
  { id: 'ing3', name: 'Chicken', category: 'Meat', unit: 'gram' },
  {
    id: 'ing4',
    name: 'Curry Powder',
    category: 'Herbs & Spices',
    unit: 'gram',
  },
  { id: 'ing5', name: 'Lettuce', category: 'Vegetables', unit: 'gram' },
]

const defaultMockRecipeContext = {
  recipes: mockRecipes,
  loading: false,
  error: null,
  getRecipeById: vi.fn((id: string) => mockRecipes.find(r => r.id === id)),
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  replaceAllRecipes: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

const defaultMockIngredientContext = {
  ingredients: mockIngredients,
  loading: false,
  error: null,
  getIngredientById: vi.fn((id: string) =>
    mockIngredients.find(i => i.id === id)
  ),
  addIngredient: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

describe('RecipeSidebar', () => {
  beforeEach(() => {
    // Set up default mocks
    vi.mocked(RecipeContextModule.useRecipes).mockReturnValue(
      defaultMockRecipeContext
    )
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  it('should render recipe list with all recipes initially', () => {
    render(<RecipeSidebar />)

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()
  })

  it('should display search input', () => {
    render(<RecipeSidebar />)

    expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()
  })

  it('should filter recipes by search text', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    const searchInput = screen.getByPlaceholderText(/search recipes/i)
    await user.type(searchInput, 'chicken')

    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument()
    expect(screen.queryByText('Quick Salad')).not.toBeInTheDocument()
  })

  it('should display tag filter', () => {
    render(<RecipeSidebar />)

    expect(screen.getByPlaceholderText(/filter by tags/i)).toBeInTheDocument()
  })

  it('should filter recipes by tag', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    // Initially all 3 recipes should be visible
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()

    const tagFilter = screen.getByPlaceholderText(/filter by tags/i)

    // Click to open dropdown
    await user.click(tagFilter)

    // Type to filter options
    await user.type(tagFilter, 'quick')

    // Wait a bit for dropdown to update
    await new Promise(resolve => setTimeout(resolve, 100))

    // Press down arrow and then enter to select
    await user.keyboard('{ArrowDown}{Enter}')

    // Wait for filtering to complete - check that "Chicken Curry" disappears
    await waitFor(
      () => {
        expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Verify the other two are still there
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()
  })

  it('should display ingredient filter', () => {
    render(<RecipeSidebar />)

    expect(
      screen.getByPlaceholderText(/filter by ingredients/i)
    ).toBeInTheDocument()
  })

  it('should display time range filter', () => {
    render(<RecipeSidebar />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('< 30 min')).toBeInTheDocument()
    expect(screen.getByText('30-60 min')).toBeInTheDocument()
    expect(screen.getByText('> 60 min')).toBeInTheDocument()
  })

  it('should filter recipes by time range', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    const under30Button = screen.getByText('< 30 min')
    await user.click(under30Button)

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()
    expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument()
  })

  it('should show filtered recipe count', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    const searchInput = screen.getByPlaceholderText(/search recipes/i)
    await user.type(searchInput, 'chicken')

    expect(screen.getByText(/1 recipe/i)).toBeInTheDocument()
  })

  it('should show clear filters button when filters are active', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    const searchInput = screen.getByPlaceholderText(/search recipes/i)
    await user.type(searchInput, 'chicken')

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('should clear all filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    // Add a filter
    const searchInput = screen.getByPlaceholderText(/search recipes/i)
    await user.type(searchInput, 'chicken')

    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument()

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    // All recipes should be visible again
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()
  })

  it('should show empty state when no recipes match filters', async () => {
    const user = userEvent.setup()
    render(<RecipeSidebar />)

    const searchInput = screen.getByPlaceholderText(/search recipes/i)
    await user.type(searchInput, 'nonexistent recipe')

    expect(screen.getByText(/no recipes found/i)).toBeInTheDocument()
  })

  it('should display recipe details: name, tags, and time', () => {
    render(<RecipeSidebar />)

    // Check for recipe name
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()

    // Check for tags - use getAllByText since tags appear in multiple places
    const italianTags = screen.getAllByText('italian')
    expect(italianTags.length).toBeGreaterThan(0)

    const pastaTags = screen.getAllByText('pasta')
    expect(pastaTags.length).toBeGreaterThan(0)

    const quickTags = screen.getAllByText('quick')
    expect(quickTags.length).toBeGreaterThan(0)

    // Check for time
    expect(screen.getByText('25 min')).toBeInTheDocument()
  })

  it('should render recipe cards as draggable', () => {
    render(<RecipeSidebar />)

    const recipeCards = screen.getAllByTestId(/recipe-card/i)
    expect(recipeCards.length).toBeGreaterThan(0)

    // Check that cards have draggable attributes
    recipeCards.forEach(card => {
      expect(card).toHaveAttribute('data-recipe-id')
    })
  })
})
