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

    // Generate unique IDs for each call
    let idCounter = 0
    vi.mocked(idGenerator.generateId).mockImplementation(() => {
      idCounter++
      return `new-id-${idCounter}`
    })
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
        id: expect.any(String),
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
        id: expect.any(String),
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
        { id: expect.any(String), ...newMealPlan },
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

  describe('copyMealPlan', () => {
    describe('one-time copy', () => {
      it('should copy meal to a single target date', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0] // lunch on 2024-01-15
        const targetDate = '2024-01-20'
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'one-time',
            targetDate: new Date(targetDate),
          })
        })

        expect(copiedMealIds).toHaveLength(1)
        const copiedMeal = result.current.getMealPlanById(copiedMealIds[0])
        expect(copiedMeal).toBeDefined()
        expect(copiedMeal?.date).toBe(targetDate)
        expect(copiedMeal?.mealType).toBe(sourceMeal.mealType)
        expect(copiedMeal?.type).toBe(sourceMeal.type)
        if (sourceMeal.type === 'recipe' && copiedMeal?.type === 'recipe') {
          expect(copiedMeal.recipeId).toBe(sourceMeal.recipeId)
          expect(copiedMeal.servings).toBe(sourceMeal.servings)
        }
      })

      it('should copy custom meal to target date', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[1] // dining-out on 2024-01-15
        const targetDate = '2024-01-22'

        let copiedMealIds: string[] = []
        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'one-time',
            targetDate: new Date(targetDate),
          })
        })

        const copiedMeal = result.current.getMealPlanById(copiedMealIds[0])
        expect(copiedMeal?.type).toBe('dining-out')
        if (copiedMeal?.type === 'dining-out') {
          expect(copiedMeal.customText).toBe('Italian restaurant')
          expect(copiedMeal.note).toBe('Birthday celebration')
        }
      })

      it('should return empty array if source meal not found', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        let copiedMealIds: string[] = []
        act(() => {
          copiedMealIds = result.current.copyMealPlan('non-existent-id', {
            frequency: 'one-time',
            targetDate: new Date('2024-01-20'),
          })
        })

        expect(copiedMealIds).toEqual([])
      })
    })

    describe('weekly recurring copy', () => {
      it('should copy meal weekly for specified occurrences', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'weekly',
            targetDate: new Date('2024-01-22'), // Monday
            weeklyInterval: 1, // Every week
            endCondition: 'after-occurrences',
            occurrences: 4,
          })
        })

        expect(copiedMealIds).toHaveLength(4)
        // Should be: 2024-01-22, 2024-01-29, 2024-02-05, 2024-02-12
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        expect(dates).toEqual([
          '2024-01-22',
          '2024-01-29',
          '2024-02-05',
          '2024-02-12',
        ])
      })

      it('should copy meal bi-weekly until end date', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'weekly',
            targetDate: new Date('2024-01-22'),
            weeklyInterval: 2, // Every 2 weeks
            endCondition: 'until-date',
            endDate: new Date('2024-02-29'),
          })
        })

        // Should be: 2024-01-22, 2024-02-05, 2024-02-19
        expect(copiedMealIds).toHaveLength(3)
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        expect(dates).toEqual(['2024-01-22', '2024-02-05', '2024-02-19'])
      })
    })

    describe('specific weekday copy', () => {
      it('should copy meal to every Tuesday until end date', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'specific-weekday',
            targetDate: new Date('2024-01-23'), // Tuesday
            specificWeekday: 2, // Tuesday (0=Sunday, 2=Tuesday)
            endCondition: 'until-date',
            endDate: new Date('2024-02-20'),
          })
        })

        // Should be all Tuesdays: 2024-01-23, 2024-01-30, 2024-02-06, 2024-02-13, 2024-02-20
        expect(copiedMealIds).toHaveLength(5)
        const meals = copiedMealIds.map(id => result.current.getMealPlanById(id))
        meals.forEach(meal => {
          const date = new Date(meal!.date + 'T00:00:00')
          expect(date.getDay()).toBe(2) // All should be Tuesdays
        })
      })

      it('should copy meal to every Friday for 3 occurrences', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'specific-weekday',
            targetDate: new Date('2024-01-19'), // Friday
            specificWeekday: 5, // Friday
            endCondition: 'after-occurrences',
            occurrences: 3,
          })
        })

        expect(copiedMealIds).toHaveLength(3)
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        expect(dates).toEqual(['2024-01-19', '2024-01-26', '2024-02-02'])
      })
    })

    describe('custom interval copy', () => {
      it('should copy meal every 3 days for specified occurrences', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'custom-interval',
            targetDate: new Date('2024-01-20'),
            customIntervalDays: 3,
            endCondition: 'after-occurrences',
            occurrences: 5,
          })
        })

        expect(copiedMealIds).toHaveLength(5)
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        // Should be: 2024-01-20, 2024-01-23, 2024-01-26, 2024-01-29, 2024-02-01
        expect(dates).toEqual([
          '2024-01-20',
          '2024-01-23',
          '2024-01-26',
          '2024-01-29',
          '2024-02-01',
        ])
      })

      it('should copy meal every 7 days until end date', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        let copiedMealIds: string[] = []

        act(() => {
          copiedMealIds = result.current.copyMealPlan(sourceMeal.id, {
            frequency: 'custom-interval',
            targetDate: new Date('2024-01-20'),
            customIntervalDays: 7,
            endCondition: 'until-date',
            endDate: new Date('2024-02-10'),
          })
        })

        // Should be: 2024-01-20, 2024-01-27, 2024-02-03, 2024-02-10
        expect(copiedMealIds).toHaveLength(4)
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        expect(dates).toEqual([
          '2024-01-20',
          '2024-01-27',
          '2024-02-03',
          '2024-02-10',
        ])
      })
    })

    describe('conflict detection', () => {
      it('should generate preview with conflict information', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0] // lunch on 2024-01-15

        const preview = result.current.generateCopyPreview(sourceMeal.id, {
          frequency: 'one-time',
          targetDate: new Date('2024-01-15'), // Same date as source
        })

        expect(preview).toBeDefined()
        expect(preview.preview).toHaveLength(1)
        expect(preview.preview[0].hasConflict).toBe(true)
        expect(preview.preview[0].date).toBe('2024-01-15')
        expect(preview.conflicts).toHaveLength(1)
      })

      it('should detect conflicts in weekly recurring pattern', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0] // lunch on 2024-01-15

        const preview = result.current.generateCopyPreview(sourceMeal.id, {
          frequency: 'weekly',
          targetDate: new Date('2024-01-15'), // Monday
          weeklyInterval: 1,
          endCondition: 'after-occurrences',
          occurrences: 3,
        })

        // First occurrence conflicts with existing lunch on 2024-01-15
        expect(preview.conflicts).toHaveLength(1)
        expect(preview.conflicts[0].date).toBe('2024-01-15')
        expect(preview.preview).toHaveLength(3)
      })

      it('should show no conflicts for open dates', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]

        const preview = result.current.generateCopyPreview(sourceMeal.id, {
          frequency: 'one-time',
          targetDate: new Date('2024-02-15'),
        })

        expect(preview.conflicts).toHaveLength(0)
        expect(preview.preview[0].hasConflict).toBe(false)
      })
    })

    describe('conflict resolution', () => {
      it('should replace existing meal when resolution is "replace"', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0] // lunch on 2024-01-15
        const originalMealsCount = result.current.mealPlans.length

        let copiedMealIds: string[] = []
        act(() => {
          copiedMealIds = result.current.copyMealPlan(
            sourceMeal.id,
            {
              frequency: 'one-time',
              targetDate: new Date('2024-01-15'), // Conflicts with existing lunch
            },
            'replace'
          )
        })

        expect(copiedMealIds).toHaveLength(1)
        // Should still have same number of meals (replaced, not added)
        expect(result.current.mealPlans).toHaveLength(originalMealsCount)
      })

      it('should skip conflicting dates when resolution is "skip"', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0] // lunch on 2024-01-15

        let copiedMealIds: string[] = []
        act(() => {
          copiedMealIds = result.current.copyMealPlan(
            sourceMeal.id,
            {
              frequency: 'weekly',
              targetDate: new Date('2024-01-15'),
              weeklyInterval: 1,
              endCondition: 'after-occurrences',
              occurrences: 3,
            },
            'skip'
          )
        })

        // Should only create 2 meals, skipping the first conflicting one
        expect(copiedMealIds).toHaveLength(2)
        const dates = copiedMealIds
          .map(id => result.current.getMealPlanById(id)?.date)
          .sort()
        expect(dates).toEqual(['2024-01-22', '2024-01-29'])
      })

      it('should return empty array when resolution is "cancel"', async () => {
        const { result } = renderHook(() => useMealPlans(), {
          wrapper: MealPlanProvider,
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const sourceMeal = result.current.mealPlans[0]
        const originalMealsCount = result.current.mealPlans.length

        let copiedMealIds: string[] = []
        act(() => {
          copiedMealIds = result.current.copyMealPlan(
            sourceMeal.id,
            {
              frequency: 'one-time',
              targetDate: new Date('2024-01-15'), // Conflicts
            },
            'cancel'
          )
        })

        expect(copiedMealIds).toEqual([])
        expect(result.current.mealPlans).toHaveLength(originalMealsCount)
      })
    })
  })
})
