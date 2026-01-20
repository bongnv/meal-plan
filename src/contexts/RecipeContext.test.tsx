import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { RecipeProvider, useRecipes } from './RecipeContext'
import { RecipeStorageService } from '../utils/storage/recipeStorage'
import * as idGenerator from '../utils/idGenerator'

import type { Recipe } from '../types/recipe'

// Mock the storage service and ID generator
vi.mock('../utils/storage/recipeStorage')
vi.mock('../utils/idGenerator')

describe('RecipeContext', () => {
  let mockStorageService: {
    loadRecipes: ReturnType<typeof vi.fn>
    saveRecipes: ReturnType<typeof vi.fn>
  }

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Test Recipe 1',
      description: 'Description 1',
      ingredients: [{ ingredientId: 'ing1', quantity: 2 }],
      instructions: ['Step 1'],
      servings: 4,
      totalTime: 30,
      tags: ['dinner'],
    },
    {
      id: '2',
      name: 'Test Recipe 2',
      description: 'Description 2',
      ingredients: [{ ingredientId: 'ing2', quantity: 1 }],
      instructions: ['Step 1', 'Step 2'],
      servings: 2,
      totalTime: 15,
      tags: ['lunch'],
    },
  ]

  beforeEach(() => {
    mockStorageService = {
      loadRecipes: vi.fn().mockReturnValue(mockRecipes),
      saveRecipes: vi.fn(),
    }

    vi.mocked(RecipeStorageService).mockImplementation(
      () => mockStorageService as unknown as RecipeStorageService
    )

    vi.mocked(idGenerator.generateId).mockReturnValue('new-id-123')
  })

  describe('Provider initialization', () => {
    it('should load recipes on mount', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      // Wait for recipes to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.recipes).toEqual(mockRecipes)
      expect(mockStorageService.loadRecipes).toHaveBeenCalledTimes(1)
    })

    it('should handle empty recipes list', async () => {
      mockStorageService.loadRecipes.mockReturnValue([])

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.recipes).toEqual([])
    })

    it('should handle loading errors', async () => {
      mockStorageService.loadRecipes.mockImplementation(() => {
        throw new Error('Load error')
      })

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load recipes')
      expect(result.current.recipes).toEqual([])
    })
  })

  describe('getRecipeById', () => {
    it('should return recipe by id from in-memory state', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const recipe = result.current.getRecipeById('1')
      expect(recipe).toEqual(mockRecipes[0])
    })

    it('should return undefined for non-existent id', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const recipe = result.current.getRecipeById('non-existent')
      expect(recipe).toBeUndefined()
    })
  })

  describe('addRecipe', () => {
    it('should add recipe to in-memory state and persist', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'New Recipe',
        description: 'New Description',
        ingredients: [],
        instructions: ['Step 1'],
        servings: 3,
        totalTime: 20,
        tags: ['snack'],
      }

      act(() => {
        result.current.addRecipe(newRecipe)
      })

      // Check in-memory state updated
      expect(result.current.recipes).toHaveLength(3)
      expect(result.current.recipes[2]).toEqual({
        ...newRecipe,
        id: 'new-id-123',
      })

      // Check persistence was called
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockRecipes,
          { ...newRecipe, id: 'new-id-123' },
        ])
      )
    })

    it('should handle add errors gracefully', async () => {
      mockStorageService.saveRecipes.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'New Recipe',
        description: 'New Description',
        ingredients: [],
        instructions: ['Step 1'],
        servings: 3,
        totalTime: 20,
        tags: ['snack'],
      }

      act(() => {
        result.current.addRecipe(newRecipe)
      })

      expect(result.current.error).toBe('Failed to add recipe')
    })
  })

  describe('updateRecipe', () => {
    it('should update recipe in in-memory state and persist', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedRecipe: Recipe = {
        ...mockRecipes[0],
        name: 'Updated Recipe Name',
        servings: 6,
      }

      act(() => {
        result.current.updateRecipe(updatedRecipe)
      })

      // Check in-memory state updated
      expect(result.current.recipes[0]).toEqual(updatedRecipe)

      // Check persistence was called
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith(
        expect.arrayContaining([updatedRecipe, mockRecipes[1]])
      )
    })

    it('should handle update of non-existent recipe', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const nonExistentRecipe: Recipe = {
        id: 'non-existent',
        name: 'Non-existent',
        description: 'Test',
        ingredients: [],
        instructions: [],
        servings: 2,
        totalTime: 10,
        tags: [],
      }

      act(() => {
        result.current.updateRecipe(nonExistentRecipe)
      })

      // Should not change recipes list
      expect(result.current.recipes).toEqual(mockRecipes)
    })

    it('should handle update errors gracefully', async () => {
      mockStorageService.saveRecipes.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedRecipe: Recipe = {
        ...mockRecipes[0],
        name: 'Updated Recipe Name',
      }

      act(() => {
        result.current.updateRecipe(updatedRecipe)
      })

      expect(result.current.error).toBe('Failed to update recipe')
    })
  })

  describe('deleteRecipe', () => {
    it('should remove recipe from in-memory state and persist', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteRecipe('1')
      })

      // Check in-memory state updated
      expect(result.current.recipes).toHaveLength(1)
      expect(result.current.recipes[0]).toEqual(mockRecipes[1])

      // Check persistence was called
      expect(mockStorageService.saveRecipes).toHaveBeenCalledWith([
        mockRecipes[1],
      ])
    })

    it('should handle delete of non-existent recipe', async () => {
      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteRecipe('non-existent')
      })

      // Should not change recipes list
      expect(result.current.recipes).toEqual(mockRecipes)
    })

    it('should handle delete errors gracefully', async () => {
      mockStorageService.saveRecipes.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useRecipes(), {
        wrapper: RecipeProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteRecipe('1')
      })

      expect(result.current.error).toBe('Failed to delete recipe')
    })
  })
})
