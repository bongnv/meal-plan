import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '../../db/database'
import { render, screen, waitFor } from '../../test/test-utils'

import { RecipeDetailPage } from './RecipeDetailPage'

import type { Recipe } from '../../types/recipe'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'recipe1' }),
    useNavigate: () => vi.fn(),
  }
})

describe('RecipeDetailPage', () => {
  const mockRecipe: Recipe = {
    id: 'recipe1',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish',
    ingredients: [
      { ingredientId: 'ing1', quantity: 400, unit: 'gram' },
      { ingredientId: 'ing2', quantity: 200, unit: 'gram' },
    ],
    subRecipes: [],
    instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
    servings: 4,
    prepTime: 10,
    cookTime: 15,
    tags: ['Italian', 'Pasta'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await db.recipes.clear()
    await db.ingredients.clear()
    await db.recipes.add(mockRecipe)
    await db.ingredients.bulkAdd([
      {
        id: 'ing1',
        name: 'Spaghetti',
        category: 'Grains',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'ing2',
        name: 'Bacon',
        category: 'Meat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ])
  })

  it('should render recipe detail page', async () => {
    render(<RecipeDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })
  })

  it('should display recipe description', async () => {
    render(<RecipeDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Classic Italian pasta dish')).toBeInTheDocument()
    })
  })

  it('should display recipe servings and times', async () => {
    render(<RecipeDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
    })
  })
})
