import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EditRecipePage } from './EditRecipePage'
import * as IngredientContext from '../../contexts/IngredientContext'
import * as RecipeContext from '../../contexts/RecipeContext'

import type { Recipe } from '../../types/recipe'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '123' }),
  }
})

const mockRecipe: Recipe = {
  id: '123',
  name: 'Existing Recipe',
  description: 'Existing Description',
  servings: 4,
  totalTime: 30,
  ingredients: [],
  instructions: [],
  tags: [],
}

const mockRecipeContext = {
  recipes: [mockRecipe],
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
      unit: 'piece' as const,
    },
  ],
  loading: false,
  error: null,
  getIngredientById: vi.fn(),
  addIngredient: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={component} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  )
}

describe('EditRecipePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue(mockRecipeContext)
    vi.spyOn(IngredientContext, 'useIngredients').mockReturnValue(
      mockIngredientContext
    )
    mockRecipeContext.getRecipeById.mockReturnValue(mockRecipe)
  })

  it('should render edit recipe page with form', () => {
    renderWithProviders(<EditRecipePage />)

    expect(
      screen.getByRole('heading', { name: /edit recipe/i })
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter recipe name/i)).toHaveValue(
      'Existing Recipe'
    )
  })

  it('should show loading state', () => {
    vi.spyOn(RecipeContext, 'useRecipes').mockReturnValue({
      ...mockRecipeContext,
      loading: true,
    })

    const { container } = renderWithProviders(<EditRecipePage />)

    // Mantine Loader is rendered in loading state
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('should show not found message when recipe does not exist', () => {
    mockRecipeContext.getRecipeById.mockReturnValue(null)

    renderWithProviders(<EditRecipePage />)

    expect(screen.getByText(/recipe not found/i)).toBeInTheDocument()
  })

  it('should render cancel button', () => {
    renderWithProviders(<EditRecipePage />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should render update button', () => {
    renderWithProviders(<EditRecipePage />)

    expect(
      screen.getByRole('button', { name: /update recipe/i })
    ).toBeInTheDocument()
  })
})
