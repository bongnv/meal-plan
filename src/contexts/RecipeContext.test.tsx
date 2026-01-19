import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { RecipeProvider, useRecipes } from './RecipeContext'
import { Recipe, RecipeInput, RecipeIngredient } from '../types/recipe'
import { RecipeStorageService } from '../utils/storage/RecipeStorage'

// Mock the storage service
vi.mock('../utils/storage/RecipeStorage')

describe('RecipeContext', () => {
  let mockStorageService: {
    loadRecipes: ReturnType<typeof vi.fn<[], Recipe[]>>
    saveRecipes: ReturnType<typeof vi.fn<[Recipe[]], void>>
    generateId: ReturnType<typeof vi.fn<[], string>>
  }

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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  })

  beforeEach(() => {
    mockStorageService = {
      loadRecipes: vi.fn(),
      saveRecipes: vi.fn(),
      generateId: vi.fn(() => 'generated-id'),
    }

    vi.mocked(RecipeStorageService).mockImplementation(
      () => mockStorageService as unknown as RecipeStorageService
    )
  })

  describe('initialization', () => {
    it('should load recipes on mount', async () => {
      const mockRecipes = [
        createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' }),
        createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' }),
      ]
      mockStorageService.loadRecipes.mockReturnValue(mockRecipes)

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      // Wait for recipes to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.recipes).toEqual(mockRecipes)
      expect(mockStorageService.loadRecipes).toHaveBeenCalledOnce()
    })

    it('should handle empty recipe list', async () => {
      mockStorageService.loadRecipes.mockReturnValue([])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.recipes).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should handle loading errors', async () => {
      mockStorageService.loadRecipes.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.recipes).toEqual([])
      expect(result.current.error).toBe('Failed to load recipes')
    })
  })

  describe('getRecipeById', () => {
    it('should return recipe by id from in-memory state', async () => {
      const mockRecipes = [
        createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' }),
        createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' }),
      ]
      mockStorageService.loadRecipes.mockReturnValue(mockRecipes)

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const recipe = result.current.getRecipeById('recipe-2')
      expect(recipe).toBeTruthy()
      expect(recipe?.name).toBe('Recipe 2')
    })

    it('should return null when recipe not found', async () => {
      mockStorageService.loadRecipes.mockReturnValue([])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const recipe = result.current.getRecipeById('non-existent')
      expect(recipe).toBeNull()
    })
  })

  describe('addRecipe', () => {
    it('should add new recipe to state and persist', async () => {
      mockStorageService.loadRecipes.mockReturnValue([])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newRecipe: RecipeInput = {
        name: 'New Recipe',
        description: 'A new recipe',
        ingredients: [{ ingredientId: 'ing-1', quantity: 500 }],
        instructions: ['Step 1'],
        servings: 2,
        totalTime: 15,
        tags: ['new'],
      }

      act(() => {
        result.current.addRecipe(newRecipe)
      })

      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0].id).toBe('generated-id')
      expect(result.current.recipes[0].name).toBe('New Recipe')
      expect(result.current.recipes[0].createdAt).toBeTruthy()
      expect(result.current.recipes[0].updatedAt).toBeTruthy()
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith(
        result.current.recipes
      )
    })

    it('should add recipe to existing list', async () => {
      const existingRecipe = createMockRecipe({ id: 'recipe-1' })
      mockStorageService.loadRecipes.mockReturnValue([existingRecipe])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newRecipe: RecipeInput = {
        name: 'Second Recipe',
        description: 'Another recipe',
        ingredients: [],
        instructions: [],
        servings: 1,
        totalTime: 10,
        tags: [],
      }

      act(() => {
        result.current.addRecipe(newRecipe)
      })

      expect(result.current.recipes).toHaveLength(2)
      expect(result.current.recipes[0].id).toBe('recipe-1')
      expect(result.current.recipes[1].id).toBe('generated-id')
    })
  })

  describe('updateRecipe', () => {
    it('should update existing recipe in state and persist', async () => {
      const existingRecipe = createMockRecipe({
        id: 'recipe-1',
        name: 'Original',
        updatedAt: '2020-01-01T00:00:00.000Z',
      })
      mockStorageService.loadRecipes.mockReturnValue([existingRecipe])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedRecipe: Recipe = {
        ...existingRecipe,
        name: 'Updated Recipe',
      }

      act(() => {
        result.current.updateRecipe(updatedRecipe)
      })

      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0].name).toBe('Updated Recipe')
      expect(result.current.recipes[0].updatedAt).not.toBe(
        existingRecipe.updatedAt
      )
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith(
        result.current.recipes
      )
    })

    it('should not add recipe if id does not exist', async () => {
      const existingRecipe = createMockRecipe({ id: 'recipe-1' })
      mockStorageService.loadRecipes.mockReturnValue([existingRecipe])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const nonExistentRecipe = createMockRecipe({ id: 'recipe-999' })

      act(() => {
        result.current.updateRecipe(nonExistentRecipe)
      })

      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0].id).toBe('recipe-1')
    })
  })

  describe('deleteRecipe', () => {
    it('should delete recipe from state and persist', async () => {
      const recipe1 = createMockRecipe({ id: 'recipe-1', name: 'Recipe 1' })
      const recipe2 = createMockRecipe({ id: 'recipe-2', name: 'Recipe 2' })
      mockStorageService.loadRecipes.mockReturnValue([recipe1, recipe2])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteRecipe('recipe-1')
      })

      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0].id).toBe('recipe-2')
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith(
        result.current.recipes
      )
    })

    it('should do nothing if recipe id does not exist', async () => {
      const recipe = createMockRecipe({ id: 'recipe-1' })
      mockStorageService.loadRecipes.mockReturnValue([recipe])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteRecipe('non-existent')
      })

      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0].id).toBe('recipe-1')
    })
  })
})
