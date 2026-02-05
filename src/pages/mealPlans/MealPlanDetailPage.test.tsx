import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '@/db/database'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'

import { MealPlanDetailPage } from './MealPlanDetailPage'

import type { MealPlan } from '@/types/mealPlan'
import type { Recipe } from '@/types/recipe'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'mp1' }),
    useNavigate: () => vi.fn(),
  }
})

describe('MealPlanDetailPage', () => {
  const mockRecipe: Recipe = {
    id: 'recipe1',
    name: 'Test Recipe',
    description: 'Test description',
    sections: [
      {
        name: undefined,
        ingredients: [],
        instructions: ['Step 1'],
      },
    ],
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const mockMealPlan: MealPlan = {
    id: 'mp1',
    type: 'recipe',
    date: '2026-01-28',
    mealType: 'dinner',
    recipeId: 'recipe1',
    servings: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await db.recipes.clear()
    await db.mealPlans.clear()
    await db.recipes.add(mockRecipe)
    await db.mealPlans.add(mockMealPlan)
  })

  it('should render meal plan detail page', async () => {
    renderWithProviders(<MealPlanDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/test recipe/i)).toBeInTheDocument()
    })
  })
})
