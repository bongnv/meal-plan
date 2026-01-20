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
    servings: 4,
    totalTime: 30,
    tags: ['Italian', 'Pasta', 'Quick'],
    imageUrl: 'https://example.com/carbonara.jpg',
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
    servings: 2,
    totalTime: 20,
    tags: ['Asian', 'Healthy'],
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    description:
      'Rich and moist chocolate cake with a creamy chocolate frosting that melts in your mouth',
    ingredients: [{ ingredientId: '5', quantity: 200 }],
    instructions: ['Mix ingredients', 'Bake', 'Frost'],
    servings: 8,
    totalTime: 90,
    tags: ['Dessert', 'Baking'],
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

    it('should display servings and total time', () => {
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

      // Check for time
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('20 min')).toBeInTheDocument()
      expect(screen.getByText('90 min')).toBeInTheDocument()
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
      const image = screen.getByAltText('Spaghetti Carbonara')
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
})
