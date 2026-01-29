import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

// Mock recipeService
vi.mock('../../services/recipeService', () => ({
  recipeService: {
    delete: vi.fn(),
    extractUniqueTags: vi.fn((recipes: any[]) => {
      const tagSet = new Set<string>()
      recipes.forEach((recipe: any) => {
        recipe.tags.forEach((tag: string) => tagSet.add(tag))
      })
      return Array.from(tagSet).sort()
    }),
    filterRecipesAdvanced: vi.fn((recipes: any[], filters: any) => {
      // Implementation for testing - mirrors the actual service logic
      return recipes.filter((recipe: any) => {
        // Filter by search text (name)
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase()
          if (!recipe.name.toLowerCase().includes(searchLower)) {
            return false
          }
        }

        // Filter by tags (OR logic)
        if (filters.selectedTags && filters.selectedTags.length > 0) {
          const hasMatchingTag = filters.selectedTags.some((tag: string) =>
            recipe.tags.includes(tag)
          )
          if (!hasMatchingTag) {
            return false
          }
        }

        // Filter by ingredients (OR logic)
        if (
          filters.selectedIngredients &&
          filters.selectedIngredients.length > 0
        ) {
          const hasMatchingIngredient = filters.selectedIngredients.some(
            (ingredientId: string) =>
              recipe.ingredients.some(
                (ing: any) => ing.ingredientId === ingredientId
              )
          )
          if (!hasMatchingIngredient) {
            return false
          }
        }

        // Filter by time range
        if (filters.timeRange) {
          const totalTime = recipe.prepTime + recipe.cookTime
          switch (filters.timeRange) {
            case 'under-30':
              if (totalTime >= 30) return false
              break
            case '30-60':
              if (totalTime < 30 || totalTime > 60) return false
              break
            case 'over-60':
              if (totalTime <= 60) return false
              break
          }
        }

        return true
      })
    }),
  },
}))

