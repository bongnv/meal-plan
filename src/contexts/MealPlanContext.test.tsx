import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { MealPlanProvider, useMealPlans } from './MealPlanContext'
import * as idGenerator from '../utils/idGenerator'
import { MealPlanStorageService } from '../utils/storage/mealPlanStorage'

import type { MealPlan } from '../types/mealPlan'

// Mock the storage service and ID generator
vi.mock('../utils/storage/mealPlanStorage')
vi.mock('../utils/idGenerator')

describe('MealPlanContext', () => {
  let mockStorageService: {
    loadMealPlans: ReturnType<typeof vi.fn>
    saveMealPlans: ReturnType<typeof vi.fn>
  }

  const mockMealPlans: MealPlan[] = [
    {
      id: '1',
      date: '2024-01-15',
      mealType: 'lunch',
      type: 'recipe',
      recipeId: 'recipe1',
      servings: 4,
    },
    {
      id: '2',
      date: '2024-01-15',
      mealType: 'dinner',
      type: 'dining-out',
      customText: 'Italian restaurant',
      note: 'Birthday celebration',
    },
    {
      id: '3',
      date: '2024-01-16',
      mealType: 'lunch',
      type: 'leftovers',
    },
  ]

  beforeEach(() => {
    mockStorageService = {
      loadMealPlans: vi.fn().mockReturnValue(mockMealPlans),
      saveMealPlans: vi.fn(),
    }

    vi.mocked(MealPlanStorageService).mockImplementation(
      () => mockStorageService as unknown as MealPlanStorageService
    )

    vi.mocked(idGenerator.generateId).mockReturnValue('new-id-123')
  })

  describe('Provider initialization', () => {
    it('should load meal plans on mount', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      // Wait for meal plans to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.mealPlans).toEqual(mockMealPlans)
      expect(mockStorageService.loadMealPlans).toHaveBeenCalledTimes(1)
    })

    it('should handle empty meal plans list', async () => {
      mockStorageService.loadMealPlans.mockReturnValue([])

      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.mealPlans).toEqual([])
    })

    it('should handle loading errors', async () => {
      mockStorageService.loadMealPlans.mockImplementation(() => {
        throw new Error('Load error')
      })

      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load meal plans')
      expect(result.current.mealPlans).toEqual([])
    })
  })

  describe('addMealPlan', () => {
    it('should add a recipe meal plan to in-memory state', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newMealPlan = {
        date: '2024-01-20',
        mealType: 'dinner' as const,
        type: 'recipe' as const,
        recipeId: 'recipe2',
        servings: 2,
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      expect(result.current.mealPlans).toHaveLength(4)
      expect(result.current.mealPlans[3]).toMatchObject({
        id: 'new-id-123',
        ...newMealPlan,
      })
    })

    it('should add a custom meal plan to in-memory state', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newMealPlan = {
        date: '2024-01-21',
        mealType: 'lunch' as const,
        type: 'takeout' as const,
        customText: 'Chinese food',
        note: 'Office lunch',
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      expect(result.current.mealPlans).toHaveLength(4)
      expect(result.current.mealPlans[3]).toMatchObject({
        id: 'new-id-123',
        ...newMealPlan,
      })
    })

    it('should persist meal plan after adding', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newMealPlan = {
        date: '2024-01-20',
        mealType: 'dinner' as const,
        type: 'recipe' as const,
        recipeId: 'recipe2',
        servings: 2,
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      expect(mockStorageService.saveMealPlans).toHaveBeenCalledTimes(1)
      expect(mockStorageService.saveMealPlans).toHaveBeenCalledWith([
        ...mockMealPlans,
        { id: 'new-id-123', ...newMealPlan },
      ])
    })

    it('should clear error after successful add', async () => {
      mockStorageService.loadMealPlans.mockImplementation(() => {
        throw new Error('Load error')
      })

      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load meal plans')

      // Reset mock to allow successful save
      mockStorageService.saveMealPlans.mockClear()

      const newMealPlan = {
        date: '2024-01-20',
        mealType: 'dinner' as const,
        type: 'recipe' as const,
        recipeId: 'recipe2',
        servings: 2,
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      expect(result.current.error).toBeNull()
    })

    it('should handle add errors', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockStorageService.saveMealPlans.mockImplementation(() => {
        throw new Error('Save error')
      })

      const newMealPlan = {
        date: '2024-01-20',
        mealType: 'dinner' as const,
        type: 'recipe' as const,
        recipeId: 'recipe2',
        servings: 2,
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      expect(result.current.error).toBe('Failed to add meal plan')
    })
  })

  describe('updateMealPlan', () => {
    it('should update a meal plan in in-memory state', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedMealPlan: MealPlan = {
        id: '1',
        date: '2024-01-15',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 6, // Changed from 4 to 6
        note: 'Extra guests',
      }

      act(() => {
        result.current.updateMealPlan(updatedMealPlan)
      })

      expect(result.current.mealPlans).toHaveLength(3)
      expect(result.current.mealPlans[0]).toEqual(updatedMealPlan)
    })

    it('should persist meal plan after updating', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedMealPlan: MealPlan = {
        id: '2',
        date: '2024-01-15',
        mealType: 'dinner',
        type: 'dining-out',
        customText: 'Mexican restaurant', // Changed
      }

      act(() => {
        result.current.updateMealPlan(updatedMealPlan)
      })

      expect(mockStorageService.saveMealPlans).toHaveBeenCalledTimes(1)
      const savedMealPlans = mockStorageService.saveMealPlans.mock.calls[0][0]
      expect(savedMealPlans[1]).toEqual(updatedMealPlan)
    })

    it('should do nothing when updating non-existent meal plan', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const nonExistentMealPlan: MealPlan = {
        id: 'non-existent',
        date: '2024-01-20',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe99',
        servings: 1,
      }

      act(() => {
        result.current.updateMealPlan(nonExistentMealPlan)
      })

      expect(result.current.mealPlans).toEqual(mockMealPlans)
      expect(mockStorageService.saveMealPlans).not.toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockStorageService.saveMealPlans.mockImplementation(() => {
        throw new Error('Save error')
      })

      const updatedMealPlan: MealPlan = {
        id: '1',
        date: '2024-01-15',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 6,
      }

      act(() => {
        result.current.updateMealPlan(updatedMealPlan)
      })

      expect(result.current.error).toBe('Failed to update meal plan')
    })
  })

  describe('deleteMealPlan', () => {
    it('should delete a meal plan from in-memory state', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteMealPlan('1')
      })

      expect(result.current.mealPlans).toHaveLength(2)
      expect(result.current.mealPlans.find(mp => mp.id === '1')).toBeUndefined()
    })

    it('should persist meal plans after deleting', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteMealPlan('2')
      })

      expect(mockStorageService.saveMealPlans).toHaveBeenCalledTimes(1)
      const savedMealPlans = mockStorageService.saveMealPlans.mock.calls[0][0]
      expect(savedMealPlans).toHaveLength(2)
      expect(savedMealPlans.find((mp: MealPlan) => mp.id === '2')).toBeUndefined()
    })

    it('should do nothing when deleting non-existent meal plan', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteMealPlan('non-existent')
      })

      expect(result.current.mealPlans).toEqual(mockMealPlans)
      expect(mockStorageService.saveMealPlans).not.toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockStorageService.saveMealPlans.mockImplementation(() => {
        throw new Error('Save error')
      })

      act(() => {
        result.current.deleteMealPlan('1')
      })

      expect(result.current.error).toBe('Failed to delete meal plan')
    })
  })

  describe('Error handling', () => {
    it('should maintain state integrity on save errors', async () => {
      const { result } = renderHook(() => useMealPlans(), {
        wrapper: MealPlanProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalLength = result.current.mealPlans.length

      mockStorageService.saveMealPlans.mockImplementation(() => {
        throw new Error('Save error')
      })

      const newMealPlan = {
        date: '2024-01-20',
        mealType: 'dinner' as const,
        type: 'recipe' as const,
        recipeId: 'recipe2',
        servings: 2,
      }

      act(() => {
        result.current.addMealPlan(newMealPlan)
      })

      // State should still be updated even if save fails
      expect(result.current.mealPlans).toHaveLength(originalLength + 1)
      expect(result.current.error).toBe('Failed to add meal plan')
    })
  })
})
