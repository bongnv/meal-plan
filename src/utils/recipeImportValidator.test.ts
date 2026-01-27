import { describe, expect, it } from 'vitest'

import { Ingredient } from '../types/ingredient'

import { validateRecipeImport } from './recipeImportValidator'

describe('validateRecipeImport', () => {
  const mockIngredients: Ingredient[] = [
    { id: '1', name: 'Spaghetti', category: 'Grains' },
    { id: '2', name: 'Garlic', category: 'Vegetables' },
    { id: '3', name: 'Basil', category: 'Herbs & Spices' },
  ]

  it('should validate a valid recipe with existing ingredients', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Garlic Pasta',
      description: 'Simple pasta with garlic',
      ingredients: [
        { ingredientId: '1', quantity: 2, unit: 'cup' },
        { ingredientId: '2', quantity: 4, unit: 'clove' },
      ],
      instructions: ['Boil pasta', 'Cook garlic in oil', 'Toss together'],
      servings: 4,
      prepTime: 10,
      cookTime: 10,
      tags: ['Italian', 'Quick'],
    }

    const result = validateRecipeImport(
      JSON.stringify(recipeData),
      mockIngredients
    )

    expect(result.isValid).toBe(true)
    expect(result.recipe).toEqual({
      ...recipeData,
      subRecipes: [], // schema defaults to empty array
    })
    expect(result.newIngredients).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('should handle recipe with suggested new ingredients', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Pasta with Cheese',
      description: 'Pasta with parmesan',
      ingredients: [
        { ingredientId: '1', quantity: 2, unit: 'cup' },
        {
          ingredientId: 'ing_new1',
          quantity: 0.5,
          unit: 'cup',
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Parmesan Cheese',
            category: 'Dairy',
          },
        },
      ],
      instructions: ['Cook pasta', 'Add cheese'],
      servings: 2,
      prepTime: 8,
      cookTime: 7,
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
      prepTime: 5,
      cookTime: 5,
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
        { ingredientId: 'unknown_id', quantity: 1, unit: 'cup' }, // ID not in library, no suggestion
      ],
      instructions: ['Step 1'],
      servings: 2,
      prepTime: 5,
      cookTime: 5,
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
      prepTime: 5,
      cookTime: 5,
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
      ingredients: [{ ingredientId: '1', quantity: 1, unit: 'cup' }],
      instructions: ['Step 1'],
      servings: 2,
      prepTime: 5,
      cookTime: 5,
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
        { ingredientId: '1', quantity: 1, unit: 'cup' },
        {
          ingredientId: 'ing_new1',
          quantity: 2,
          unit: 'cup',
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Cheese',
            category: 'Dairy',
          },
        },
        {
          ingredientId: 'ing_new2',
          quantity: 3,
          unit: 'gram',
          suggestedIngredient: {
            id: 'ing_new2',
            name: 'Pasta',
            category: 'Grains',
          },
        },
      ],
      instructions: ['Step 1'],
      servings: 4,
      prepTime: 15,
      cookTime: 15,
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

  it('should validate servings and prep/cook time are positive numbers', () => {
    const recipeData = {
      id: 'recipe_123',
      name: 'Test Recipe',
      description: 'Test',
      ingredients: [{ ingredientId: '1', quantity: 1, unit: 'cup' }],
      instructions: ['Step 1'],
      servings: -1,
      prepTime: 0,
      cookTime: 0,
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

  describe('deduplication logic', () => {
    it('should not create new ingredient when existing one has same name (case-insensitive)', () => {
      const recipeData = {
        id: 'recipe_123',
        name: 'Garlic Bread',
        description: 'Simple garlic bread',
        ingredients: [
          {
            ingredientId: 'new_garlic',
            quantity: 3,
            unit: 'clove',
            suggestedIngredient: {
              id: 'new_garlic',
              name: 'garlic', // lowercase, but matches existing "Garlic"
              category: 'Vegetables',
              // No unit - ingredients don't have units (I9.7)
            },
          },
        ],
        instructions: ['Toast bread', 'Add garlic'],
        servings: 2,
        prepTime: 5,
        cookTime: 5,
        tags: ['Quick'],
      }

      const result = validateRecipeImport(
        JSON.stringify(recipeData),
        mockIngredients
      )

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(0) // Should not add new ingredient
      expect(result.recipe?.ingredients[0].ingredientId).toBe('2') // Should use existing garlic ID
    })

    it('should not create new ingredient when name matches existing ingredient', () => {
      const recipeData = {
        id: 'recipe_123',
        name: 'Garlic Soup',
        description: 'Garlic soup recipe',
        ingredients: [
          {
            ingredientId: 'new_garlic',
            quantity: 100,
            unit: 'gram',
            suggestedIngredient: {
              id: 'new_garlic',
              name: 'Garlic', // Matches existing ingredient name
              category: 'Vegetables',
            },
          },
        ],
        instructions: ['Make soup'],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: ['Soup'],
      }

      const result = validateRecipeImport(
        JSON.stringify(recipeData),
        mockIngredients
      )

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(0) // Should not add new ingredient (name matches)
      expect(result.recipe?.ingredients[0].ingredientId).toBe('2') // Should use existing Garlic ID
    })

    it('should handle multiple ingredients with some matching and some new', () => {
      const recipeData = {
        id: 'recipe_123',
        name: 'Mixed Recipe',
        description: 'Mix of existing and new',
        ingredients: [
          { ingredientId: '1', quantity: 2, unit: 'cup' }, // Existing Spaghetti
          {
            ingredientId: 'suggested_basil',
            quantity: 1,
            unit: 'tablespoon',
            suggestedIngredient: {
              id: 'suggested_basil',
              name: 'BASIL', // uppercase, but matches existing "Basil" by name
              category: 'Herbs & Spices',
            },
          },
          {
            ingredientId: 'new_tomato',
            quantity: 4,
            unit: 'whole',
            suggestedIngredient: {
              id: 'new_tomato',
              name: 'Tomato', // truly new
              category: 'Vegetables',
            },
          },
        ],
        instructions: ['Mix everything'],
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        tags: ['Fresh'],
      }

      const result = validateRecipeImport(
        JSON.stringify(recipeData),
        mockIngredients
      )

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(1) // Only tomato is new
      expect(result.newIngredients[0].name).toBe('Tomato')
      expect(result.recipe?.ingredients[0].ingredientId).toBe('1') // Spaghetti unchanged
      expect(result.recipe?.ingredients[1].ingredientId).toBe('3') // Basil remapped to existing ID
      expect(result.recipe?.ingredients[2].ingredientId).toBe('new_tomato') // Tomato keeps new ID
    })

    it('should preserve displayName when remapping to existing ingredient', () => {
      const recipeData = {
        id: 'recipe_123',
        name: 'Recipe with Display Names',
        description: 'Test display names',
        ingredients: [
          {
            ingredientId: 'suggested_garlic',
            quantity: 2,
            unit: 'clove',
            displayName: 'fresh garlic cloves',
            suggestedIngredient: {
              id: 'suggested_garlic',
              name: 'Garlic',
              category: 'Vegetables',
            },
          },
        ],
        instructions: ['Use garlic'],
        servings: 2,
        prepTime: 5,
        cookTime: 5,
        tags: [],
      }

      const result = validateRecipeImport(
        JSON.stringify(recipeData),
        mockIngredients
      )

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(0)
      expect(result.recipe?.ingredients[0].ingredientId).toBe('2') // Remapped to existing garlic
      expect(result.recipe?.ingredients[0].displayName).toBe(
        'fresh garlic cloves'
      ) // Display name preserved
    })

    it('should handle case variations correctly (mixed case)', () => {
      const recipeData = {
        id: 'recipe_123',
        name: 'Test Case Sensitivity',
        description: 'Testing case',
        ingredients: [
          {
            ingredientId: 'new_spaghetti',
            quantity: 1,
            unit: 'cup',
            suggestedIngredient: {
              id: 'new_spaghetti',
              name: 'SPAGHETTI', // Mixed case
              category: 'Grains',
            },
          },
        ],
        instructions: ['Use spaghetti'],
        servings: 1,
        prepTime: 3,
        cookTime: 2,
        tags: [],
      }

      const result = validateRecipeImport(
        JSON.stringify(recipeData),
        mockIngredients
      )

      expect(result.isValid).toBe(true)
      expect(result.newIngredients).toHaveLength(0) // Should match existing "Spaghetti"
      expect(result.recipe?.ingredients[0].ingredientId).toBe('1') // Remapped to existing
    })
  })
})
