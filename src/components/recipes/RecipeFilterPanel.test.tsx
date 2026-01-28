import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { RecipeFilterPanel } from './RecipeFilterPanel'

import type {
  RecipeFilterActions,
  RecipeFilterState,
} from '../../hooks/useRecipeFilters'
import type { Ingredient } from '../../types/ingredient'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

describe('RecipeFilterPanel', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: '1',
      name: 'Tomato',
      category: 'Vegetables',
      createdAt: 0,
      updatedAt: 0,
    },
    { id: '2', name: 'Pasta', category: 'Grains', createdAt: 0, updatedAt: 0 },
  ]

  const mockFilters: RecipeFilterState = {
    searchText: '',
    selectedTags: [],
    selectedIngredients: [],
    timeRange: null,
  }

  const mockActions: RecipeFilterActions = {
    setSearchText: vi.fn(),
    setSelectedTags: vi.fn(),
    setSelectedIngredients: vi.fn(),
    setTimeRange: vi.fn(),
    clearFilters: vi.fn(),
    hasActiveFilters: false,
  }

  it('should render search input', () => {
    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={mockActions}
        allTags={[]}
        allIngredients={mockIngredients}
      />
    )

    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument()
  })

  it('should render filter controls', () => {
    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={mockActions}
        allTags={['italian', 'quick']}
        allIngredients={mockIngredients}
      />
    )

    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('Total Time')).toBeInTheDocument()
  })

  it('should show results count when filters are active', () => {
    const activeActions = { ...mockActions, hasActiveFilters: true }

    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={activeActions}
        allTags={['italian']}
        allIngredients={mockIngredients}
        resultsCount={10}
      />
    )

    expect(screen.getByText('10 recipes found')).toBeInTheDocument()
  })

  it('should call setSearchText when typing in search box', async () => {
    const user = userEvent.setup()

    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={mockActions}
        allTags={[]}
        allIngredients={mockIngredients}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search recipes...')
    await user.type(searchInput, 'pasta')

    expect(mockActions.setSearchText).toHaveBeenCalled()
  })

  it('should clear search text when X button is clicked', async () => {
    const user = userEvent.setup()
    const activeFilters = { ...mockFilters, searchText: 'pasta' }

    renderWithProvider(
      <RecipeFilterPanel
        filters={activeFilters}
        actions={mockActions}
        allTags={[]}
        allIngredients={mockIngredients}
      />
    )

    // Find the clear button (X icon)
    const clearButtons = screen.getAllByRole('button')
    const clearSearchButton = clearButtons.find(btn => btn.querySelector('svg'))

    if (clearSearchButton) {
      await user.click(clearSearchButton)
      expect(mockActions.setSearchText).toHaveBeenCalledWith('')
    }
  })

  it('should always show filter controls', () => {
    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={mockActions}
        allTags={['italian', 'quick']}
        allIngredients={mockIngredients}
      />
    )

    // Filter controls should always be visible
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('Total Time')).toBeInTheDocument()
  })

  it('should show singular form for 1 result', () => {
    const activeActions = { ...mockActions, hasActiveFilters: true }

    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={activeActions}
        allTags={[]}
        allIngredients={mockIngredients}
        resultsCount={1}
      />
    )

    expect(screen.getByText('1 recipe found')).toBeInTheDocument()
  })

  it('should show clear filters button when filters are active', () => {
    const activeActions = { ...mockActions, hasActiveFilters: true }

    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={activeActions}
        allTags={[]}
        allIngredients={mockIngredients}
      />
    )

    expect(
      screen.getByRole('button', { name: /clear filters/i })
    ).toBeInTheDocument()
  })

  it('should call clearFilters when clear button is clicked', async () => {
    const user = userEvent.setup()
    const activeActions = { ...mockActions, hasActiveFilters: true }

    renderWithProvider(
      <RecipeFilterPanel
        filters={mockFilters}
        actions={activeActions}
        allTags={[]}
        allIngredients={mockIngredients}
      />
    )

    const clearButton = screen.getByRole('button', {
      name: /clear filters/i,
    })
    await user.click(clearButton)

    expect(mockActions.clearFilters).toHaveBeenCalled()
  })
})
