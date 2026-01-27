import { describe, expect, it } from 'vitest'

import { migrateRecipes } from './recipeMigration'

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
          totalTime: 30,
          ingredients: [
            { ingredientId: '1', quantity: 400 }, // Missing unit
            { ingredientId: '2', quantity: 2 }, // Missing unit
          ],
          instructions: ['Cook it'],
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
          totalTime: 30,
          ingredients: [
            { ingredientId: '1', quantity: 2, unit: 'cup' }, // Already has unit (different from library)
          ],
          instructions: ['Cook it'],
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
          totalTime: 30,
          ingredients: [
            { ingredientId: 'unknown', quantity: 2 }, // Ingredient not in library
          ],
          instructions: ['Cook it'],
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
          totalTime: 30,
          ingredients: [],
          instructions: ['Cook it'],
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
          totalTime: 30,
          ingredients: [
            {
              ingredientId: '1',
              quantity: 400,
              displayName: 'boneless chicken',
            },
          ],
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
          totalTime: 60,
          ingredients: [{ ingredientId: '1', quantity: 400 }],
          instructions: ['Step 1', 'Step 2'],
          tags: ['quick', 'easy'],
          imageUrl: 'https://example.com/image.jpg',
        },
      ]

      const migrated = migrateRecipes(recipes, mockIngredients)

      expect(migrated[0]).toMatchObject({
        id: 'r1',
        name: 'Test Recipe',
        description: 'A delicious test',
        servings: 4,
        totalTime: 60,
        instructions: ['Step 1', 'Step 2'],
        tags: ['quick', 'easy'],
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
          totalTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 400 }],
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
})
