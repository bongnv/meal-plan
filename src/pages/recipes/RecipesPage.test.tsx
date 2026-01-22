import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as IngredientContext from '../../contexts/IngredientContext'
import * as RecipeContext from '../../contexts/RecipeContext'

import { RecipesPage } from './RecipesPage'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </MantineProvider>
  )
}

describe('RecipesPage', () => {
  const mockRecipes = [
    {
      id: '1',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta',
      ingredients: [
        { ingredientId: 'ing1', quantity: 400 },
        { ingredientId: 'ing2', quantity: 200 },
      ],
      instructions: ['Boil pasta', 'Mix eggs', 'Combine'],
      servings: 4,
      totalTime: 25,
      tags: ['italian', 'pasta', 'quick'],
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
    },
    {
      id: '3',
      name: 'Quick Salad',
      description: 'Fresh vegetable salad',
      ingredients: [{ ingredientId: 'ing5', quantity: 300 }],
      instructions: ['Chop vegetables', 'Mix', 'Serve'],
      servings: 2,
      totalTime: 10,
      tags: ['vegetarian', 'quick'],
    },
  ]

  const mockIngredients = [
    {
      id: 'ing1',
      name: 'Pasta',
      unit: 'gram' as const,
      category: 'Grains' as const,
    },
    {
      id: 'ing2',
      name: 'Eggs',
      unit: 'piece' as const,
      category: 'Dairy' as const,
    },
    {
      id: 'ing3',
      name: 'Chicken',
      unit: 'gram' as const,
      category: 'Poultry' as const,
    },
    {
      id: 'ing4',
      name: 'Curry Powder',
      unit: 'gram' as const,
      category: 'Herbs & Spices' as const,
    },
    {
      id: 'ing5',
      name: 'Lettuce',
      unit: 'gram' as const,
      category: 'Vegetables' as const,
    },
  ]

  const mockRecipeContext = {
    recipes: mockRecipes,
    loading: false,
    error: null,
    getRecipeById: vi.fn(),
    addRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    replaceAllRecipes: vi.fn(),
    getLastModified: vi.fn(() => Date.now()),
  }

  const mockIngredientContext = {
    ingredients: mockIngredients,
    loading: false,
    error: null,
    getIngredientById: vi.fn(),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    deleteIngredient: vi.fn(),
    replaceAllIngredients: vi.fn(),
    getLastModified: vi.fn(() => Date.now()),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(
      mockIngredientContext
    )
  })

  it('should render with filter controls', () => {
    renderWithProviders(<RecipesPage />)

    // Check page title and create button
    expect(screen.getByText('My Recipes')).toBeInTheDocument()
    expect(screen.getByText('Create Recipe')).toBeInTheDocument()

    // Check filter controls exist
    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Filter by tags...')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Filter by ingredients...')
    ).toBeInTheDocument()
    expect(screen.getByText('Time:')).toBeInTheDocument()

    // Check time filter options
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('< 30 min')).toBeInTheDocument()
    expect(screen.getByText('30-60 min')).toBeInTheDocument()
    expect(screen.getByText('> 60 min')).toBeInTheDocument()
  })

  it('should filter recipes by search text', async () => {
    renderWithProviders(<RecipesPage />)

    // Initially all recipes should be visible
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
    expect(screen.getByText('Quick Salad')).toBeInTheDocument()

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search recipes...')
    fireEvent.change(searchInput, { target: { value: 'chicken' } })

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
      expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument()
      expect(screen.queryByText('Quick Salad')).not.toBeInTheDocument()
    })

    // Should show filtered count
    expect(screen.getByText('1 recipe found')).toBeInTheDocument()
  })

  it('should clear all filters when clear button is clicked', async () => {
    renderWithProviders(<RecipesPage />)

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search recipes...')
    fireEvent.change(searchInput, { target: { value: 'curry' } })

    await waitFor(() => {
      expect(screen.getByText('1 recipe found')).toBeInTheDocument()
    })

    // Click clear filters button
    const clearButton = screen.getByText('Clear filters')
    fireEvent.click(clearButton)

    // All recipes should be visible again
    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
      expect(screen.getByText('Quick Salad')).toBeInTheDocument()
    })

    // Search input should be cleared
    expect(searchInput).toHaveValue('')

    // Filter count badge should not be visible
    expect(screen.queryByText(/recipe found/)).not.toBeInTheDocument()
  })

  it('should navigate to create recipe page when Create Recipe button is clicked', () => {
    renderWithProviders(<RecipesPage />)

    const createButton = screen.getByText('Create Recipe')
    fireEvent.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/recipes/new')
  })

  it('should show filtered count badge when filters are active', async () => {
    renderWithProviders(<RecipesPage />)

    // No filter badge initially
    expect(screen.queryByText(/recipe found/)).not.toBeInTheDocument()

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search recipes...')
    fireEvent.change(searchInput, { target: { value: 'a' } })

    // Should show filtered count (Carbonara and Salad both have 'a')
    expect(screen.getByText('2 recipes found')).toBeInTheDocument()

    // Clear filters
    fireEvent.change(searchInput, { target: { value: '' } })

    // Badge should disappear
    expect(screen.queryByText(/recipe found/)).not.toBeInTheDocument()
  })

  it('should show empty state when no recipes match filters', async () => {
    renderWithProviders(<RecipesPage />)

    // Search for non-existent recipe
    const searchInput = screen.getByPlaceholderText('Search recipes...')
    fireEvent.change(searchInput, { target: { value: 'pizza' } })

    await waitFor(() => {
      expect(
        screen.getByText('No recipes match your filters')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Try adjusting your search criteria')
      ).toBeInTheDocument()
    })

    // Should have a clear filters button in empty state
    const clearButton = screen.getByText('Clear All Filters')
    expect(clearButton).toBeInTheDocument()

    // Click it to clear
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(
        screen.queryByText('No recipes match your filters')
      ).not.toBeInTheDocument()
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })
  })
})
