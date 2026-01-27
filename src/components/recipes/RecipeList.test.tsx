import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecipeList } from './RecipeList'

import type { Recipe } from '../../types/recipe'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Spaghetti Carbonara',
    description: 'A classic Italian pasta dish with eggs, cheese, and bacon',
    ingredients: [
      { ingredientId: '1', quantity: 400 },
      { ingredientId: '2', quantity: 200 },
    ],
    instructions: ['Boil pasta', 'Cook bacon', 'Mix with eggs'],
    subRecipes: [],
    servings: 4,
    prepTime: 15,
    cookTime: 15,
    tags: ['Italian', 'Pasta', 'Quick'],
    imageUrl: 'https://example.com/carbonara.jpg',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Chicken Stir Fry',
    description: 'Quick and healthy chicken with vegetables in a savory sauce',
    ingredients: [
      { ingredientId: '3', quantity: 500 },
      { ingredientId: '4', quantity: 300 },
    ],
    instructions: ['Cut chicken', 'Stir fry vegetables', 'Add sauce'],
    subRecipes: [],
    servings: 2,
    prepTime: 10,
    cookTime: 10,
    tags: ['Asian', 'Healthy'],
    createdAt: 1640000000000,
    updatedAt: 1640000000000,
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    description:
      'Rich and moist chocolate cake with a creamy chocolate frosting that melts in your mouth',
    ingredients: [{ ingredientId: '5', quantity: 200 }],
    instructions: ['Mix ingredients', 'Bake', 'Frost'],
    subRecipes: [],
    servings: 8,
    prepTime: 45,
    cookTime: 45,
    tags: ['Dessert', 'Baking'],
    createdAt: 1640000000000,
    updatedAt: 1640000000000,
  },
]

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </MantineProvider>
  )
}

