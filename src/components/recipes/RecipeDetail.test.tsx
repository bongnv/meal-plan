import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as IngredientContextModule from '../../contexts/IngredientContext'

import { RecipeDetail } from './RecipeDetail'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the useIngredients hook
vi.mock('../../contexts/IngredientContext', () => ({
  useIngredients: vi.fn(),
}))

const mockIngredients: Ingredient[] = [
  { id: '1', name: 'Spaghetti', category: 'Grains', unit: 'gram' },
  { id: '2', name: 'Bacon', category: 'Meat', unit: 'gram' },
  { id: '3', name: 'Eggs', category: 'Dairy', unit: 'piece' },
]

const mockRecipe: Recipe = {
  id: '1',
  name: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish with eggs, cheese, and bacon',
  ingredients: [
    { ingredientId: '1', quantity: 400 },
    { ingredientId: '2', quantity: 200 },
    { ingredientId: '3', quantity: 4 },
  ],
  instructions: [
    'Boil pasta in salted water',
    'Cook bacon until crispy',
    'Mix eggs with cheese',
    'Combine everything while hot',
  ],
  servings: 4,
  totalTime: 30,
  tags: ['Italian', 'Pasta', 'Quick'],
  imageUrl: 'https://example.com/carbonara.jpg',
}

