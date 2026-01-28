import { describe, it, expect, beforeEach, vi } from 'vitest'

import { createMealPlanService } from './mealPlanService'

import type { MealPlanDB } from '../db/database'
import type { MealPlan } from '../types/mealPlan'

describe('mealPlanService', () => {
  let mockDb: MealPlanDB
  let service: ReturnType<typeof createMealPlanService>

  beforeEach(() => {
    mockDb = {
      mealPlans: {
        toArray: vi.fn(),
        get: vi.fn(),
        add: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        where: vi.fn(),
      },
      updateLastModified: vi.fn(),
      getLastModified: vi.fn(),
      transaction: vi.fn(async (_mode, _tables, callback) => await callback()),
    } as any

    service = createMealPlanService(mockDb)
  })

  const createMockMealPlan = (overrides?: Partial<MealPlan>): MealPlan => ({
    id: 'mp1',
    type: 'recipe',
    date: '2026-01-28',
    mealType: 'dinner',
    recipeId: 'recipe1',
    servings: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  describe('getAll', () => {
    it('should return all meal plans', async () => {
      const mockMealPlans = [
        createMockMealPlan(),
        createMockMealPlan({ id: 'mp2' }),
      ]
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue(mockMealPlans)

      const result = await service.getAll()

      expect(result).toEqual(mockMealPlans)
      expect(mockDb.mealPlans.toArray).toHaveBeenCalledOnce()
    })
  })

  describe('getById', () => {
    it('should return meal plan by id', async () => {
      const mockMealPlan = createMockMealPlan()
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(mockMealPlan)

      const result = await service.getById('mp1')

      expect(result).toEqual(mockMealPlan)
      expect(mockDb.mealPlans.get).toHaveBeenCalledWith('mp1')
    })

    it('should return undefined for non-existent id', async () => {
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.getById('999')

      expect(result).toBeUndefined()
    })
  })

  describe('add', () => {
    it('should add a new meal plan', async () => {
      const mealPlanData = {
        type: 'recipe' as const,
        date: '2026-01-28',
        mealType: 'dinner' as const,
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      mockDb.mealPlans.add = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const id = await service.add(mealPlanData)

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(mockDb.mealPlans.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mealPlanData,
          id: expect.any(String),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('update', () => {
    it('should update a meal plan', async () => {
      const mealPlan = createMockMealPlan()
      mockDb.mealPlans.put = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.update(mealPlan)

      expect(mockDb.mealPlans.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mealPlan,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('delete', () => {
    it('should delete a meal plan', async () => {
      mockDb.mealPlans.delete = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.delete('mp1')

      expect(mockDb.mealPlans.delete).toHaveBeenCalledWith('mp1')
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('replaceAll', () => {
    it('should replace all meal plans', async () => {
      const newMealPlans = [createMockMealPlan()]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.mealPlans.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.replaceAll(newMealPlans)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.mealPlans.clear).toHaveBeenCalledOnce()
      expect(mockDb.mealPlans.bulkAdd).toHaveBeenCalledWith(newMealPlans)
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('generateTargetDates', () => {
    it('should generate single date for one-time copy', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time' as const,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01'])
    })

    it('should return empty array for recurring without end condition', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'weekly' as const,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual([])
    })

    it('should generate weekly dates with after-occurrences end condition', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'weekly' as const,
        weeklyInterval: 1,
        endCondition: 'after-occurrences' as const,
        occurrences: 3,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-08', '2026-02-15'])
    })

    it('should generate weekly dates with custom interval', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'weekly' as const,
        weeklyInterval: 2,
        endCondition: 'after-occurrences' as const,
        occurrences: 3,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-15', '2026-03-01'])
    })

    it('should generate dates until end date', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'weekly' as const,
        weeklyInterval: 1,
        endCondition: 'until-date' as const,
        endDate: new Date('2026-02-20'),
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-08', '2026-02-15'])
    })

    it('should generate specific weekday dates', () => {
      const options = {
        targetDate: new Date('2026-02-01'), // Sunday
        frequency: 'specific-weekday' as const,
        specificWeekday: 3, // Wednesday
        endCondition: 'after-occurrences' as const,
        occurrences: 3,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-04', '2026-02-11'])
    })

    it('should generate custom interval dates', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'custom-interval' as const,
        customIntervalDays: 3,
        endCondition: 'after-occurrences' as const,
        occurrences: 4,
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual([
        '2026-02-01',
        '2026-02-04',
        '2026-02-07',
        '2026-02-10',
      ])
    })

    it('should stop at end date for specific weekday frequency', () => {
      const options = {
        targetDate: new Date('2026-02-01'), // Sunday
        frequency: 'specific-weekday' as const,
        specificWeekday: 3, // Wednesday
        endCondition: 'until-date' as const,
        endDate: new Date('2026-02-15'),
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-04', '2026-02-11'])
    })

    it('should stop at end date for custom interval frequency', () => {
      const options = {
        targetDate: new Date('2026-02-01'),
        frequency: 'custom-interval' as const,
        customIntervalDays: 5,
        endCondition: 'until-date' as const,
        endDate: new Date('2026-02-15'),
      }

      const result = service.generateTargetDates(options)

      expect(result).toEqual(['2026-02-01', '2026-02-06', '2026-02-11'])
    })
  })

  describe('generateCopyPreview', () => {
    it('should return empty result for non-existent meal plan', async () => {
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.generateCopyPreview('nonexistent', {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time',
      })

      expect(result).toEqual({ targetDates: [], conflicts: [], preview: [] })
    })

    it('should generate preview without conflicts', async () => {
      const sourceMeal = createMockMealPlan()
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([sourceMeal])

      const result = await service.generateCopyPreview('mp1', {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time',
      })

      expect(result.targetDates).toEqual(['2026-02-01'])
      expect(result.conflicts).toEqual([])
      expect(result.preview).toHaveLength(1)
      expect(result.preview[0].hasConflict).toBe(false)
    })

    it('should detect conflicts', async () => {
      const sourceMeal = createMockMealPlan({ date: '2026-01-28' })
      const existingMeal = createMockMealPlan({ id: 'mp2', date: '2026-02-01' })
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi
        .fn()
        .mockResolvedValue([sourceMeal, existingMeal])

      const result = await service.generateCopyPreview('mp1', {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time',
      })

      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].hasConflict).toBe(true)
      expect(result.conflicts[0].existingMeal).toEqual(existingMeal)
    })
  })

  describe('copyMealPlan', () => {
    it('should return empty array for non-existent meal plan', async () => {
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.copyMealPlan('nonexistent', {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time',
      })

      expect(result).toEqual([])
    })

    it('should copy meal plan to new date without conflicts', async () => {
      const sourceMeal = createMockMealPlan()
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([sourceMeal])
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const result = await service.copyMealPlan('mp1', {
        targetDate: new Date('2026-02-01'),
        frequency: 'one-time',
      })

      expect(result).toHaveLength(1)
      expect(mockDb.mealPlans.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            date: '2026-02-01',
            recipeId: 'recipe1',
          }),
        ])
      )
      expect(mockDb.updateLastModified).toHaveBeenCalled()
    })

    it('should skip conflicting dates with skip resolution', async () => {
      const sourceMeal = createMockMealPlan({ date: '2026-01-28' })
      const existingMeal = createMockMealPlan({ id: 'mp2', date: '2026-02-01' })
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi
        .fn()
        .mockResolvedValue([sourceMeal, existingMeal])
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const result = await service.copyMealPlan(
        'mp1',
        {
          targetDate: new Date('2026-02-01'),
          frequency: 'one-time',
        },
        'skip'
      )

      expect(result).toEqual([])
      expect(mockDb.mealPlans.bulkAdd).not.toHaveBeenCalled()
    })

    it('should replace conflicting dates with replace resolution', async () => {
      const sourceMeal = createMockMealPlan({ date: '2026-01-28' })
      const existingMeal = createMockMealPlan({ id: 'mp2', date: '2026-02-01' })
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi
        .fn()
        .mockResolvedValue([sourceMeal, existingMeal])
      mockDb.mealPlans.bulkDelete = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const result = await service.copyMealPlan(
        'mp1',
        {
          targetDate: new Date('2026-02-01'),
          frequency: 'one-time',
        },
        'replace'
      )

      expect(result).toHaveLength(1)
      expect(mockDb.mealPlans.bulkDelete).toHaveBeenCalledWith(['mp2'])
      expect(mockDb.mealPlans.bulkAdd).toHaveBeenCalled()
    })

    it('should cancel copy with conflicts when using cancel resolution', async () => {
      const sourceMeal = createMockMealPlan({ date: '2026-01-28' })
      const existingMeal = createMockMealPlan({ id: 'mp2', date: '2026-02-01' })
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi
        .fn()
        .mockResolvedValue([sourceMeal, existingMeal])

      const result = await service.copyMealPlan(
        'mp1',
        {
          targetDate: new Date('2026-02-01'),
          frequency: 'one-time',
        },
        'cancel'
      )

      expect(result).toEqual([])
    })

    it('should copy multiple dates with weekly frequency', async () => {
      const sourceMeal = createMockMealPlan()
      mockDb.mealPlans.get = vi.fn().mockResolvedValue(sourceMeal)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([sourceMeal])
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const result = await service.copyMealPlan('mp1', {
        targetDate: new Date('2026-02-01'),
        frequency: 'weekly',
        weeklyInterval: 1,
        endCondition: 'after-occurrences',
        occurrences: 3,
      })

      expect(result).toHaveLength(3)
      expect(mockDb.mealPlans.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ date: '2026-02-01' }),
          expect.objectContaining({ date: '2026-02-08' }),
          expect.objectContaining({ date: '2026-02-15' }),
        ])
      )
    })
  })

  describe('getLastModified', () => {
    it('should return last modified timestamp', async () => {
      const timestamp = Date.now()
      mockDb.getLastModified = vi.fn().mockResolvedValue(timestamp)

      const result = await service.getLastModified()

      expect(result).toBe(timestamp)
      expect(mockDb.getLastModified).toHaveBeenCalled()
    })
  })

  describe('determineDefaultMealType', () => {
    it('should return lunch when no meals exist for the date', () => {
      const mealPlans: any[] = []
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('lunch')
    })

    it('should return lunch when only dinner exists', () => {
      const mealPlans: any[] = [
        { id: '1', date: '2024-01-15', mealType: 'dinner' },
      ]
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('lunch')
    })

    it('should return dinner when only lunch exists', () => {
      const mealPlans: any[] = [
        { id: '1', date: '2024-01-15', mealType: 'lunch' },
      ]
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('dinner')
    })

    it('should return lunch when both lunch and dinner exist', () => {
      const mealPlans: any[] = [
        { id: '1', date: '2024-01-15', mealType: 'lunch' },
        { id: '2', date: '2024-01-15', mealType: 'dinner' },
      ]
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('lunch')
    })

    it('should only consider meals for the specified date', () => {
      const mealPlans: any[] = [
        { id: '1', date: '2024-01-14', mealType: 'lunch' },
        { id: '2', date: '2024-01-16', mealType: 'dinner' },
      ]
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('lunch')
    })

    it('should handle breakfast meal type', () => {
      const mealPlans: any[] = [
        { id: '1', date: '2024-01-15', mealType: 'breakfast' },
      ]
      const result = service.determineDefaultMealType(mealPlans, '2024-01-15')
      expect(result).toBe('lunch')
    })
  })
})
