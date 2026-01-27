import { describe, expect, it } from 'vitest'

import {
  migrateRecipes,
  migrateRecipeSubRecipes,
  migrateRecipeTime,
} from './recipeMigration'

import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

describe('migrateRecipes', () => {
  const mockIngredients: Ingredient[] = []

  describe('Recipe ingredient unit migration', () => {
    it('should add unit to recipe ingredients that are missing it', () => {
      const oldRecipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 400 }, // Missing unit
            { ingredientId: '2', quantity: 2 }, // Missing unit
          ],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      const migrated = migrateRecipes(oldRecipes, mockIngredients)

      expect(migrated[0].ingredients[0]).toEqual({
        ingredientId: '1',
        quantity: 400,
        unit: 'piece', // Default fallback (ingredients don't have units)
      })
      expect(migrated[0].ingredients[1]).toEqual({
        ingredientId: '2',
        quantity: 2,
        unit: 'piece', // Default fallback (ingredients don't have units)
      })
    })

    it('should preserve existing units in recipe ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 2, unit: 'cup' }, // Already has unit (different from library)
          ],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      // Should preserve the existing unit (cup), not override with library unit (gram)
      expect(migrated[0].ingredients[0].unit).toBe('cup')
    })

    it('should use "piece" as fallback when ingredient not found in library', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: 'unknown', quantity: 2 }, // Ingredient not in library
          ],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      expect(migrated[0].ingredients[0].unit).toBe('piece')
    })

    it('should handle recipes with no ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      expect(migrated[0].ingredients).toEqual([])
    })

    it('should preserve displayName when present', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            {
              ingredientId: '1',
              quantity: 400,
              displayName: 'boneless chicken',
            },
          ],
          subRecipes: [],
          instructions: ['Cook it'],
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      expect(migrated[0].ingredients[0]).toEqual({
        ingredientId: '1',
        quantity: 400,
        unit: 'piece', // Migration adds default unit
        displayName: 'boneless chicken',
      })
    })

    it('should handle empty recipes array', () => {
      const migrated = migrateRecipes([], mockIngredients)
      expect(migrated).toEqual([])
    })

    it('should preserve all other recipe properties', () => {
      const now = Date.now()
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'A delicious test',
          servings: 4,
          prepTime: 30,
          cookTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 400 }],
          instructions: ['Step 1', 'Step 2'],
          subRecipes: [],
          tags: [],
          imageUrl: 'https://example.com/image.jpg',
          createdAt: now,
          updatedAt: now,
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      expect(migrated[0]).toMatchObject({
        id: 'r1',
        name: 'Test Recipe',
        description: 'A delicious test',
        servings: 4,
        prepTime: 30,
        cookTime: 30,
        instructions: ['Step 1', 'Step 2'],
        tags: [],
        imageUrl: 'https://example.com/image.jpg',
        createdAt: now,
        updatedAt: now,
      })
    })

    it('should not mutate original recipes array', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [{ ingredientId: '1', quantity: 400 }],
          subRecipes: [],
          instructions: ['Cook it'],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const original = JSON.parse(JSON.stringify(recipes))
      migrateRecipes(recipes, mockIngredients)

      // Original should be unchanged
      expect(recipes).toEqual(original)
    })
  })

  describe('migrateRecipeSubRecipes', () => {
    it('should add empty subRecipes array to recipes missing it', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 400, unit: 'gram' as const },
          ],
          instructions: ['Cook it'],
          tags: [],
          subRecipes: [],
          // subRecipes is missing (old schema)
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as Recipe[]

      const migrated = migrateRecipeSubRecipes(recipes)

      expect(migrated[0].subRecipes).toEqual([])
    })

    it('should preserve existing subRecipes array', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          subRecipes: [{ recipeId: 'r2', servings: 1 }],
          instructions: ['Cook it'],
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      const migrated = migrateRecipeSubRecipes(recipes)

      expect(migrated[0].subRecipes).toEqual([{ recipeId: 'r2', servings: 1 }])
    })

    it('should handle empty recipes array', () => {
      const migrated = migrateRecipeSubRecipes([])
      expect(migrated).toEqual([])
    })

    it('should not mutate original recipes array', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 400, unit: 'gram' as const },
          ],
          instructions: ['Cook it'],
          tags: [],
          subRecipes: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ] as Recipe[]

      const original = JSON.parse(JSON.stringify(recipes))
      migrateRecipeSubRecipes(recipes)

      // Original should be unchanged
      expect(recipes).toEqual(original)
    })
  })

  describe('migrateRecipeTime', () => {
    it('should preserve existing prepTime and cookTime', () => {
      const recipes: Recipe[] = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          prepTime: 10,
          cookTime: 20,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const migrated = migrateRecipeTime(recipes)

      expect(migrated[0].prepTime).toBe(10)
      expect(migrated[0].cookTime).toBe(20)
    })

    it('should split totalTime 50/50 when prepTime and cookTime are missing', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          totalTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any[]

      const migrated = migrateRecipeTime(recipes)

      expect(migrated[0].prepTime).toBe(15) // Math.ceil(30 / 2)
      expect(migrated[0].cookTime).toBe(15) // Math.floor(30 / 2)
    })

    it('should give extra minute to prepTime for odd totalTime', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          totalTime: 25,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any[]

      const migrated = migrateRecipeTime(recipes)

      expect(migrated[0].prepTime).toBe(13) // Math.ceil(25 / 2)
      expect(migrated[0].cookTime).toBe(12) // Math.floor(25 / 2)
    })

    it('should default to 0 when neither prepTime/cookTime nor totalTime exist', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any[]

      const migrated = migrateRecipeTime(recipes)

      expect(migrated[0].prepTime).toBe(0)
      expect(migrated[0].cookTime).toBe(0)
    })

    it('should handle empty recipes array', () => {
      const migrated = migrateRecipeTime([])
      expect(migrated).toEqual([])
    })

    it('should not mutate original recipes array', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          description: 'Test',
          servings: 2,
          totalTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 400, unit: 'gram' }],
          instructions: ['Cook it'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any[]

      const original = JSON.parse(JSON.stringify(recipes))
      migrateRecipeTime(recipes)

      // Original should be unchanged
      expect(recipes).toEqual(original)
    })

    it('should handle recipes with totalTime of 1', () => {
      const recipes = [
        {
          id: 'r1',
          name: 'Quick Recipe',
          description: 'Very fast',
          servings: 1,
          totalTime: 1,
          ingredients: [{ ingredientId: '1', quantity: 1, unit: 'piece' }],
          instructions: ['Quick'],
          subRecipes: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ] as any[]

      const migrated = migrateRecipeTime(recipes)

      expect(migrated[0].prepTime).toBe(1) // Math.ceil(1 / 2)
      expect(migrated[0].cookTime).toBe(0) // Math.floor(1 / 2)
    })
  })
})
