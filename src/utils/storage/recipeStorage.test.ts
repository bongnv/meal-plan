import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { RecipeStorageService } from './RecipeStorage'
import { Recipe, RecipeIngredient } from '../../types/recipe'

describe('RecipeStorageService', () => {
  const STORAGE_KEY = 'recipes'
  let service: RecipeStorageService

  beforeEach(() => {
    service = new RecipeStorageService()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  const createMockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      { ingredientId: 'ing-1', quantity: 500 },
    ] as RecipeIngredient[],
    instructions: ['Step 1', 'Step 2'],
    servings: 4,
    totalTime: 30,
    tags: ['quick', 'easy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  describe('loadRecipes', () => {
    it('should return empty array when no recipes exist', () => {
      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should return all stored recipes', () => {
      const recipe1 = createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' })
      const recipe2 = createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' })

      localStorage.setItem(STORAGE_KEY, JSON.stringify([recipe1, recipe2]))

      const recipes = service.loadRecipes()
      expect(recipes).toHaveLength(2)
      expect(recipes[0].name).toBe('Recipe 1')
      expect(recipes[1].name).toBe('Recipe 2')
    })

    it('should return empty array when localStorage data is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })

    it('should return empty array when data fails Zod validation', () => {
      const invalidRecipe = { id: 'recipe-1', name: '', servings: -1 } // Invalid: empty name, negative servings
      localStorage.setItem(STORAGE_KEY, JSON.stringify([invalidRecipe]))

      const recipes = service.loadRecipes()
      expect(recipes).toEqual([])
    })
  })

  describe('saveRecipes', () => {
    it('should save recipes to localStorage', () => {
      const recipe1 = createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' })
      const recipe2 = createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' })

      service.saveRecipes([recipe1, recipe2])

      const data = localStorage.getItem(STORAGE_KEY)
      expect(data).toBeTruthy()

      const parsed = JSON.parse(data!)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('Recipe 1')
      expect(parsed[1].name).toBe('Recipe 2')
    })

    it('should save empty array', () => {
      service.saveRecipes([])

      const data = localStorage.getItem(STORAGE_KEY)
      expect(data).toBe('[]')
    })

    it('should overwrite existing data', () => {
      const recipe1 = createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' })
      const recipe2 = createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' })

      service.saveRecipes([recipe1])
      service.saveRecipes([recipe2])

      const recipes = service.loadRecipes()
      expect(recipes).toHaveLength(1)
      expect(recipes[0].name).toBe('Recipe 2')
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = service.generateId()
      const id2 = service.generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate ids with recipe prefix', () => {
      const id = service.generateId()
      expect(id).toMatch(/^recipe-/)
    })
  })

  describe('error handling', () => {
    it('should handle localStorage quota exceeded error', () => {
      const hugeRecipe = createMockRecipe({
        description: 'x'.repeat(10_000_000), // Very large string
      })

      // This should not throw, but handle the error gracefully
      expect(() => service.saveRecipes([hugeRecipe])).not.toThrow()
    })
  })
})
