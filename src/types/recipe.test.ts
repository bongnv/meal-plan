import { describe, expect, it } from 'vitest'

import { RecipeIngredientSchema, RecipeSchema } from './recipe'

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

describe('Recipe Types', () => {
  describe('RecipeSchema imageUrl validation', () => {
    const validRecipe = {
      id: 'recipe-123',
      name: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        {
          ingredientId: 'ingredient-123',
          quantity: 2.5,
        },
      ],
      instructions: ['Step 1', 'Step 2'],
      servings: 4,
      totalTime: 30,
      tags: ['test'],
    }

    it('should validate Recipe with valid imageUrl', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'https://example.com/image.jpg',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe('https://example.com/image.jpg')
      }
    })

    it('should validate Recipe with http imageUrl', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'http://example.com/image.jpg',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe('http://example.com/image.jpg')
      }
    })

    it('should validate Recipe without imageUrl (backward compatible)', () => {
      const recipe = { ...validRecipe }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBeUndefined()
      }
    })

    it('should transform empty string imageUrl to undefined', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: '',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBeUndefined()
      }
    })

    it('should reject Recipe with invalid URL format', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'not-a-valid-url',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with invalid URL protocol', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'ftp://example.com/image.jpg',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with malformed URL', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'http://invalid url with spaces.com',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should validate Recipe with imageUrl containing query parameters', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'https://example.com/image.jpg?size=large&format=webp',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe(
          'https://example.com/image.jpg?size=large&format=webp'
        )
      }
    })

    it('should validate Recipe with imageUrl containing hash fragment', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'https://example.com/image.jpg#section',
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.imageUrl).toBe(
          'https://example.com/image.jpg#section'
        )
      }
    })
  })
})
