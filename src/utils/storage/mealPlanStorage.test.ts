import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { MealPlanStorageService } from './mealPlanStorage'
import { generateId } from '../idGenerator'

import type { MealPlan } from '../../types/mealPlan'

describe('MealPlanStorageService', () => {
  let service: MealPlanStorageService

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    service = new MealPlanStorageService()
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

  describe('loadMealPlans', () => {
    it('should return an empty array when no meal plans are stored', () => {
      const mealPlans = service.loadMealPlans()
      expect(mealPlans).toEqual([])
    })

    it('should load recipe meal plans from localStorage', () => {
      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe-1',
          servings: 4,
        },
      ]

      localStorage.setItem('mealPlans', JSON.stringify(mockMealPlans))

      const mealPlans = service.loadMealPlans()
      expect(mealPlans).toEqual(mockMealPlans)
    })

    it('should load custom meal plans from localStorage', () => {
      const mockMealPlans: MealPlan[] = [
        {
          id: '2',
          date: '2026-01-21',
          mealType: 'lunch',
          type: 'dining-out',
          customText: "Luigi's Italian Restaurant",
        },
      ]

      localStorage.setItem('mealPlans', JSON.stringify(mockMealPlans))

      const mealPlans = service.loadMealPlans()
      expect(mealPlans).toEqual(mockMealPlans)
    })

    it('should load mixed meal plans (recipe and custom) from localStorage', () => {
      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe-1',
          servings: 4,
          note: 'Make extra for leftovers',
        },
        {
          id: '2',
          date: '2026-01-21',
          mealType: 'lunch',
          type: 'takeout',
          customText: 'Thai food',
        },
        {
          id: '3',
          date: '2026-01-22',
          mealType: 'dinner',
          type: 'leftovers',
        },
      ]

      localStorage.setItem('mealPlans', JSON.stringify(mockMealPlans))

      const mealPlans = service.loadMealPlans()
      expect(mealPlans).toEqual(mockMealPlans)
    })

    it('should throw error if localStorage data is corrupted', () => {
      localStorage.setItem('mealPlans', 'invalid json')

      expect(() => service.loadMealPlans()).toThrow()
    })

    it('should throw error if data fails Zod validation', () => {
      const invalidMealPlans = [
        {
          id: '1',
          date: '2026-01-20',
          // missing required fields like mealType, type
        },
      ]

      localStorage.setItem('mealPlans', JSON.stringify(invalidMealPlans))

      expect(() => service.loadMealPlans()).toThrow()
    })

    it('should throw error if recipe meal plan is missing required fields', () => {
      const invalidMealPlans = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          // missing recipeId and servings
        },
      ]

      localStorage.setItem('mealPlans', JSON.stringify(invalidMealPlans))

      expect(() => service.loadMealPlans()).toThrow()
    })

    it('should throw error when localStorage.getItem throws', () => {
      // Mock localStorage.getItem to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      expect(() => service.loadMealPlans()).toThrow('localStorage error')
    })
  })

  describe('saveMealPlans', () => {
    it('should save meal plans to localStorage', () => {
      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe-1',
          servings: 4,
        },
      ]

      service.saveMealPlans(mockMealPlans)

      const stored = localStorage.getItem('mealPlans')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(mockMealPlans)
    })

    it('should save an empty array to localStorage', () => {
      service.saveMealPlans([])

      const stored = localStorage.getItem('mealPlans')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual([])
    })

    it('should throw error when validating invalid meal plans', () => {
      // @ts-expect-error - intentionally invalid data
      const invalidMealPlans: MealPlan[] = [
        {
          id: '1',
          // missing required fields
        },
      ]

      expect(() => service.saveMealPlans(invalidMealPlans)).toThrow()
    })

    it('should overwrite existing meal plans', () => {
      const firstBatch: MealPlan[] = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe-1',
          servings: 4,
        },
      ]

      const secondBatch: MealPlan[] = [
        {
          id: '2',
          date: '2026-01-21',
          mealType: 'lunch',
          type: 'takeout',
          customText: 'Pizza',
        },
      ]

      service.saveMealPlans(firstBatch)
      service.saveMealPlans(secondBatch)

      const stored = localStorage.getItem('mealPlans')
      expect(JSON.parse(stored!)).toEqual(secondBatch)
    })

    it('should throw error when localStorage.setItem throws', () => {
      // Mock localStorage.setItem to throw an error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const mockMealPlans: MealPlan[] = [
        {
          id: '1',
          date: '2026-01-20',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'recipe-1',
          servings: 4,
        },
      ]

      expect(() => service.saveMealPlans(mockMealPlans)).toThrow('localStorage error')
    })
  })
})
