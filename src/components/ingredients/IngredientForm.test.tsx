import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '../../test/test-utils'

import { IngredientForm } from './IngredientForm'

import type { Ingredient } from '../../types/ingredient'

describe('IngredientForm', () => {
  describe('Create mode', () => {
    it('should render all form fields', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
      expect(
        screen.getByRole('textbox', { name: /category/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /unit/i })).toBeInTheDocument()
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

      await user.type(screen.getByRole('textbox', { name: /name/i }), 'Tomato')
      await user.click(screen.getByRole('textbox', { name: /category/i }))
      await user.click(screen.getByText('Vegetables'))
      await user.click(screen.getByRole('textbox', { name: /unit/i }))
      await user.click(screen.getByText('piece'))
      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Tomato',
        category: 'Vegetables',
        unit: 'piece',
      })
    })

    it('should not submit form with empty fields', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      // Wait a bit for any potential validation to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Form should not submit when fields are empty
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onCancel).toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Edit mode', () => {
    const mockIngredient: Ingredient = {
      id: '1',
      name: 'Tomato',
      category: 'Vegetables',
      unit: 'piece',
    }

    it('should populate form with initial values', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <IngredientForm
          ingredient={mockIngredient}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
        'Tomato'
      )
      expect(screen.getByRole('textbox', { name: /category/i })).toHaveValue(
        'Vegetables'
      )
      expect(screen.getByRole('textbox', { name: /unit/i })).toHaveValue(
        'piece'
      )
      expect(
        screen.getByRole('button', { name: /update ingredient/i })
      ).toBeInTheDocument()
    })

    it('should submit form with updated data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(
        <IngredientForm
          ingredient={mockIngredient}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      await user.clear(screen.getByRole('textbox', { name: /name/i }))
      await user.type(
        screen.getByRole('textbox', { name: /name/i }),
        'Cherry Tomato'
      )
      await user.click(screen.getByRole('textbox', { name: /unit/i }))
      await user.click(screen.getByText('gram'))
      await user.click(
        screen.getByRole('button', { name: /update ingredient/i })
      )

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Cherry Tomato',
        category: 'Vegetables',
        unit: 'gram',
      })
    })
  })

  describe('Validation', () => {
    it('should not submit form with name that is too short', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(screen.getByRole('textbox', { name: /name/i }), 'A')
      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      // Wait a bit for any potential validation to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Form should not submit when name is too short
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should not submit form with name that is too long', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onCancel = vi.fn()

      render(<IngredientForm onSubmit={onSubmit} onCancel={onCancel} />)

      await user.type(
        screen.getByRole('textbox', { name: /name/i }),
        'A'.repeat(101)
      )
      await user.click(
        screen.getByRole('button', { name: /create ingredient/i })
      )

      // Wait a bit for any potential validation to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Form should not submit when name is too long
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
