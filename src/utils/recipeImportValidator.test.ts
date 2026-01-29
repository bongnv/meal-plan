import { describe, it, expect } from 'vitest'

import { validateRecipeImport } from './recipeImportValidator'

import type { Ingredient } from '../types/ingredient'

describe('validateRecipeImport', () => {
  const existingIngredients: Ingredient[] = [
    {
      id: 'ing1',
      name: 'Flour',
      category: 'Baking',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ing2',
      name: 'Sugar',
      category: 'Baking',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  describe('JSON parsing', () => {
    it('should return error for invalid JSON', () => {
      const result = validateRecipeImport('invalid json', existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Invalid JSON format. Please check the JSON syntax.'
      )
      expect(result.newIngredients).toEqual([])
    })

    it('should return error for empty string', () => {
      const result = validateRecipeImport('', existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Invalid JSON format. Please check the JSON syntax.'
      )
    })
  })

  describe('schema validation', () => {
    it('should return error when recipe is missing required fields', () => {
      const invalidRecipe = JSON.stringify({
        name: 'Test Recipe',
        // missing other required fields
      })

      const result = validateRecipeImport(invalidRecipe, existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should return error when sections array is empty', () => {
      const invalidRecipe = JSON.stringify({
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [],
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
      })

      const result = validateRecipeImport(invalidRecipe, existingIngredients)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some(e => e.includes('At least one section'))
      ).toBe(true)
    })

    it('should return error when servings is less than 1', () => {
      const invalidRecipe = JSON.stringify({
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [{
          name: undefined,
          ingredients: [{ name: 'Flour', quantity: 2, unit: 'cup' }],
          instructions: ['Mix ingredients']
        }],
        servings: 0,
        prepTime: 10,
        cookTime: 20,
        tags: [],
      })

      const result = validateRecipeImport(invalidRecipe, existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Servings'))).toBe(true)
    })

    it('should return error when prepTime is less than 1', () => {
      const invalidRecipe = JSON.stringify({
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [{
          name: undefined,
          ingredients: [{ name: 'Flour', quantity: 2, unit: 'cup' }],
          instructions: ['Mix ingredients']
        }],
        servings: 4,
        prepTime: 0,
        cookTime: 20,
        tags: [],
      })

      const result = validateRecipeImport(invalidRecipe, existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Prep time'))).toBe(true)
    })

    it('should return error when cookTime is less than 1', () => {
      const invalidRecipe = JSON.stringify({
        name: 'Test Recipe',
        description: 'A test recipe',
        sections: [{
          name: undefined,
          ingredients: [{ name: 'Flour', quantity: 2, unit: 'cup' }],
          instructions: ['Mix ingredients']
        }],
        servings: 4,
        prepTime: 10,
        cookTime: 0,
        tags: [],
      })

      const result = validateRecipeImport(invalidRecipe, existingIngredients)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Cook time'))).toBe(true)
    })
  })

  describe('valid recipe import', () => {
    it('should match ingredients case-insensitively', () => {
      const validRecipe = JSON.stringify({
        name: 'Cookies',
        description: 'Sugar cookies',
        sections: [{
          name: undefined,
          ingredients: [
            { name: 'flour', quantity: 2, unit: 'cup' },
            { name: 'SUGAR', quantity: 1, unit: 'cup' },
          ],
          instructions: ['Mix and bake']
        }],
        servings: 24,
        prepTime: 15,
        cookTime: 12,
        tags: ['dessert'],
      })

      const result = validateRecipeImport(validRecipe, existingIngredients)

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toEqual([])
      expect(result.recipe!.sections[0].ingredients[0].ingredientId).toBe('ing1')
      expect(result.recipe!.sections[0].ingredients[1].ingredientId).toBe('ing2')
    })

    it('should handle optional displayName for ingredients', () => {
      const validRecipe = JSON.stringify({
        name: 'Pizza',
        description: 'Homemade pizza',
        sections: [{
          name: undefined,
          ingredients: [
            {
              name: 'Flour',
              quantity: 3,
              unit: 'cup',
              displayName: 'All-purpose flour',
            },
          ],
          instructions: ['Make dough', 'Add toppings', 'Bake']
        }],
        servings: 4,
        prepTime: 30,
        cookTime: 20,
        tags: ['dinner'],
      })

      const result = validateRecipeImport(validRecipe, existingIngredients)

      expect(result.isValid).toBe(true)
      expect(result.recipe!.sections[0].ingredients[0].displayName).toBe(
        'All-purpose flour'
      )
    })

    it('should handle optional imageUrl', () => {
      const validRecipe = JSON.stringify({
        name: 'Burger',
        description: 'Classic burger',
        sections: [{
          name: undefined,
          ingredients: [{ name: 'Flour', quantity: 2, unit: 'cup' }],
          instructions: ['Cook burger']
        }],
        servings: 2,
        prepTime: 10,
        cookTime: 15,
        tags: ['lunch'],
        imageUrl: 'https://example.com/burger.jpg',
      })

      const result = validateRecipeImport(validRecipe, existingIngredients)

      expect(result.isValid).toBe(true)
      expect(result.recipe!.imageUrl).toBe('https://example.com/burger.jpg')
    })
  })

  describe('edge cases', () => {
    it('should handle empty existing ingredients array', () => {
      const validRecipe = JSON.stringify({
        name: 'Recipe',
        description: 'Recipe',
        sections: [{
          name: undefined,
          ingredients: [
            {
              name: 'Ingredient1',
              quantity: 1,
              unit: 'cup',
              category: 'Category1',
            },
          ],
          instructions: ['Do something']
        }],
        servings: 1,
        prepTime: 5,
        cookTime: 10,
        tags: [],
      })

      const result = validateRecipeImport(validRecipe, [])

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(1)
      expect(result.newIngredients[0].name).toBe('Ingredient1')
    })
  })
})
