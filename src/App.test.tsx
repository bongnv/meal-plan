import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import App from './App'
import * as RecipeContext from './contexts/RecipeContext'

// Mock the recipe pages
vi.mock('./pages/recipes/CreateRecipePage', () => ({
  CreateRecipePage: () => <div>Create Recipe Page</div>,
}))

vi.mock('./pages/recipes/EditRecipePage', () => ({
  EditRecipePage: () => <div>Edit Recipe Page</div>,
}))

const mockRecipeContext = {
  recipes: [],
  loading: false,
  error: null,
  getRecipeById: vi.fn(),
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
}

const renderApp = (initialRoute: string = '/') => {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </MantineProvider>
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
  })

  it('should render home page at root route', () => {
    renderApp('/')

    // Check for navigation header
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    // Check for home page content
    expect(screen.getByText(/home page - coming soon/i)).toBeInTheDocument()
  })

  it('should render create recipe page at /recipes/new', () => {
    renderApp('/recipes/new')

    expect(screen.getByText(/create recipe page/i)).toBeInTheDocument()
  })

  it('should render edit recipe page at /recipes/:id/edit', () => {
    renderApp('/recipes/123/edit')

    expect(screen.getByText(/edit recipe page/i)).toBeInTheDocument()
  })
})
