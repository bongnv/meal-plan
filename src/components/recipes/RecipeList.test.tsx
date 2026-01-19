import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RecipeList } from './RecipeList'
import { Recipe } from '../../types/recipe'

describe('RecipeList', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnView = vi.fn()

  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1',
      name: 'Spaghetti Carbonara',
      description:
        'A classic Italian pasta dish made with eggs, cheese, pancetta, and black pepper. Simple yet delicious comfort food.',
      ingredients: [
        { ingredientId: 'pasta', quantity: 400 },
        { ingredientId: 'eggs', quantity: 4 },
      ],
      instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
      servings: 4,
      totalTime: 30,
      tags: ['italian', 'dinner', 'quick'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'recipe-2',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan and croutons',
      ingredients: [{ ingredientId: 'lettuce', quantity: 1 }],
      instructions: ['Chop lettuce', 'Add dressing'],
      servings: 2,
      totalTime: 15,
      tags: ['salad', 'healthy'],
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'recipe-3',
      name: 'Chocolate Cake',
      description: 'Rich and moist chocolate cake',
      ingredients: [{ ingredientId: 'flour', quantity: 2 }],
      instructions: ['Mix ingredients', 'Bake'],
      servings: 8,
      totalTime: 60,
      tags: ['dessert', 'baking'],
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
    mockOnView.mockClear()
  })

  describe('rendering', () => {
    it('should render recipe cards', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })

    it('should render recipe descriptions', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(
        screen.getByText(/A classic Italian pasta dish/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Fresh romaine lettuce with parmesan/)
      ).toBeInTheDocument()
    })

    it('should render recipe tags', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByText('italian')).toBeInTheDocument()
      expect(screen.getByText('dinner')).toBeInTheDocument()
      expect(screen.getByText('quick')).toBeInTheDocument()
      expect(screen.getByText('salad')).toBeInTheDocument()
      expect(screen.getByText('healthy')).toBeInTheDocument()
      expect(screen.getByText('dessert')).toBeInTheDocument()
      expect(screen.getByText('baking')).toBeInTheDocument()
    })

    it('should render servings information', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByText(/4.*servings?/i)).toBeInTheDocument()
      expect(screen.getByText(/2.*servings?/i)).toBeInTheDocument()
      expect(screen.getByText(/8.*servings?/i)).toBeInTheDocument()
    })

    it('should render total time information', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByText(/30.*min/i)).toBeInTheDocument()
      expect(screen.getByText(/15.*min/i)).toBeInTheDocument()
      expect(screen.getByText(/60.*min/i)).toBeInTheDocument()
    })

    it('should render action buttons for each recipe', () => {
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

      expect(viewButtons).toHaveLength(3)
      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })
  })

  describe('empty state', () => {
    it('should render empty state when no recipes exist', () => {
      render(
        <RecipeList
          recipes={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument()
    })

    it('should render create recipe button in empty state', () => {
      render(
        <RecipeList
          recipes={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
          onCreate={mockOnEdit}
        />
      )

      const createButton = screen.getByRole('button', {
        name: /create.*recipe/i,
      })
      expect(createButton).toBeInTheDocument()
    })

    it('should call onCreate when create button is clicked in empty state', async () => {
      const mockOnCreate = vi.fn()
      const user = userEvent.setup()

      render(
        <RecipeList
          recipes={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
          onCreate={mockOnCreate}
        />
      )

      const createButton = screen.getByRole('button', {
        name: /create.*recipe/i,
      })
      await user.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('card interactions', () => {
    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      await user.click(viewButtons[0])

      expect(mockOnView).toHaveBeenCalledTimes(1)
      expect(mockOnView).toHaveBeenCalledWith('recipe-1')
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[1])

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith('recipe-2')
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[2])

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith('recipe-3')
    })

    it('should call onView when card is clicked', async () => {
      const user = userEvent.setup()
      render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const recipeCard = screen.getByText('Spaghetti Carbonara').closest('div')
      if (recipeCard) {
        await user.click(recipeCard)
      }

      expect(mockOnView).toHaveBeenCalledWith('recipe-1')
    })
  })

  describe('responsive layout', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(
        <RecipeList
          recipes={mockRecipes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      const gridElement = container.querySelector('.grid, [class*="grid-cols"]')
      expect(gridElement).toBeInTheDocument()
    })
  })

  describe('truncation', () => {
    it('should truncate long descriptions', () => {
      const recipeWithLongDesc: Recipe = {
        id: 'recipe-long',
        name: 'Long Description Recipe',
        description:
          'This is a very long description that should be truncated to ensure the card maintains a consistent height and does not take up too much space. It should be limited to about 2-3 lines maximum to keep the layout clean and organized. Additional text beyond this point should not be visible in the card view.',
        ingredients: [{ ingredientId: 'test', quantity: 1 }],
        instructions: ['Test'],
        servings: 4,
        totalTime: 30,
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const { container } = render(
        <RecipeList
          recipes={[recipeWithLongDesc]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      )

      // Check for line-clamp class or similar truncation styling
      const description = container.querySelector(
        '[class*="line-clamp"], [class*="truncate"]'
      )
      expect(description).toBeInTheDocument()
    })
  })
})
