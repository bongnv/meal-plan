import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { generateId } from '../idGenerator'

import { RecipeStorageService } from './recipeStorage'

import type { Recipe } from '../../types/recipe'

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
          ingredients: [{ ingredientId: 'ing1', quantity: 2 }],
          instructions: ['Step 1'],
          servings: 4,
          totalTime: 30,
          tags: ['dinner'],
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
          instructions: ['Step 1'],
          servings: 4,
          totalTime: 30,
          tags: ['dinner'],
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
          instructions: [],
          servings: 2,
          totalTime: 15,
          tags: [],
        },
      ]

      const newRecipes: Recipe[] = [
        {
          id: '2',
          name: 'New Recipe',
          description: 'New',
          ingredients: [],
          instructions: [],
          servings: 4,
          totalTime: 30,
          tags: [],
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
          instructions: [],
          servings: 2,
          totalTime: 15,
          tags: [],
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
          ingredients: [
            { ingredientId: 'ing1', quantity: 2 },
            { ingredientId: 'ing2', quantity: 1 },
          ],
          instructions: ['Step 1'],
          servings: 4,
          totalTime: 30,
          tags: ['dinner'],
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
            { ingredientId: 'ing1', quantity: 2, displayName: 'chicken' },
            { ingredientId: 'ing2', quantity: 1, displayName: 'tomatoes' },
          ],
          instructions: ['Step 1'],
          servings: 4,
          totalTime: 30,
          tags: ['dinner'],
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
            { ingredientId: 'ing1', quantity: 2, displayName: 'chicken' },
          ],
          instructions: ['Step 1'],
          servings: 4,
          totalTime: 30,
          tags: ['dinner'],
        },
        {
          id: '2',
          name: 'Recipe without displayName',
          description: 'No custom names',
          ingredients: [{ ingredientId: 'ing2', quantity: 1 }],
          instructions: ['Step 1'],
          servings: 2,
          totalTime: 15,
          tags: ['lunch'],
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
        instructions: ['Step 1'],
        servings: 4,
        totalTime: 30,
        tags: [],
      }

      service.saveRecipes([recipe])
      const loaded = service.loadRecipes()

      expect(loaded[0].ingredients[0].displayName).toBe('olive oil')
      expect(loaded[0].ingredients[1].displayName).toBeUndefined()
      expect(loaded[0].ingredients[2].displayName).toBe('pasta')
    })
  })
})
