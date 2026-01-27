import { describe, expect, it } from 'vitest'

import { migrateRecipes, migrateRecipeSubRecipes } from './recipeMigration'

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
          // subRecipes is missing (old schema)
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
        },
      ] as Recipe[]

      const original = JSON.parse(JSON.stringify(recipes))
      migrateRecipeSubRecipes(recipes)

      // Original should be unchanged
      expect(recipes).toEqual(original)
    })
  })
})
