import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IngredientProvider, useIngredients } from './IngredientContext'
import { IngredientStorageService } from '../utils/storage/IngredientStorage'

import type { Ingredient, IngredientFormValues } from '../types/ingredient'

// Mock the storage service
vi.mock('../utils/storage/ingredientStorage')

const mockIngredientStorageService = {
  generateId: vi.fn(),
  loadIngredients: vi.fn(),
  saveIngredients: vi.fn(),
}

describe('IngredientContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(IngredientStorageService).mockImplementation(
      () => mockIngredientStorageService as unknown as IngredientStorageService
    )
    mockIngredientStorageService.generateId.mockReturnValue('test-id-123')
    mockIngredientStorageService.loadIngredients.mockReturnValue([])
    mockIngredientStorageService.saveIngredients.mockResolvedValue(undefined)
  })

  describe('Provider initialization', () => {
    it('should load ingredients on mount', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.ingredients).toEqual(mockIngredients)
      expect(mockIngredientStorageService.loadIngredients).toHaveBeenCalled()
    })

    it('should handle loading errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockIngredientStorageService.loadIngredients.mockImplementation(() => {
        throw new Error('Load error')
      })

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load ingredients')
      expect(result.current.ingredients).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load ingredients:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('getIngredientById', () => {
    it('should return ingredient by id', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
        { id: '2', name: 'Onion', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const ingredient = result.current.getIngredientById('1')
      expect(ingredient).toEqual(mockIngredients[0])
    })

    it('should return undefined for non-existent id', async () => {
      mockIngredientStorageService.loadIngredients.mockReturnValue([])

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const ingredient = result.current.getIngredientById('non-existent')
      expect(ingredient).toBeUndefined()
    })
  })

  describe('addIngredient', () => {
    it('should add a new ingredient', async () => {
      mockIngredientStorageService.loadIngredients.mockReturnValue([])

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newIngredient: IngredientFormValues = {
        name: 'Tomato',
        category: 'Vegetables',
        unit: 'piece',
      }

      await act(async () => {
        await result.current.addIngredient(newIngredient)
      })

      expect(result.current.ingredients).toHaveLength(1)
      expect(result.current.ingredients[0]).toMatchObject(newIngredient)
      expect(result.current.ingredients[0].id).toBe('test-id-123')
      expect(mockIngredientStorageService.saveIngredients).toHaveBeenCalled()
    })

    it('should handle add errors gracefully', async () => {
      mockIngredientStorageService.loadIngredients.mockReturnValue([])
      mockIngredientStorageService.saveIngredients.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newIngredient: IngredientFormValues = {
        name: 'Tomato',
        category: 'Vegetables',
        unit: 'piece',
      }

      await act(async () => {
        try {
          await result.current.addIngredient(newIngredient)
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Failed to add ingredient')
    })
  })

  describe('updateIngredient', () => {
    it('should update an existing ingredient', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedIngredient: Ingredient = {
        id: '1',
        name: 'Cherry Tomato',
        category: 'Vegetables',
        unit: 'gram',
      }

      await act(async () => {
        await result.current.updateIngredient(updatedIngredient)
      })

      expect(result.current.ingredients[0]).toEqual(updatedIngredient)
      expect(mockIngredientStorageService.saveIngredients).toHaveBeenCalled()
    })

    it('should handle update errors gracefully', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )
      mockIngredientStorageService.saveIngredients.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedIngredient: Ingredient = {
        id: '1',
        name: 'Cherry Tomato',
        category: 'Vegetables',
        unit: 'gram',
      }

      await act(async () => {
        try {
          await result.current.updateIngredient(updatedIngredient)
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Failed to update ingredient')
    })
  })

  describe('deleteIngredient', () => {
    it('should delete an ingredient', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
        { id: '2', name: 'Onion', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteIngredient('1')
      })

      expect(result.current.ingredients).toHaveLength(1)
      expect(result.current.ingredients[0].id).toBe('2')
      expect(mockIngredientStorageService.saveIngredients).toHaveBeenCalled()
    })

    it('should handle delete errors gracefully', async () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]
      mockIngredientStorageService.loadIngredients.mockReturnValue(
        mockIngredients
      )
      mockIngredientStorageService.saveIngredients.mockImplementation(() => {
        throw new Error('Save error')
      })

      const { result } = renderHook(() => useIngredients(), {
        wrapper: IngredientProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.deleteIngredient('1')
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Failed to delete ingredient')
    })
  })
})
