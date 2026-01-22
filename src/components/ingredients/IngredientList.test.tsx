import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'

import { IngredientList } from './IngredientList'

import type { Ingredient } from '../../types/ingredient'

describe('IngredientList', () => {
  const mockIngredients: Ingredient[] = [
    { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
    { id: '2', name: 'Onion', category: 'Vegetables', unit: 'piece' },
    {
      id: '3',
      name: 'Chicken Breast',
      category: 'Meat',
      unit: 'gram',
    },
  ]

  describe('Rendering', () => {
    it('should render list of ingredients', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Tomato')).toBeInTheDocument()
      expect(screen.getByText('Onion')).toBeInTheDocument()
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    })

    it('should render empty state when no ingredients', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList ingredients={[]} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(
        screen.getByText(/no ingredients in your library yet/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/start adding ingredients/i)).toBeInTheDocument()
    })

    it('should display ingredient details', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getAllByText('Vegetables')).toHaveLength(3) // Filter option + 2 badges
      expect(screen.getAllByText('Meat')).toHaveLength(2) // Filter option + 1 badge
      expect(screen.getAllByText('piece')).toHaveLength(2)
      expect(screen.getByText('gram')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      expect(onEdit).toHaveBeenCalledWith('1')
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      expect(onDelete).toHaveBeenCalledWith('1')
    })
  })

  describe('Search and Filter', () => {
    it('should filter ingredients by search term', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search ingredients/i)
      await user.type(searchInput, 'chicken')

      // Chicken Breast should be visible
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    })

    it('should filter ingredients by category', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const categoryFilter = screen.getByRole('textbox', { name: /category/i })
      await user.click(categoryFilter)
      // Click the option from the dropdown, not the badge
      const meatOptions = screen.getAllByText('Meat')
      await user.click(meatOptions[0]) // First occurrence is the dropdown option

      // Chicken Breast should still be visible
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    })

    it('should show message when no results found', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search ingredients/i)
      await user.type(searchInput, 'xyz123')

      expect(screen.getByText(/no ingredients found/i)).toBeInTheDocument()
      // No table rows should be visible except possibly the empty state
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })

    it('should clear filters when search is cleared', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search ingredients/i)
      await user.type(searchInput, 'chicken')
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()

      await user.clear(searchInput)
      // All items visible again
      expect(screen.getByText('Tomato')).toBeInTheDocument()
      expect(screen.getByText('Onion')).toBeInTheDocument()
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    })
  })
})
