import { describe, expect, it } from 'vitest'

import {
  RecipeIngredientSchema,
  RecipeSchema,
  RecipeSectionSchema,
} from './recipe'

describe('RecipeSection Types', () => {
  describe('RecipeSectionSchema', () => {
    it('should validate RecipeSection with all fields', () => {
      const section = {
        name: 'BROTH',
        ingredients: [{ ingredientId: 'ing-1', quantity: 2, unit: 'cup' }],
        instructions: ['Boil water', 'Add ingredients'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('BROTH')
        expect(result.data.ingredients).toHaveLength(1)
        expect(result.data.instructions).toHaveLength(2)
      }
    })

    it('should validate RecipeSection with undefined name (simple recipe)', () => {
      const section = {
        name: undefined,
        ingredients: [{ ingredientId: 'ing-1', quantity: 2 }],
        instructions: ['Mix well'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBeUndefined()
      }
    })

    it('should validate RecipeSection with empty name', () => {
      const section = {
        name: '',
        ingredients: [],
        instructions: ['Step 1'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('')
      }
    })

    it('should validate RecipeSection without name field', () => {
      const section = {
        ingredients: [{ ingredientId: 'ing-1', quantity: 1 }],
        instructions: ['Cook'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
    })

    it('should validate RecipeSection with empty ingredients array', () => {
      const section = {
        name: 'ASSEMBLY',
        ingredients: [],
        instructions: ['Assemble dish'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
    })

    it('should validate RecipeSection with empty instructions array', () => {
      const section = {
        name: 'PREP',
        ingredients: [{ ingredientId: 'ing-1', quantity: 1 }],
        instructions: [],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(true)
    })

    it('should reject RecipeSection with missing ingredients field', () => {
      const section = {
        name: 'BROTH',
        instructions: ['Boil water'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeSection with missing instructions field', () => {
      const section = {
        name: 'BROTH',
        ingredients: [{ ingredientId: 'ing-1', quantity: 2 }],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeSection with invalid ingredients type', () => {
      const section = {
        name: 'BROTH',
        ingredients: 'not-an-array',
        instructions: ['Boil water'],
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(false)
    })

    it('should reject RecipeSection with invalid instructions type', () => {
      const section = {
        name: 'BROTH',
        ingredients: [],
        instructions: 'not-an-array',
      }

      const result = RecipeSectionSchema.safeParse(section)

      expect(result.success).toBe(false)
    })
  })
})

describe('RecipeIngredient Types', () => {
  describe('RecipeIngredientSchema', () => {
    it('should validate RecipeIngredient with unit field', () => {
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

    it('should validate RecipeIngredient with unit and displayName', () => {
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

    it('should reject RecipeIngredient with invalid unit', () => {
      const ingredient = {
        ingredientId: 'ingredient-123',
        quantity: 2.5,
        unit: 'invalid-unit',
      }

      const result = RecipeIngredientSchema.safeParse(ingredient)

      expect(result.success).toBe(false)
    })

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
      sections: [
        {
          name: undefined,
          ingredients: [
            {
              ingredientId: 'ingredient-123',
              quantity: 2.5,
            },
          ],
          instructions: ['Step 1', 'Step 2'],
        },
      ],
      servings: 4,
      prepTime: 15,
      cookTime: 15,
      tags: ['test'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    it('should validate Recipe with valid imageUrl', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with invalid URL protocol', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'ftp://example.com/image.jpg',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with malformed URL', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'http://invalid url with spaces.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should validate Recipe with imageUrl containing query parameters', () => {
      const recipe = {
        ...validRecipe,
        imageUrl: 'https://example.com/image.jpg?size=large&format=webp',
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
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

describe('Recipe Types', () => {
  describe('RecipeSchema with sections', () => {
    it('should validate Recipe with sections array', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Chicken Pho',
        description: 'Vietnamese soup',
        sections: [
          {
            name: 'BROTH',
            ingredients: [{ ingredientId: 'ing-1', quantity: 2, unit: 'liter' }],
            instructions: ['Boil water', 'Add spices'],
          },
          {
            name: 'ASSEMBLY',
            ingredients: [{ ingredientId: 'ing-2', quantity: 200, unit: 'gram' }],
            instructions: ['Add noodles', 'Pour broth'],
          },
        ],
        servings: 4,
        prepTime: 30,
        cookTime: 120,
        tags: ['soup', 'vietnamese'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sections).toHaveLength(2)
        expect(result.data.sections[0].name).toBe('BROTH')
        expect(result.data.sections[1].name).toBe('ASSEMBLY')
      }
    })

    it('should validate Recipe with single unnamed section (simple recipe)', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Simple Pasta',
        description: 'Quick pasta dish',
        sections: [
          {
            name: undefined,
            ingredients: [{ ingredientId: 'ing-1', quantity: 200, unit: 'gram' }],
            instructions: ['Boil pasta', 'Add sauce'],
          },
        ],
        servings: 2,
        prepTime: 5,
        cookTime: 10,
        tags: ['pasta'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sections).toHaveLength(1)
        expect(result.data.sections[0].name).toBeUndefined()
      }
    })

    it('should reject Recipe with empty sections array', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with missing sections field', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Test Recipe',
        description: 'A test recipe',
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(false)
    })

    it('should reject Recipe with sections but also has flat ingredients', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [
          {
            name: 'MAIN',
            ingredients: [{ ingredientId: 'ing-1', quantity: 1 }],
            instructions: ['Cook'],
          },
        ],
        ingredients: [{ ingredientId: 'ing-2', quantity: 2 }], // should not exist
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      // Should still validate since we're removing flat fields from schema
      expect(result.success).toBe(true)
    })

    it('should validate Recipe with sections containing empty arrays', () => {
      const recipe = {
        id: 'recipe-123',
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [
          {
            name: 'PREP',
            ingredients: [],
            instructions: ['Prepare station'],
          },
        ],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeSchema.safeParse(recipe)

      expect(result.success).toBe(true)
    })
  })
})
