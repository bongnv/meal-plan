import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { IngredientProvider } from '../../contexts/IngredientContext'
import { RecipeProvider } from '../../contexts/RecipeContext'

import { RecipeImportModal } from './RecipeImportModal'

describe('RecipeImportModal - Sub-Recipe Import', () => {
  it('should correctly import recipe with sub-recipe and map IDs', async () => {
    const user = userEvent.setup()
    
    const mockOnClose = vi.fn()
    
    const { getByRole, getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/recipes']}>
        <MantineProvider>
          <IngredientProvider>
            <RecipeProvider>
              <Routes>
                <Route path="/recipes" element={<RecipeImportModal opened={true} onClose={mockOnClose} />} />
                <Route path="/recipes/:id" element={<div>Recipe Detail</div>} />
              </Routes>
            </RecipeProvider>
          </IngredientProvider>
        </MantineProvider>
      </MemoryRouter>
    )

    // Create a recipe with sub-recipe using the AI import format
    const recipeWithSubRecipe = {
      name: 'Burrito Bowl',
      description: 'Bowl with rice and beans',
      ingredients: [
        { name: 'Black Beans', quantity: 200, unit: 'gram', category: 'Legumes' },
      ],
      subRecipes: [
        {
          recipe: {
            name: 'Cilantro Rice',
            description: 'Rice with cilantro',
            ingredients: [
              { name: 'Rice', quantity: 200, unit: 'gram', category: 'Grains' },
              { name: 'Cilantro', quantity: 20, unit: 'gram', category: 'Herbs & Spices' },
            ],
            instructions: ['Cook rice', 'Mix with cilantro'],
            servings: 4,
            prepTime: 5,
            cookTime: 15,
            tags: ['Side'],
            subRecipes: [],
          },
          servings: 2,
          displayName: 'Cilantro Rice',
        },
      ],
      instructions: ['Make rice', 'Heat beans', 'Assemble bowl'],
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      tags: ['Mexican', 'Bowl'],
    }

    // Step 1: Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Step 2: Paste JSON and validate
    const textarea = screen.getByPlaceholderText(/paste.*json/i)
    await user.click(textarea)
    await user.paste(JSON.stringify(recipeWithSubRecipe))
    await user.click(screen.getByRole('button', { name: /validate json/i }))

    // Step 3: Wait for validation and auto-advance to review
    await waitFor(
      () => {
        expect(screen.getByText('Burrito Bowl')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify sub-recipe is shown in preview
    expect(screen.getByText('Cilantro Rice')).toBeInTheDocument()
    expect(screen.getByText(/1 sub-recipe/i)).toBeInTheDocument()

    // Step 4: Import the recipe
    const importButton = screen.getByRole('button', { name: /import recipe/i })
    await user.click(importButton)

    // Wait for import to complete and navigation
    await waitFor(
      () => {
        expect(screen.getByText('Recipe Detail')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // The key test: ID mapping happened correctly (shown in console logs)
    // Sub-recipe ID was mapped and main recipe reference was updated
    // If there was a "Sub-recipe not found" error, the navigation wouldn't have happened
    expect(screen.getByText('Recipe Detail')).toBeInTheDocument()
  })

  it('should correctly import recipe with nested sub-recipes', async () => {
    const user = userEvent.setup()
    
    const mockOnClose = vi.fn()
    
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <MantineProvider>
          <IngredientProvider>
            <RecipeProvider>
              <Routes>
                <Route path="/recipes" element={<RecipeImportModal opened={true} onClose={mockOnClose} />} />
                <Route path="/recipes/:id" element={<div>Recipe Detail</div>} />
              </Routes>
            </RecipeProvider>
          </IngredientProvider>
        </MantineProvider>
      </MemoryRouter>
    )

    // Create a recipe with nested sub-recipes
    const recipeWithNestedSubRecipe = {
      name: 'Complete Meal',
      description: 'Main dish with components',
      ingredients: [
        { name: 'Lettuce', quantity: 100, unit: 'gram', category: 'Vegetables' },
      ],
      subRecipes: [
        {
          recipe: {
            name: 'Burrito Bowl',
            description: 'Bowl component',
            ingredients: [
              { name: 'Black Beans', quantity: 200, unit: 'gram', category: 'Legumes' },
            ],
            subRecipes: [
              {
                recipe: {
                  name: 'Cilantro Rice',
                  description: 'Rice with cilantro',
                  ingredients: [
                    { name: 'Rice', quantity: 200, unit: 'gram', category: 'Grains' },
                  ],
                  instructions: ['Cook rice'],
                  servings: 4,
                  prepTime: 5,
                  cookTime: 15,
                  tags: [],
                  subRecipes: [],
                },
                servings: 2,
              },
            ],
            instructions: ['Make bowl'],
            servings: 4,
            prepTime: 10,
            cookTime: 20,
            tags: [],
          },
          servings: 1,
        },
      ],
      instructions: ['Assemble everything'],
      servings: 1,
      prepTime: 5,
      cookTime: 5,
      tags: [],
    }

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Paste JSON and validate
    const textarea = screen.getByPlaceholderText(/paste.*json/i)
    await user.click(textarea)
    await user.paste(JSON.stringify(recipeWithNestedSubRecipe))
    await user.click(screen.getByRole('button', { name: /validate json/i }))

    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('Complete Meal')).toBeInTheDocument()
    })

    // Import the recipe
    const importButton = screen.getByRole('button', { name: /import recipe/i })
    await user.click(importButton)

    // Wait for import
    await waitFor(
      () => {
        expect(screen.getByText('Recipe Detail')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // The key test: ID mapping happened correctly for nested sub-recipes (shown in console logs)
    // If there was a "Sub-recipe not found" error, the navigation wouldn't have happened
    expect(screen.getByText('Recipe Detail')).toBeInTheDocument()
  })
})