// Mock modals
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn(),
  },
}))

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
      sections: [
        {
          name: undefined,
          ingredients: [
            { ingredientId: 'ing1', quantity: 400, unit: 'gram' },
            { ingredientId: 'ing2', quantity: 200, unit: 'gram' },
          ],
          instructions: ['Boil pasta', 'Mix eggs', 'Combine'],
        },
      ],
      servings: 4,
      prepTime: 13,
      cookTime: 12,
      tags: ['italian', 'pasta', 'quick'],
      createdAt: 1640000000000,
      updatedAt: 1640000000000,
    },
    {
      id: '2',
      name: 'Chicken Curry',
      description: 'Spicy Indian curry',
      sections: [
        {
          name: undefined,
          ingredients: [
            { ingredientId: 'ing3', quantity: 500, unit: 'gram' },
            { ingredientId: 'ing4', quantity: 200, unit: 'gram' },
          ],
          instructions: ['Cook chicken', 'Add spices', 'Simmer'],
        },
      ],
      servings: 6,
      prepTime: 23,
      cookTime: 22,
      tags: ['indian', 'spicy'],
      createdAt: 1640000000000,
      updatedAt: 1640000000000,
    },
    {
      id: '3',
      name: 'Quick Salad',
      description: 'Fresh vegetable salad',
      sections: [
        {
          name: undefined,
          ingredients: [{ ingredientId: 'ing5', quantity: 300, unit: 'gram' }],
          instructions: ['Chop vegetables', 'Mix', 'Serve'],
        },
      ],
      servings: 2,
      prepTime: 5,
      cookTime: 5,
      tags: ['vegetarian', 'quick'],
      createdAt: 1640000000000,
      updatedAt: 1640000000000,
    },
  ]

  const mockIngredients = [
    {
      id: 'ing1',
      name: 'Pasta',
      category: 'Grains' as const,
    },
    {
      id: 'ing2',
      name: 'Eggs',
      category: 'Dairy' as const,
    },
    {
      id: 'ing3',
      name: 'Chicken',
      category: 'Poultry' as const,
    },
    {
      id: 'ing4',
      name: 'Curry Powder',
      category: 'Herbs & Spices' as const,
    },
    {
      id: 'ing5',
      name: 'Lettuce',
      category: 'Vegetables' as const,
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useLiveQuery } = await import('dexie-react-hooks')
    vi.mocked(useLiveQuery).mockImplementation((queryFn: any) => {
      const query = queryFn.toString()
      // Return recipes for recipe queries
      if (query.includes('recipes') || query.includes('getActiveRecipes')) {
        return mockRecipes
      }
      // Return ingredients for ingredient queries
      if (query.includes('ingredients')) {
        return mockIngredients
      }
      return []
    })
  })

  it('should render with filter controls', async () => {
    renderWithProviders(<RecipesPage />)

    // Check page title and create button
    expect(screen.getByText('My Recipes')).toBeInTheDocument()
    expect(screen.getByText('Create Recipe')).toBeInTheDocument()

    // Check search box is always visible
    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument()

    // Check filter controls are visible (no longer behind a toggle)
    await waitFor(() => {
      expect(screen.getByText('Tags')).toBeInTheDocument()
      expect(screen.getByText('Ingredients')).toBeInTheDocument()
      expect(screen.getByText('Total Time')).toBeInTheDocument()
    })
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

    // Clear button should be visible when filters are active
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeInTheDocument()
    })

    // Click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear filters/i })
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

  it('should navigate to edit page when edit action is triggered', async () => {
    const user = userEvent.setup()

    renderWithProviders(<RecipesPage />)

    // Find and click edit button (first one)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/recipes/1/edit')
  })

  it('should show time filter options', async () => {
    renderWithProviders(<RecipesPage />)

    // Filters are always visible, check time filter options
    await waitFor(() => {
      expect(screen.getByText('Total Time')).toBeInTheDocument()
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Under 30 min')).toBeInTheDocument()
      expect(screen.getByText('30-60 min')).toBeInTheDocument()
      expect(screen.getByText('Over 60 min')).toBeInTheDocument()
    })
  })

  it('should filter by time range when selected', async () => {
    renderWithProviders(<RecipesPage />)

    // Wait for filters to be visible
    await waitFor(() => {
      expect(screen.getByText('Total Time')).toBeInTheDocument()
    })

    // Click the "Under 30 min" option
    const quickOption = screen.getByText('Under 30 min')
    fireEvent.click(quickOption)

    await waitFor(() => {
      // Should show Spaghetti (25 min) and Quick Salad (10 min)
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('Quick Salad')).toBeInTheDocument()
      // Should NOT show Chicken Curry (45 min)
      expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument()
    })
  })

  it('should show all recipes when "All" time filter is selected', async () => {
    renderWithProviders(<RecipesPage />)

    // Wait for filters to be visible
    await waitFor(() => {
      expect(screen.getByText('Total Time')).toBeInTheDocument()
    })

    // First select a filter
    fireEvent.click(screen.getByText('Under 30 min'))

    // Then select "All"
    fireEvent.click(screen.getByText('All'))

    await waitFor(() => {
      // All recipes should be visible
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
      expect(screen.getByText('Quick Salad')).toBeInTheDocument()
    })
  })

  describe('AI Recipe Import', () => {
    it('should render Import with AI button', () => {
      renderWithProviders(<RecipesPage />)

      expect(screen.getByText('Import with AI')).toBeInTheDocument()
    })

    it('should open import modal when Import with AI button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipesPage />)

      const importButton = screen.getByText('Import with AI')
      await user.click(importButton)

      // Modal should be visible with stepper
      await waitFor(() => {
        expect(screen.getByText('Generate Prompt')).toBeInTheDocument()
        expect(screen.getByText('Paste Response')).toBeInTheDocument()
        expect(screen.getByText('Review & Import')).toBeInTheDocument()
      })
    })

    it('should close import modal when close is triggered', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipesPage />)

      // Open modal
      const importButton = screen.getByText('Import with AI')
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText('Generate Prompt')).toBeInTheDocument()
      })

      // Close modal - Mantine modal close button doesn't have aria-label by default
      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Generate Prompt')).not.toBeInTheDocument()
      })
    })
  })
})
