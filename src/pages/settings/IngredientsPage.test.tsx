import { modals } from '@mantine/modals'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '../../db/database'
import { ingredientService } from '../../services/ingredientService'
import { render, screen, waitFor } from '../../test/test-utils'

import { IngredientsPage } from './IngredientsPage'

import type { Ingredient } from '../../types/ingredient'

vi.mock('../../services/ingredientService', () => ({
  ingredientService: {
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn(),
  },
}))

describe('IngredientsPage', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 'ing1',
      name: 'Tomato',
      category: 'Vegetables',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ing2',
      name: 'Chicken',
      category: 'Poultry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    await db.ingredients.clear()
    await db.ingredients.bulkAdd(mockIngredients)
  })

  it('should render ingredient library page', async () => {
    render(<IngredientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ingredient Library')).toBeInTheDocument()
    })
  })

  it('should display list of ingredients', async () => {
    render(<IngredientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument()
      expect(screen.getByText('Chicken')).toBeInTheDocument()
    })
  })

  it('should have add ingredient button', async () => {
    render(<IngredientsPage />)

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add ingredient/i })
      expect(addButton).toBeInTheDocument()
    })
  })

  it('should open create modal when add button is clicked', async () => {
    const user = userEvent.setup()
    render(<IngredientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ingredient Library')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add ingredient/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Ingredient')).toBeInTheDocument()
    })
  })

  it('should have modal for creating ingredients', async () => {
    render(<IngredientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ingredient Library')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /add ingredient/i })
      ).toBeInTheDocument()
    })
  })

  it('should open delete confirmation modal when delete is clicked', async () => {
    const user = userEvent.setup()
    render(<IngredientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument()
    })

    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(modals.openConfirmModal).toHaveBeenCalled()
    })
  })

  it('should show empty state when no ingredients', async () => {
    await db.ingredients.clear()

    render(<IngredientsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/no ingredients in your library yet/i)
      ).toBeInTheDocument()
    })
  })
})
