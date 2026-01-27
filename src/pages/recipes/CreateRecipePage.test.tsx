import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as IngredientContext from '../../contexts/IngredientContext'
import * as RecipeContext from '../../contexts/RecipeContext'

import { CreateRecipePage } from './CreateRecipePage'

const mockRecipeContext = {
  recipes: [],
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
  ingredients: [
    {
      id: '1',
      name: 'Tomato',
      category: 'Vegetables' as const,
    },
  ],
  loading: false,
  error: null,
  getIngredientById: vi.fn(),
  addIngredient: vi.fn(),
  addIngredients: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </MantineProvider>
  )
}

describe('CreateRecipePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(
      mockIngredientContext
    )
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(
      mockIngredientContext
    )
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(
      mockIngredientContext
    )
  })

  it('should render create recipe page with form', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(
      screen.getByRole('heading', { name: /create new recipe/i })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/enter recipe name/i)
    ).toBeInTheDocument()
  })

  it('should render cancel button', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should render create button', () => {
    renderWithProviders(<CreateRecipePage />)

    expect(
      screen.getByRole('button', { name: /create recipe/i })
    ).toBeInTheDocument()
  })
})
