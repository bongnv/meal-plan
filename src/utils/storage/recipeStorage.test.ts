import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { generateId } from '../idGenerator'

import { RecipeStorageService } from './recipeStorage'

import type { Recipe, SubRecipe } from '../../types/recipe'

describe('RecipeStorageService', () => {
  let service: RecipeStorageService

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    service = new RecipeStorageService()
  })

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks()
  })

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs in the format of timestamp-random', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('loadRecipes', () => {
    it('should return an empty array when no recipes are stored', () => {
      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should load recipes from localStorage', () => {
      const mockRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'A test recipe',
          ingredients: [{ ingredientId: 'ing1', quantity: 400, unit: 'gram' }],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(mockRecipes))

      const recipes = service.loadRecipes()
      expect(recipes).toEqual(mockRecipes)
    })

    it('should throw error if localStorage data is corrupted', () => {
      localStorage.setItem('recipes', 'invalid json')

      expect(() => service.loadRecipes()).toThrow()
    })

    it('should throw error if data fails Zod validation', () => {
      const invalidRecipes = [
        {
          id: '1',
          name: 'Invalid Recipe',
          // missing required fields like description, ingredients, etc.
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(invalidRecipes))

      expect(() => service.loadRecipes()).toThrow()
    })

    it('should throw error when localStorage.getItem throws', () => {
      // Mock localStorage.getItem to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      expect(() => service.loadRecipes()).toThrow('localStorage error')
    })
  })

  describe('saveRecipes', () => {
    it('should save recipes to localStorage', () => {
      const mockRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'A test recipe',
          ingredients: [{ ingredientId: 'ing1', quantity: 2 }],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      service.saveRecipes(mockRecipes)

      const stored = localStorage.getItem('recipes')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(mockRecipes)
    })

    it('should overwrite existing recipes', () => {
      const initialRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Initial Recipe',
          description: 'Initial',
          ingredients: [],
          subRecipes: [],
          instructions: [],
          servings: 2,
          prepTime: 8,
          cookTime: 7,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const newRecipes: Recipe[] = [
        {
          id: '2',
          name: 'New Recipe',
          description: 'New',
          ingredients: [],
          subRecipes: [],
          instructions: [],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      service.saveRecipes(initialRecipes)
      service.saveRecipes(newRecipes)

      const recipes = service.loadRecipes()
      expect(recipes).toEqual(newRecipes)
      expect(recipes).not.toEqual(initialRecipes)
    })

    it('should throw error when localStorage.setItem throws', () => {
      // Mock localStorage.setItem to throw an error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const mockRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [],
          subRecipes: [],
          instructions: [],
          servings: 2,
          prepTime: 8,
          cookTime: 7,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      expect(() => service.saveRecipes(mockRecipes)).toThrow(
        'localStorage error'
      )
    })

    it('should save empty array', () => {
      service.saveRecipes([])

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should throw error when saving invalid recipes that fail Zod validation', () => {
      const invalidRecipes = [
        {
          id: '1',
          name: 'Invalid Recipe',
          // missing required fields
        },
      ] as any

      expect(() => service.saveRecipes(invalidRecipes)).toThrow()
    })
  })

  describe('displayName support', () => {
    it('should load old recipes without displayName (backward compatibility)', () => {
      const oldRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Old Recipe',
          description: 'Recipe without displayName',
          ingredients: [{ ingredientId: 'ing1', quantity: 400, unit: 'gram' }],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(oldRecipes))

      const recipes = service.loadRecipes()
      expect(recipes).toEqual(oldRecipes)
      expect(recipes[0].ingredients[0].displayName).toBeUndefined()
    })

    it('should save and load recipes with displayName', () => {
      const recipesWithDisplayName: Recipe[] = [
        {
          id: '1',
          name: 'New Recipe',
          description: 'Recipe with displayName',
          ingredients: [
            {
              ingredientId: 'ing1',
              quantity: 400,
              unit: 'gram',
              displayName: 'chicken',
            },
            {
              ingredientId: 'ing2',
              quantity: 2,
              unit: 'cup',
              displayName: 'tomatoes',
            },
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      service.saveRecipes(recipesWithDisplayName)

      const recipes = service.loadRecipes()
      expect(recipes).toEqual(recipesWithDisplayName)
      expect(recipes[0].ingredients[0].displayName).toBe('chicken')
      expect(recipes[0].ingredients[1].displayName).toBe('tomatoes')
    })

    it('should handle mixed recipes with and without displayName', () => {
      const mixedRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Recipe with displayName',
          description: 'Has custom names',
          ingredients: [
            {
              ingredientId: 'ing1',
              quantity: 400,
              unit: 'gram',
              displayName: 'chicken',
            },
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
        {
          id: '2',
          name: 'Recipe without displayName',
          description: 'No custom names',
          ingredients: [{ ingredientId: 'ing2', quantity: 2, unit: 'cup' }],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 2,
          prepTime: 8,
          cookTime: 7,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      service.saveRecipes(mixedRecipes)

      const recipes = service.loadRecipes()
      expect(recipes).toEqual(mixedRecipes)
      expect(recipes[0].ingredients[0].displayName).toBe('chicken')
      expect(recipes[1].ingredients[0].displayName).toBeUndefined()
    })

    it('should preserve displayName through save/load cycle', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test',
        ingredients: [
          { ingredientId: 'ing1', quantity: 2, displayName: 'olive oil' },
          { ingredientId: 'ing2', quantity: 1 }, // no displayName
          { ingredientId: 'ing3', quantity: 3, displayName: 'pasta' },
        ],
        subRecipes: [],
        instructions: ['Step 1'],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: [],
        createdAt: 1640000000000,
        updatedAt: 1640000000000,
      }

      service.saveRecipes([recipe])
      const loaded = service.loadRecipes()

      expect(loaded[0].ingredients[0].displayName).toBe('olive oil')
      expect(loaded[0].ingredients[1].displayName).toBeUndefined()
      expect(loaded[0].ingredients[2].displayName).toBe('pasta')
    })
  })

  describe('Migration on load', () => {
    it('should apply migration when loading recipes without units', () => {
      const mockIngredients: any[] = []

      const oldRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [
            { ingredientId: 'ing1', quantity: 400 }, // Missing unit
            { ingredientId: 'ing2', quantity: 2 }, // Missing unit
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(oldRecipes))

      const loaded = service.loadRecipes(mockIngredients)

      // Should have units added via migration (defaults to 'piece')
      expect(loaded[0].ingredients[0]).toEqual({
        ingredientId: 'ing1',
        quantity: 400,
        unit: 'piece',
      })
      expect(loaded[0].ingredients[1]).toEqual({
        ingredientId: 'ing2',
        quantity: 2,
        unit: 'piece',
      })
    })

    it('should preserve existing units when loading recipes', () => {
      const mockIngredients: any[] = []

      const recipesWithUnits: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [
            { ingredientId: 'ing1', quantity: 2, unit: 'cup' }, // Already has unit (different from library)
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(recipesWithUnits))

      const loaded = service.loadRecipes(mockIngredients)

      // Should preserve existing unit, not override with library unit
      expect(loaded[0].ingredients[0].unit).toBe('cup')
    })

    it('should use "piece" fallback for unknown ingredients during migration', () => {
      const mockIngredients: any[] = []

      const recipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [
            { ingredientId: 'unknown', quantity: 2 }, // Unknown ingredient
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(recipes))

      const loaded = service.loadRecipes(mockIngredients)

      // Should use 'piece' as fallback
      expect(loaded[0].ingredients[0].unit).toBe('piece')
    })

    it('should work when no ingredients provided to loadRecipes', () => {
      const recipes: Recipe[] = [
        {
          id: '1',
          name: 'Test Recipe',
          description: 'Test',
          ingredients: [
            { ingredientId: 'ing1', quantity: 400 }, // Missing unit
          ],
          subRecipes: [],
          instructions: ['Step 1'],
          servings: 4,
          prepTime: 15,
          cookTime: 15,
          tags: [],
          createdAt: 1640000000000,
          updatedAt: 1640000000000,
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(recipes))

      const loaded = service.loadRecipes() // No ingredients provided

      // Should use 'piece' as fallback since no ingredients available
      expect(loaded[0].ingredients[0].unit).toBe('piece')
    })
  })

  describe('Sub-Recipes Support', () => {
    it('should save and load recipe with subRecipes array', () => {
      const subRecipe: SubRecipe = {
        recipeId: 'sauce_recipe_id',
        servings: 2,
        displayName: 'Cilantro Sauce',
      }

      const recipeWithSubRecipes: Recipe = {
        id: 'burrito_bowl_id',
        name: 'Burrito Bowl',
        description: 'Bowl with rice and beans',
        servings: 4,
        prepTime: 10,
        cookTime: 15,
        ingredients: [
          { ingredientId: 'beans_id', quantity: 200, unit: 'gram' },
        ],
        instructions: ['Add beans', 'Cook rice'],
        tags: ['mexican', 'bowl'],
        subRecipes: [subRecipe],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      service.saveRecipes([recipeWithSubRecipes])
      const loaded = service.loadRecipes()[0]

      expect(loaded.subRecipes).toBeDefined()
      expect(loaded.subRecipes).toHaveLength(1)
      expect(loaded.subRecipes[0]).toEqual(subRecipe)
      expect(loaded.subRecipes[0].displayName).toBe('Cilantro Sauce')
    })

    it('should preserve subRecipes array order', () => {
      const subRecipes: SubRecipe[] = [
        { recipeId: 'recipe_1', servings: 1 },
        { recipeId: 'recipe_2', servings: 2 },
        { recipeId: 'recipe_3', servings: 3 },
      ]

      const recipe: Recipe = {
        id: 'main_recipe_id',
        name: 'Main Recipe',
        description: 'Recipe with multiple sub-recipes',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 100, unit: 'gram' },
        ],
        instructions: ['Cook'],
        tags: [],
        subRecipes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      service.saveRecipes([recipe])
      const loaded = service.loadRecipes()[0]

      expect(loaded.subRecipes).toHaveLength(3)
      expect(loaded.subRecipes[0].recipeId).toBe('recipe_1')
      expect(loaded.subRecipes[1].recipeId).toBe('recipe_2')
      expect(loaded.subRecipes[2].recipeId).toBe('recipe_3')
    })

    it('should handle recipes without subRecipes (backward compatibility)', () => {
      const recipeWithoutSubRecipes: Recipe = {
        id: 'old_recipe_id',
        name: 'Old Recipe',
        description: 'Recipe without sub-recipes',
        servings: 2,
        prepTime: 5,
        cookTime: 10,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 50, unit: 'gram' },
        ],
        instructions: ['Cook'],
        tags: [],
        subRecipes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      service.saveRecipes([recipeWithoutSubRecipes])
      const loaded = service.loadRecipes()[0]

      expect(loaded.subRecipes).toBeDefined()
      expect(loaded.subRecipes).toEqual([])
    })

    it('should load old recipes without subRecipes field and add empty array', () => {
      // Simulate old recipe data without subRecipes field
      const oldRecipeData = {
        id: 'old_recipe_id',
        name: 'Old Recipe',
        description: 'Recipe without sub-recipes field',
        servings: 2,
        prepTime: 5,
        cookTime: 10,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 50, unit: 'gram' },
        ],
        instructions: ['Cook'],
        tags: [],
        // No subRecipes field - simulating old schema
      }

      localStorage.setItem('recipes', JSON.stringify([oldRecipeData]))

      const loaded = service.loadRecipes()

      expect(loaded).toHaveLength(1)
      expect(loaded[0].subRecipes).toBeDefined()
      expect(loaded[0].subRecipes).toEqual([])
    })

    it('should save and load multiple recipes with different subRecipes counts', () => {
      const recipe1: Recipe = {
        id: 'recipe_1',
        name: 'Recipe with sub-recipes',
        description: 'Has sub-recipes',
        servings: 2,
        prepTime: 10,
        cookTime: 10,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 100, unit: 'gram' },
        ],
        instructions: ['Cook'],
        tags: [],
        subRecipes: [
          { recipeId: 'sub_1', servings: 1 },
          { recipeId: 'sub_2', servings: 2 },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const recipe2: Recipe = {
        id: 'recipe_2',
        name: 'Recipe without sub-recipes',
        description: 'No sub-recipes',
        servings: 1,
        prepTime: 5,
        cookTime: 5,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 50, unit: 'gram' },
        ],
        instructions: ['Cook'],
        tags: [],
        subRecipes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      service.saveRecipes([recipe1, recipe2])

      const loaded = service.loadRecipes()

      expect(loaded).toHaveLength(2)
      expect(loaded[0].subRecipes).toHaveLength(2)
      expect(loaded[1].subRecipes).toHaveLength(0)
    })
  })
})
