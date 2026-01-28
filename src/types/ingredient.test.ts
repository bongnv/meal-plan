import { describe, expect, it } from 'vitest'

import {
  INGREDIENT_CATEGORIES,
  IngredientCategorySchema,
  IngredientFormSchema,
  IngredientSchema,
  UNITS,
  UnitSchema,
} from './ingredient'

describe('ingredient types', () => {
  describe('UnitSchema', () => {
    it('should validate valid units', () => {
      UNITS.forEach(unit => {
        expect(UnitSchema.parse(unit)).toBe(unit)
      })
    })

    it('should reject invalid units', () => {
      expect(() => UnitSchema.parse('invalid')).toThrow()
    })
  })

  describe('IngredientCategorySchema', () => {
    it('should validate valid categories', () => {
      INGREDIENT_CATEGORIES.forEach(category => {
        expect(IngredientCategorySchema.parse(category)).toBe(category)
      })
    })

    it('should reject invalid categories', () => {
      expect(() => IngredientCategorySchema.parse('Invalid Category')).toThrow()
    })
  })

  describe('IngredientSchema', () => {
    it('should validate a complete ingredient', () => {
      const ingredient = {
        id: 'ing1',
        name: 'Tomato',
        category: 'Vegetables' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = IngredientSchema.parse(ingredient)
      expect(result).toEqual(ingredient)
    })

    it('should set default timestamps if not provided', () => {
      const ingredient = {
        id: 'ing1',
        name: 'Tomato',
        category: 'Vegetables' as const,
      }

      const result = IngredientSchema.parse(ingredient)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(typeof result.createdAt).toBe('number')
      expect(typeof result.updatedAt).toBe('number')
    })

    it('should reject ingredient with empty name', () => {
      const ingredient = {
        id: 'ing1',
        name: '',
        category: 'Vegetables' as const,
      }

      expect(() => IngredientSchema.parse(ingredient)).toThrow()
    })

    it('should reject ingredient with invalid category', () => {
      const ingredient = {
        id: 'ing1',
        name: 'Tomato',
        category: 'Invalid',
      }

      expect(() => IngredientSchema.parse(ingredient)).toThrow()
    })

    it('should reject negative timestamps', () => {
      const ingredient = {
        id: 'ing1',
        name: 'Tomato',
        category: 'Vegetables' as const,
        createdAt: -1,
      }

      expect(() => IngredientSchema.parse(ingredient)).toThrow()
    })
  })

  describe('IngredientFormSchema', () => {
    it('should validate valid form values', () => {
      const formValues = {
        name: 'Tomato',
        category: 'Vegetables' as const,
      }

      const result = IngredientFormSchema.parse(formValues)
      expect(result).toEqual(formValues)
    })

    it('should reject empty name', () => {
      const formValues = {
        name: '',
        category: 'Vegetables' as const,
      }

      expect(() => IngredientFormSchema.parse(formValues)).toThrow(
        'Name is required'
      )
    })

    it('should reject name that is too short', () => {
      const formValues = {
        name: 'a',
        category: 'Vegetables' as const,
      }

      expect(() => IngredientFormSchema.parse(formValues)).toThrow(
        'Name must be at least 2 characters'
      )
    })

    it('should reject name that is too long', () => {
      const formValues = {
        name: 'a'.repeat(101),
        category: 'Vegetables' as const,
      }

      expect(() => IngredientFormSchema.parse(formValues)).toThrow(
        'Name must be at most 100 characters'
      )
    })

    it('should reject missing category', () => {
      const formValues = {
        name: 'Tomato',
      }

      expect(() => IngredientFormSchema.parse(formValues)).toThrow(
        'Category is required'
      )
    })

    it('should reject invalid category', () => {
      const formValues = {
        name: 'Tomato',
        category: 'Invalid',
      }

      expect(() => IngredientFormSchema.parse(formValues)).toThrow()
    })
  })
})
