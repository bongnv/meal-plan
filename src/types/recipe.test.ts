import { describe, expect, it } from 'vitest'

import { RecipeIngredientSchema, RecipeSchema, SubRecipeSchema } from './recipe'

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
      ingredients: [
        {
          ingredientId: 'ingredient-123',
          quantity: 2.5,
        },
      ],
      instructions: ['Step 1', 'Step 2'],
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

describe('SubRecipe Types', () => {
  describe('SubRecipeSchema', () => {
    it('should validate SubRecipe with all required fields', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: 2,
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          recipeId: 'recipe-456',
          servings: 2,
        })
      }
    })

    it('should validate SubRecipe with optional displayName', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: 1.5,
        displayName: 'Cilantro Rice (Filling)',
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          recipeId: 'recipe-456',
          servings: 1.5,
          displayName: 'Cilantro Rice (Filling)',
        })
      }
    })

    it('should validate SubRecipe with fractional quantity', () => {
      const subRecipe = {
        recipeId: 'recipe-789',
        servings: 0.5,
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.servings).toBe(0.5)
      }
    })

    it('should reject SubRecipe with missing recipeId', () => {
      const subRecipe = {
        servings: 2,
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
    })

    it('should reject SubRecipe with missing quantity', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
    })

    it('should reject SubRecipe with zero quantity', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: 0,
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Servings must be positive')
      }
    })

    it('should reject SubRecipe with negative quantity', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: -1,
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Servings must be positive')
      }
    })

    it('should reject SubRecipe with invalid quantity type', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: '2', // string instead of number
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
    })

    it('should reject SubRecipe with invalid displayName type', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: 2,
        displayName: 123, // number instead of string
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(false)
    })

    it('should validate SubRecipe with empty string displayName', () => {
      const subRecipe = {
        recipeId: 'recipe-456',
        servings: 2,
        displayName: '',
      }

      const result = SubRecipeSchema.safeParse(subRecipe)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.displayName).toBe('')
      }
    })
  })
})

describe('Recipe with SubRecipes', () => {
  const validRecipe = {
    id: 'recipe-123',
    name: 'Burrito Bowl',
    description: 'Delicious burrito bowl',
    ingredients: [
      {
        ingredientId: 'ingredient-1',
        quantity: 2,
        unit: 'cup',
      },
    ],
    instructions: ['Step 1', 'Step 2'],
    servings: 4,
    prepTime: 15,
    cookTime: 20,
    tags: ['mexican', 'bowl'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  it('should validate Recipe with subRecipes array', () => {
    const recipe = {
      ...validRecipe,
      subRecipes: [
        {
          recipeId: 'recipe-456',
          servings: 1,
        },
        {
          recipeId: 'recipe-789',
          servings: 0.5,
          displayName: 'Black Beans (Topup)',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const result = RecipeSchema.safeParse(recipe)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.subRecipes).toHaveLength(2)
      expect(result.data.subRecipes[0].recipeId).toBe('recipe-456')
      expect(result.data.subRecipes[1].displayName).toBe('Black Beans (Topup)')
    }
  })

  it('should validate Recipe without subRecipes (backward compatible)', () => {
    const recipe = { ...validRecipe }

    const result = RecipeSchema.safeParse(recipe)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.subRecipes).toEqual([]) // defaults to empty array
    }
  })

  it('should validate Recipe with empty subRecipes array', () => {
    const recipe = {
      ...validRecipe,
      subRecipes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const result = RecipeSchema.safeParse(recipe)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.subRecipes).toEqual([])
    }
  })

  it('should reject Recipe with invalid subRecipe (missing recipeId)', () => {
    const recipe = {
      ...validRecipe,
      subRecipes: [
        {
          servings: 2, // missing recipeId
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const result = RecipeSchema.safeParse(recipe)

    expect(result.success).toBe(false)
  })

  it('should reject Recipe with invalid subRecipe (zero quantity)', () => {
    const recipe = {
      ...validRecipe,
      subRecipes: [
        {
          recipeId: 'recipe-456',
          servings: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const result = RecipeSchema.safeParse(recipe)

    expect(result.success).toBe(false)
  })
})