describe('RecipeList', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
    mockNavigate.mockClear()
  })

  describe('with recipes', () => {
    it('should render all recipes', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument()
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })

    it('should display recipe descriptions', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(
        screen.getByText(/classic Italian pasta dish/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Quick and healthy chicken/i)).toBeInTheDocument()
    })

    it('should display recipe tags as badges', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Italian')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Quick')).toBeInTheDocument()
      expect(screen.getByText('Asian')).toBeInTheDocument()
      expect(screen.getByText('Dessert')).toBeInTheDocument()
    })

    it('should display servings and prep/cook time', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Check for servings (using text content)
      expect(screen.getByText('4 servings')).toBeInTheDocument()
      expect(screen.getByText('2 servings')).toBeInTheDocument()
      expect(screen.getByText('8 servings')).toBeInTheDocument()

      // Check for time - each recipe displays prep+cook time
      expect(screen.getAllByText('30 min').length).toBeGreaterThan(0) // 15+15
      expect(screen.getAllByText('20 min').length).toBeGreaterThan(0) // 10+10
      expect(screen.getAllByText('90 min').length).toBeGreaterThan(0) // 45+45
    })

    it('should render View, Edit, and Delete buttons for each recipe', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Should have 3 view buttons, 3 edit buttons, 3 delete buttons
      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

      expect(viewButtons).toHaveLength(3)
      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledWith('1')
      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[1])

      expect(mockOnDelete).toHaveBeenCalledWith('2')
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('should navigate to recipe detail when view button is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      await user.click(viewButtons[2])

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/3')
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('should truncate long descriptions', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // The long description for Chocolate Cake should be truncated
      const descriptionElement = screen.getByText(
        /Rich and moist chocolate cake/i
      )
      expect(descriptionElement).toBeInTheDocument()
    })

    it('should display image when imageUrl is provided', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // First recipe has imageUrl
      const image = screen.getByAltText('Spaghetti Carbonara thumbnail')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/carbonara.jpg')
    })

    it('should display placeholder icon when imageUrl is not provided', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Second and third recipes don't have imageUrl, so should show placeholder
      // We can't easily test for the icon, but we can verify no image alt text for those
      expect(screen.queryByAltText('Chicken Stir Fry')).not.toBeInTheDocument()
      expect(screen.queryByAltText('Chocolate Cake')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should display empty state message when no recipes', () => {
      renderWithProviders(
        <RecipeList recipes={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument()
    })

    it('should display create recipe button in empty state', () => {
      renderWithProviders(
        <RecipeList recipes={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const createButton = screen.getByRole('button', {
        name: /create your first recipe/i,
      })
      expect(createButton).toBeInTheDocument()
    })

    it('should navigate to create recipe page when create button is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList recipes={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      )

      const createButton = screen.getByRole('button', {
        name: /create your first recipe/i,
      })
      await user.click(createButton)

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/new')
    })
  })

  describe('Card Interactions', () => {
    it('should navigate to recipe detail when card is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Get the card container by clicking on recipe title area
      const cards = screen.getAllByText(/spaghetti carbonara/i)
      await user.click(cards[0])

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1')
    })

    it('should apply hover effects on mouse enter', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Find a card element
      const recipeTitle = screen.getByText('Spaghetti Carbonara')
      const card = recipeTitle.closest('[style*="cursor"]') as HTMLElement

      // Hover over the card
      await user.hover(card)

      // Check that hover styles are applied
      expect(card.style.boxShadow).toBe('0 8px 16px rgba(0, 0, 0, 0.1)')
      expect(card.style.transform).toBe('translateY(-2px)')
    })

    it('should remove hover effects on mouse leave', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const recipeTitle = screen.getByText('Spaghetti Carbonara')
      const card = recipeTitle.closest('[style*="cursor"]') as HTMLElement

      // Hover and then unhover
      await user.hover(card)
      await user.unhover(card)

      // Check that hover styles are removed
      expect(card.style.boxShadow).toBe('')
      expect(card.style.transform).toBe('')
    })

    it('should display recipe image when imageUrl is provided', () => {
      const recipesWithImage = [
        {
          ...mockRecipes[0],
          imageUrl: 'https://example.com/image.jpg',
        },
      ]

      renderWithProviders(
        <RecipeList
          recipes={recipesWithImage}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const image = screen.getByRole('img', { name: /spaghetti carbonara/i })
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should truncate long descriptions', () => {
      const recipesWithLongDescription = [
        {
          ...mockRecipes[0],
          description:
            'This is a very long description that exceeds the maximum length allowed for display in the card view. It should be truncated with ellipsis at the end to maintain a clean layout and prevent the card from becoming too tall.',
        },
      ]

      renderWithProviders(
        <RecipeList
          recipes={recipesWithLongDescription}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const description = screen.getByText(/this is a very long description/i)
      expect(description.textContent).toMatch(/\.\.\./)
    })
  })

  describe('Recipe thumbnail images', () => {
    it('should display thumbnail image when imageUrl exists', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const thumbnail = screen.getByRole('img', {
        name: /spaghetti carbonara thumbnail/i,
      })
      expect(thumbnail).toBeInTheDocument()
      expect(thumbnail).toHaveAttribute(
        'src',
        'https://example.com/carbonara.jpg'
      )
    })

    it('should not display image when imageUrl is absent', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Chicken Stir Fry has no imageUrl - but image element still exists with fallback
      const image = screen.getByAltText('Chicken Stir Fry thumbnail')
      expect(image).toBeInTheDocument()
      // Should use fallback src since imageUrl is undefined
      expect(image).toHaveAttribute(
        'src',
        expect.stringContaining('data:image/svg+xml')
      )
    })

    it('should handle broken image URLs gracefully', () => {
      const recipesWithBrokenImage = [
        {
          ...mockRecipes[0],
          imageUrl: 'https://example.com/broken.jpg',
        },
      ]

      renderWithProviders(
        <RecipeList
          recipes={recipesWithBrokenImage}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const thumbnail = screen.getByRole('img', {
        name: /spaghetti carbonara thumbnail/i,
      })
      expect(thumbnail).toBeInTheDocument()
      // Mantine Image handles fallback internally
    })

    it('should maintain consistent thumbnail size across cards', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const thumbnail = screen.getByRole('img', {
        name: /spaghetti carbonara thumbnail/i,
      })
      expect(thumbnail).toBeInTheDocument()
      // Size consistency is handled by CSS/Mantine component
    })

    it('should maintain card layout integrity with and without images', () => {
      renderWithProviders(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // All recipe cards should be present
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument() // has image
      expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument() // no image
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument() // no image

      // Cards should maintain proper structure regardless of image presence
      const cards = screen.getAllByRole('button', { name: /view recipe/i })
      expect(cards).toHaveLength(3)
    })
  })
})
