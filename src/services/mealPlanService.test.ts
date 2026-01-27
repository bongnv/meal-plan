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
  })
})
