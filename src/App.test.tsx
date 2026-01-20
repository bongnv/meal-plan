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

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
  })

  it('should render home page at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/meal plan/i)).toBeInTheDocument()
    expect(screen.getByText(/home page - coming soon/i)).toBeInTheDocument()
  })

  it('should render create recipe page at /recipes/new', () => {
    render(
      <MemoryRouter initialEntries={['/recipes/new']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/create recipe page/i)).toBeInTheDocument()
  })

  it('should render edit recipe page at /recipes/:id/edit', () => {
    render(
      <MemoryRouter initialEntries={['/recipes/123/edit']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/edit recipe page/i)).toBeInTheDocument()
  })
})
