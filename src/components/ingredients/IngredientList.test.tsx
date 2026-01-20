import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import IngredientList from './IngredientList'
import {
  IngredientCategory,
  StandardUnit,
  type IngredientItem,
} from '../../types/recipe'

describe('IngredientList', () => {
  const mockIngredients: IngredientItem[] = [
    {
      id: '1',
      name: 'Carrot',
      category: IngredientCategory.Produce,
      standardUnit: StandardUnit.Gram,
    },
    {
      id: '2',
      name: 'Milk',
      category: IngredientCategory.Dairy,
      standardUnit: StandardUnit.Milliliter,
    },
    {
      id: '3',
      name: 'Chicken Breast',
      category: IngredientCategory.Meat,
      standardUnit: StandardUnit.Gram,
    },
  ]

  describe('with ingredients', () => {
    it('should render all ingredients', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Carrot')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    })

    it('should render ingredient category badges', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Produce')).toBeInTheDocument()
      expect(screen.getByText('Dairy')).toBeInTheDocument()
      expect(screen.getByText('Meat')).toBeInTheDocument()
    })

    it('should render standard units', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // Check for unit text (there are 2 ingredients with 'g' unit)
      const gElements = screen.getAllByText(/Unit: g/i)
      expect(gElements).toHaveLength(2)
      expect(screen.getByText(/Unit: ml/i)).toBeInTheDocument()
    })

    it('should render edit and delete buttons for each ingredient', () => {
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
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

      expect(editButtons).toHaveLength(mockIngredients.length)
      expect(deleteButtons).toHaveLength(mockIngredients.length)
    })

    it('should call onEdit with ingredient id when edit button is clicked', async () => {
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

    it('should call onDelete with ingredient id when delete button is clicked', async () => {
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

    it('should render cards in a grid layout', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      const { container } = render(
        <IngredientList
          ingredients={mockIngredients}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })
  })

  describe('empty state', () => {
    it('should render empty state message when no ingredients', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <IngredientList ingredients={[]} onEdit={onEdit} onDelete={onDelete} />
      )

      expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument()
      expect(screen.getByText(/add your first ingredient/i)).toBeInTheDocument()
    })

    it('should not render grid when empty', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      const { container } = render(
        <IngredientList ingredients={[]} onEdit={onEdit} onDelete={onDelete} />
      )

      const grid = container.querySelector('.grid')
      expect(grid).not.toBeInTheDocument()
    })
  })
})
