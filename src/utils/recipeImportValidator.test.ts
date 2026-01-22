import { describe, expect, it } from 'vitest'

import { Ingredient } from '../types/ingredient'

import { validateRecipeImport } from './recipeImportValidator'

describe('validateRecipeImport', () => {
  const mockIngredients: Ingredient[] = [
    { id: '1', name: 'Olive Oil', category: 'Oils & Fats', unit: 'tablespoon' },
    { id: '2', name: 'Garlic', category: 'Vegetables', unit: 'clove' },
    { id: '3', name: 'Basil', category: 'Herbs & Spices', unit: 'bunch' },
  ]

  it('should validate a valid recipe with existing ingredients', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Garlic Pasta',
      description: 'Simple pasta with garlic',
      ingredients: [
        { ingredientId: '1', quantity: 2 },
        { ingredientId: '2', quantity: 4 },
      ],
      instructions: ['Boil pasta', 'Cook garlic in oil', 'Toss together'],
      servings: 4,
      totalTime: 20,
      tags: ['Italian', 'Quick'],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(true)
    expect(result.recipe).toEqual(recipeData)
    expect(result.newIngredients).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('should handle recipe with suggested new ingredients', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Pasta with Cheese',
      description: 'Pasta with parmesan',
      ingredients: [
        { ingredientId: '1', quantity: 2 },
        {
          ingredientId: 'ing_new1',
          quantity: 0.5,
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Parmesan Cheese',
            category: 'Dairy',
            unit: 'cup',
          },
        },
      ],
      instructions: ['Cook pasta', 'Add cheese'],
      servings: 2,
      totalTime: 15,
      tags: ['Quick'],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(true)
    expect(result.recipe).toBeDefined()
    expect(result.newIngredients).toHaveLength(1)
    expect(result.newIngredients[0]).toEqual({
      id: 'ing_new1',
      name: 'Parmesan Cheese',
      category: 'Dairy',
      unit: 'cup',
    })
  })

  it('should return error for invalid JSON', () => {
    const invalidJson = '{ invalid json }'

    const result = validateRecipeImport(invalidJson, mockIngredients)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Invalid JSON format. Please check the JSON syntax.'
    )
  })

  it('should return error for missing required fields', () => {
    const incompleteRecipe = {
      id: 'recipe_123',
      name: 'Test Recipe',
      // Missing description, ingredients, instructions, etc.
    }

    const result = validateRecipeImport(
      JSON.stringify(incompleteRecipe),
      mockIngredients
    )

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should return error for ingredient with missing ingredientId', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [
        { quantity: 2 }, // Missing ingredientId
      ],
      instructions: ['Step 1'],
      servings: 2,
      totalTime: 10,
      tags: [],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(false)
    expect(result.errors.some(err => err.includes('ingredient'))).toBe(true)
  })

  it('should return error for ingredient ID not in library and no suggestedIngredient', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [
        { ingredientId: 'unknown_id', quantity: 1 }, // ID not in library, no suggestion
      ],
      instructions: ['Step 1'],
      servings: 2,
      totalTime: 10,
      tags: [],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(false)
    expect(result.errors.some(err => err.includes('unknown_id'))).toBe(true)
  })

  it('should validate recipe with empty ingredients list', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [],
      instructions: ['Step 1'],
      servings: 2,
      totalTime: 10,
      tags: [],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    // Should fail validation - recipes need at least one ingredient
    expect(result.isValid).toBe(false)
    expect(
      result.errors.some(err => err.toLowerCase().includes('ingredient'))
    ).toBe(true)
  })

  it('should validate recipe with optional imageUrl', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [{ ingredientId: '1', quantity: 1 }],
      instructions: ['Step 1'],
      servings: 2,
      totalTime: 10,
      tags: [],
      imageUrl: 'https://example.com/image.jpg',
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(true)
    expect(result.recipe?.imageUrl).toBe('https://example.com/image.jpg')
  })

  it('should handle multiple new ingredients', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Complex Recipe',
      description: 'Many new ingredients',
      ingredients: [
        { ingredientId: '1', quantity: 1 },
        {
          ingredientId: 'ing_new1',
          quantity: 2,
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Cheese',
            category: 'Dairy',
            unit: 'cup',
          },
        },
        {
          ingredientId: 'ing_new2',
          quantity: 3,
          suggestedIngredient: {
            id: 'ing_new2',
            name: 'Pasta',
            category: 'Grains',
            unit: 'gram',
          },
        },
      ],
      instructions: ['Step 1'],
      servings: 4,
      totalTime: 30,
      tags: ['Test'],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(true)
    expect(result.newIngredients).toHaveLength(2)
    expect(result.newIngredients.map(i => i.name)).toEqual(['Cheese', 'Pasta'])
  })

  it('should validate servings and totalTime are positive numbers', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [{ ingredientId: '1', quantity: 1 }],
      instructions: ['Step 1'],
      servings: -1,
      totalTime: 0,
      tags: [],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(false)
    expect(
      result.errors.some(
        err =>
          err.toLowerCase().includes('serving') ||
          err.toLowerCase().includes('time')
      )
    ).toBe(true)
  })
})
