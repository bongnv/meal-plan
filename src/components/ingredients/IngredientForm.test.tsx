import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import IngredientForm from './IngredientForm'
import {
  IngredientCategory,
  StandardUnit,
  type IngredientItem,
} from '../../types/recipe'

describe('IngredientForm', () => {
  describe('Create mode', () => {
    it('should render empty form for creating new ingredient', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByLabelText(/name/i)).toHaveValue('')
      expect(screen.getByLabelText(/category/i)).toHaveValue('')
      expect(screen.getByLabelText(/standard unit/i)).toHaveValue('')
      expect(
        screen.getByRole('button', { name: /create ingredient/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/name/i), 'Carrot')
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        IngredientCategory.Produce
      )
      await user.selectOptions(
        screen.getByLabelText(/standard unit/i),
        StandardUnit.Gram
      )

      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Carrot',
          category: IngredientCategory.Produce,
          standardUnit: 'g',
        })
      })
    })

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      await waitFor(() => {
        const errors = screen.getAllByText(
          /string must contain at least 1 character/i
        )
        expect(errors.length).toBeGreaterThan(0)
      })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should show validation error for missing category', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/name/i), 'Carrot')
      await user.selectOptions(
        screen.getByLabelText(/standard unit/i),
        StandardUnit.Gram
      )
      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      await waitFor(() => {
        expect(screen.getByText(/invalid enum value/i)).toBeInTheDocument()
      })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should show validation error for empty standard unit', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByLabelText(/name/i), 'Carrot')
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        IngredientCategory.Produce
      )
      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      await waitFor(() => {
        expect(screen.getByText(/invalid enum value/i)).toBeInTheDocument()
      })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onCancel).toHaveBeenCalledOnce()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Edit mode', () => {
    const existingIngredient: IngredientItem = {
      id: '1',
      name: 'Carrot',
      category: IngredientCategory.Produce,
      standardUnit: StandardUnit.Gram,
    }

    it('should render form pre-filled with existing ingredient data', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <IngredientForm
          ingredient={existingIngredient}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByLabelText(/name/i)).toHaveValue('Carrot')
      expect(screen.getByLabelText(/category/i)).toHaveValue(
        IngredientCategory.Produce
      )
      expect(screen.getByLabelText(/standard unit/i)).toHaveValue('g')
      expect(
        screen.getByRole('button', { name: /update ingredient/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })

    it('should submit updated ingredient data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <IngredientForm
          ingredient={existingIngredient}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      await user.clear(screen.getByLabelText(/name/i))
      await user.type(screen.getByLabelText(/name/i), 'Updated Carrot')
      await user.selectOptions(
        screen.getByLabelText(/category/i),
        IngredientCategory.Pantry
      )
      await user.selectOptions(
        screen.getByLabelText(/standard unit/i),
        StandardUnit.Kilogram
      )

      await user.click(
        screen.getByRole('button', { name: /update ingredient/i })
      )

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          id: '1',
          name: 'Updated Carrot',
          category: IngredientCategory.Pantry,
          standardUnit: StandardUnit.Kilogram,
        })
      })
    })

    it('should validate updated data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <IngredientForm
          ingredient={existingIngredient}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      await user.clear(screen.getByLabelText(/name/i))
      await user.click(
        screen.getByRole('button', { name: /update ingredient/i })
      )

      await waitFor(() => {
        expect(
          screen.getByText(/string must contain at least 1 character/i)
        ).toBeInTheDocument()
      })
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Category dropdown', () => {
    it('should show all ingredient categories', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const categorySelect = screen.getByLabelText(
        /category/i
      ) as HTMLSelectElement
      const options = Array.from(categorySelect.options).map(opt => opt.value)

      expect(options).toContain(IngredientCategory.Produce)
      expect(options).toContain(IngredientCategory.Dairy)
      expect(options).toContain(IngredientCategory.Meat)
      expect(options).toContain(IngredientCategory.Pantry)
      expect(options).toContain(IngredientCategory.Frozen)
      expect(options).toContain(IngredientCategory.Bakery)
      expect(options).toContain(IngredientCategory.Other)
    })
  })

  describe('Standard Unit dropdown', () => {
    it('should show all 12 standard units', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      const unitSelect = screen.getByLabelText(
        /standard unit/i
      ) as HTMLSelectElement
      const options = Array.from(unitSelect.options).map(opt => opt.value)

      // Weight
      expect(options).toContain(StandardUnit.Gram)
      expect(options).toContain(StandardUnit.Kilogram)
      // Volume
      expect(options).toContain(StandardUnit.Milliliter)
      expect(options).toContain(StandardUnit.Liter)
      // Count
      expect(options).toContain(StandardUnit.Piece)
      // Recipe measurements
      expect(options).toContain(StandardUnit.Tablespoon)
      expect(options).toContain(StandardUnit.Teaspoon)
      expect(options).toContain(StandardUnit.Cup)
      // Specific
      expect(options).toContain(StandardUnit.Clove)
      expect(options).toContain(StandardUnit.Slice)
      expect(options).toContain(StandardUnit.Bunch)
      expect(options).toContain(StandardUnit.Pinch)
    })
  })
})
