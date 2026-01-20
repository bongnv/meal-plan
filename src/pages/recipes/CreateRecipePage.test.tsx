import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateRecipePage } from './CreateRecipePage'
import * as RecipeContext from '../../contexts/RecipeContext'

const mockRecipeContext = {
  recipes: [],
  loading: false,
  error: null,
  getRecipeById: vi.fn(),
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
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
