import { describe, expect, it } from 'vitest'

import { RecipeIngredientSchema } from './recipe'

describe('RecipeIngredient Types', () => {
  describe('RecipeIngredientSchema', () => {
    it('should validate RecipeIngredient with ingredientId and quantity only (backward compatible)', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          ingredientId: 'ingredient-123',
          quantity: 2.5,
        })
      }
    })

    it('should validate RecipeIngredient with optional displayName', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        displayName: 'chicken',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          ingredientId: 'ingredient-123',
          quantity: 2.5,
          displayName: 'chicken',
        })
      }
    })

    it('should validate RecipeIngredient with empty string displayName', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        displayName: '',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          ingredientId: 'ingredient-123',
          quantity: 2.5,
          displayName: '',
        })
      }
    })

    it('should reject RecipeIngredient with missing ingredientId', () => {
      const ingredient = {
        quantity: 2.5,
        displayName: 'chicken',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeIngredient with missing quantity', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        displayName: 'chicken',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeIngredient with invalid quantity type', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: '2.5', // string instead of number
        displayName: 'chicken',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeIngredient with invalid displayName type', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        displayName: 123, // number instead of string
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(false)
    })

    it('should handle displayName with special characters', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        displayName: 'chicken breast (boneless)',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.displayName).toBe('chicken breast (boneless)')
      }
    })

    it('should handle displayName with unicode characters', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        displayName: '鶏肉',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.displayName).toBe('鶏肉')
      }
    })
  })
})
