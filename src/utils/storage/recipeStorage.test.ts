import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { RecipeStorageService } from './recipeStorage'
import { generateId } from '../idGenerator'

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

    it('should return empty array if localStorage data is corrupted', () => {
      localStorage.setItem('recipes', 'invalid json')

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should return empty array if data fails Zod validation', () => {
      // Mock console.error to avoid vitest console issues
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const invalidRecipes = [
        {
          id: '1',
          name: 'Invalid Recipe',
          // missing required fields like description, ingredients, etc.
        },
      ]

      localStorage.setItem('recipes', JSON.stringify(invalidRecipes))

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
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

    it('should handle localStorage errors gracefully', () => {
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

      // Should not throw
      expect(() => service.saveRecipes(mockRecipes)).not.toThrow()
    })

    it('should save empty array', () => {
      service.saveRecipes([])

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should not save invalid recipes that fail Zod validation', () => {
      // Mock console.error to avoid vitest console issues
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const invalidRecipes = [
        {
          id: '1',
          name: 'Invalid Recipe',
          // missing required fields
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any

      service.saveRecipes(invalidRecipes)

      // Should not have been saved
      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
