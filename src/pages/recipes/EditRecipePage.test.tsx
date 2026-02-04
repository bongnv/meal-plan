import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '../../db/database'
import { renderWithProviders, screen, waitFor } from '../../test/test-utils'

import { EditRecipePage } from './EditRecipePage'

import type { Recipe } from '../../types/recipe'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'recipe1' }),
    useNavigate: () => vi.fn(),
  }
})

describe('EditRecipePage', () => {
  const mockRecipe: Recipe = {
    id: 'recipe1',
    name: 'Test Recipe',
    description: 'Test description',
    sections: [
      {
        name: undefined,
        ingredients: [{ ingredientId: 'ing1', quantity: 100, unit: 'gram' }],
        instructions: ['Step 1'],
      },
    ],
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    tags: ['test'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await db.recipes.clear()
    await db.ingredients.clear()
    await db.recipes.add(mockRecipe)
    await db.ingredients.add({
      id: 'ing1',
      name: 'Tomato',
      category: 'Vegetables',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })

  it('should render edit recipe page', async () => {
    renderWithProviders(<EditRecipePage />)

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    })
  })

  it('should load recipe data into form', async () => {
    renderWithProviders(<EditRecipePage />)

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test Recipe')
      expect(nameInput).toBeInTheDocument()
    })
  })
})