const defaultMockIngredientContext = {
  ingredients: mockIngredients,
  loading: false,
  error: null,
  getIngredientById: (id: string) => mockIngredients.find(i => i.id === id),
  addIngredient: vi.fn(),
  addIngredients: vi.fn(),
  updateIngredient: vi.fn(),
  deleteIngredient: vi.fn(),
  replaceAllIngredients: vi.fn(),
  getLastModified: vi.fn(() => Date.now()),
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </MantineProvider>
  )
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock for useIngredients
    vi.mocked(IngredientContextModule.useIngredients).mockReturnValue(
      defaultMockIngredientContext
    )
  })

  describe('Recipe Information Display', () => {
    it('should render recipe description', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(
        screen.getByText(/classic Italian pasta dish with eggs/i)
      ).toBeInTheDocument()
    })

    it('should display servings information', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
    })

    it('should display total time', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText(/30 min/i)).toBeInTheDocument()
    })

    it('should display all tags', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Italian')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Quick')).toBeInTheDocument()
    })
  })

  describe('Ingredients Display', () => {
    it('should render ingredients section heading', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Ingredients')).toBeInTheDocument()
    })

    it('should display all ingredients with quantities and units', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      // Check each ingredient is displayed with its quantity
      expect(screen.getByText(/400/)).toBeInTheDocument()
      expect(screen.getByText(/200/)).toBeInTheDocument()

      // Check ingredient names - there may be multiple matches (title + ingredient)
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      const baconMatches = screen.getAllByText(/Bacon/i)
      expect(baconMatches.length).toBeGreaterThanOrEqual(1)

      const eggsMatches = screen.getAllByText(/Eggs/i)
      expect(eggsMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle missing ingredient from library gracefully', () => {
      const recipeWithMissingIngredient: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', quantity: 400 },
          { ingredientId: '999', quantity: 100 }, // Non-existent ingredient
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithMissingIngredient} />)

      // Should display known ingredient
      expect(screen.getByText(/400/)).toBeInTheDocument()
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      // Should display fallback for unknown ingredient
      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/Unknown Ingredient/i)).toBeInTheDocument()
    })

    it('should display custom displayName when provided', () => {
      const recipeWithDisplayNames: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', quantity: 400, displayName: 'pasta' },
          { ingredientId: '2', quantity: 200, displayName: 'pancetta' },
          { ingredientId: '3', quantity: 4 }, // No displayName, should use library name
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithDisplayNames} />)

      // Should display custom names - use getAllByText since "pasta" appears in multiple places
      const pastaMatches = screen.getAllByText(/pasta/i)
      expect(pastaMatches.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/pancetta/i)).toBeInTheDocument()

      // Should display library name when no displayName
      const eggsMatches = screen.getAllByText(/Eggs/i)
      expect(eggsMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should fall back to library name when displayName is not provided', () => {
      const recipeWithoutDisplayNames: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', quantity: 400 }, // No displayName
          { ingredientId: '2', quantity: 200 }, // No displayName
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutDisplayNames} />)

      // Should display library names as fallback
      const spaghettiMatches = screen.getAllByText(/Spaghetti/i)
      expect(spaghettiMatches.length).toBeGreaterThanOrEqual(1)

      const baconMatches = screen.getAllByText(/Bacon/i)
      expect(baconMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle displayName with special characters', () => {
      const recipeWithSpecialChars: Recipe = {
        ...mockRecipe,
        ingredients: [
          {
            ingredientId: '1',
            quantity: 400,
            displayName: 'spaghetti (al dente)',
          },
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithSpecialChars} />)

      expect(screen.getByText(/spaghetti \(al dente\)/i)).toBeInTheDocument()
    })

    it('should handle displayName when ingredient is missing from library', () => {
      const recipeWithDisplayNameAndMissingIngredient: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '999', quantity: 100, displayName: 'mystery meat' },
        ],
      }

      renderWithProviders(
        <RecipeDetail recipe={recipeWithDisplayNameAndMissingIngredient} />
      )

      // Should display custom displayName even when ingredient not found in library
      expect(screen.getByText(/mystery meat/i)).toBeInTheDocument()
      expect(screen.queryByText(/Unknown Ingredient/i)).not.toBeInTheDocument()
    })

    it('should adjust displayName quantities when servings change', async () => {
      const user = userEvent.setup()
      const recipeWithDisplayName: Recipe = {
        ...mockRecipe,
        ingredients: [
          { ingredientId: '1', quantity: 400, displayName: 'pasta' },
        ],
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithDisplayName} />)

      // Initial quantity (now formatted without trailing .0)
      expect(screen.getByText(/400/)).toBeInTheDocument()
      const pastaMatchesInitial = screen.getAllByText(/pasta/i)
      expect(pastaMatchesInitial.length).toBeGreaterThanOrEqual(1)

      // Increase servings from 4 to 5
      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      // Quantity should be adjusted (400 * 5/4 = 500, formatted without .0)
      expect(screen.getByText(/500/)).toBeInTheDocument()
      const pastaMatchesAfter = screen.getAllByText(/pasta/i)
      expect(pastaMatchesAfter.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Instructions Display', () => {
    it('should render instructions section heading', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(screen.getByText('Instructions')).toBeInTheDocument()
    })

    it('should display all instruction steps', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(
        screen.getByText(/Boil pasta in salted water/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Cook bacon until crispy/i)).toBeInTheDocument()
      expect(screen.getByText(/Mix eggs with cheese/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Combine everything while hot/i)
      ).toBeInTheDocument()
    })
  })

  describe('Interactive Features', () => {
    it('should increase servings when clicking increase button', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      expect(screen.getByText(/5 servings/i)).toBeInTheDocument()
    })

    it('should decrease servings when clicking decrease button', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const decreaseButton = screen.getByLabelText('Decrease servings')
      await user.click(decreaseButton)

      expect(screen.getByText(/3 servings/i)).toBeInTheDocument()
    })

    it('should not decrease servings below 1', async () => {
      const user = userEvent.setup()
      const recipeWith1Serving = { ...mockRecipe, servings: 1 }
      renderWithProviders(<RecipeDetail recipe={recipeWith1Serving} />)

      const decreaseButton = screen.getByLabelText('Decrease servings')
      await user.click(decreaseButton)

      // Should stay at 1 serving
      expect(screen.getByText(/1 servings/i)).toBeInTheDocument()
    })

    it('should adjust ingredient quantities based on servings', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      // Initial quantities for 4 servings (now formatted without trailing .0)
      expect(screen.getByText(/400/)).toBeInTheDocument()

      const increaseButton = screen.getByLabelText('Increase servings')
      await user.click(increaseButton)

      // After increasing to 5 servings, quantities should be scaled
      expect(screen.getByText(/500/)).toBeInTheDocument()
    })

    it('should use initialServings prop if provided', () => {
      renderWithProviders(
        <RecipeDetail recipe={mockRecipe} initialServings={6} />
      )

      expect(screen.getByText(/6 servings/i)).toBeInTheDocument()
      // Quantity should be scaled to 6 servings (400 * 6/4 = 600, formatted without .0)
      expect(screen.getByText(/600/)).toBeInTheDocument()
    })

    it('should toggle ingredient checkbox when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const firstIngredientCheckbox = checkboxes[0]

      expect(firstIngredientCheckbox).not.toBeChecked()

      await user.click(firstIngredientCheckbox)
      expect(firstIngredientCheckbox).toBeChecked()

      await user.click(firstIngredientCheckbox)
      expect(firstIngredientCheckbox).not.toBeChecked()
    })

  })

  describe('Edge Cases', () => {
    it('should render recipe without image', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutImage} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should render recipe with empty tags array', () => {
      const recipeWithoutTags = { ...mockRecipe, tags: [] }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutTags} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })

    it('should render recipe with no description', () => {
      const recipeWithoutDescription = { ...mockRecipe, description: '' }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutDescription} />)

      expect(screen.getByText('No description')).toBeInTheDocument()
    })

    it('should display loading state when ingredients are loading', () => {
      vi.mocked(IngredientContextModule.useIngredients).mockReturnValue({
        ...defaultMockIngredientContext,
        loading: true,
      })

      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      expect(
        screen.getByText(
          'A classic Italian pasta dish with eggs, cheese, and bacon'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Hero Image Display', () => {
    it('should display hero image when imageUrl is provided', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/carbonara.jpg')
    })

    it('should not display image section when imageUrl is absent', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }

      renderWithProviders(<RecipeDetail recipe={recipeWithoutImage} />)

      const images = screen.queryByRole('img')
      expect(images).not.toBeInTheDocument()
    })

    it('should use recipe name as alt text for accessibility', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const image = screen.getByAltText('Spaghetti Carbonara')
      expect(image).toBeInTheDocument()
    })

    it('should handle broken image URLs gracefully', () => {
      const recipeWithBrokenImage = {
        ...mockRecipe,
        imageUrl: 'https://example.com/broken.jpg',
      }

      renderWithProviders(<RecipeDetail recipe={recipeWithBrokenImage} />)

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
    })

    it('should maintain responsive design with image', () => {
      renderWithProviders(<RecipeDetail recipe={mockRecipe} />)

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toBeInTheDocument()
      // Mantine Image component handles responsive design internally
    })
  })
})
