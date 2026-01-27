import { describe, it, expect, beforeEach, vi } from 'vitest'

import { createIngredientService } from './ingredientService'

import type { MealPlanDB } from '../db/database'
import type { Ingredient } from '../types/ingredient'

describe('ingredientService', () => {
  let mockDb: MealPlanDB
  let service: ReturnType<typeof createIngredientService>

  beforeEach(() => {
    // Create mock database
    mockDb = {
      ingredients: {
        toArray: vi.fn(),
        get: vi.fn(),
        add: vi.fn(),
        bulkAdd: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
      },
      updateLastModified: vi.fn(),
      getLastModified: vi.fn(),
      transaction: vi.fn(async (_mode, _tables, callback) => await callback()),
    } as any

    service = createIngredientService(mockDb)
  })

  describe('getAll', () => {
    it('should return all ingredients', async () => {
      const mockIngredients: Ingredient[] = [
        {
          id: '1',
          name: 'Flour',
          category: 'Baking',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Sugar',
          category: 'Baking',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockDb.ingredients.toArray = vi.fn().mockResolvedValue(mockIngredients)

      const result = await service.getAll()

      expect(result).toEqual(mockIngredients)
      expect(mockDb.ingredients.toArray).toHaveBeenCalledOnce()
    })
  })

  describe('getById', () => {
    it('should return ingredient by id', async () => {
      const mockIngredient: Ingredient = {
        id: '1',
        name: 'Flour',
        category: 'Baking',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      mockDb.ingredients.get = vi.fn().mockResolvedValue(mockIngredient)

      const result = await service.getById('1')

      expect(result).toEqual(mockIngredient)
      expect(mockDb.ingredients.get).toHaveBeenCalledWith('1')
    })

    it('should return undefined for non-existent id', async () => {
      mockDb.ingredients.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.getById('999')

      expect(result).toBeUndefined()
    })
  })

  describe('add', () => {
    it('should add a new ingredient', async () => {
      const ingredientData = {
        name: 'Salt',
        category: 'Herbs & Spices' as const,
      }

      mockDb.ingredients.add = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const id = await service.add(ingredientData)

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(mockDb.ingredients.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...ingredientData,
          id: expect.any(String),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('addMany', () => {
    it('should add multiple ingredients', async () => {
      const ingredientsData = [
        { name: 'Flour', category: 'Baking' as const },
        { name: 'Sugar', category: 'Baking' as const },
      ]

      mockDb.ingredients.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const ids = await service.addMany(ingredientsData)

      expect(ids).toHaveLength(2)
      expect(ids.every(id => typeof id === 'string')).toBe(true)
      expect(mockDb.ingredients.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Flour',
            category: 'Baking',
            id: expect.any(String),
          }),
          expect.objectContaining({
            name: 'Sugar',
            category: 'Baking',
            id: expect.any(String),
          }),
        ])
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })

    it('should handle empty array', async () => {
      mockDb.ingredients.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const ids = await service.addMany([])

      expect(ids).toEqual([])
      expect(mockDb.ingredients.bulkAdd).toHaveBeenCalledWith([])
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('update', () => {
    it('should update an ingredient', async () => {
      const ingredient: Ingredient = {
        id: '1',
        name: 'Flour',
        category: 'Grains',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      }

      mockDb.ingredients.put = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.update(ingredient)

      expect(mockDb.ingredients.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...ingredient,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('delete', () => {
    it('should delete an ingredient', async () => {
      mockDb.ingredients.delete = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.delete('1')

      expect(mockDb.ingredients.delete).toHaveBeenCalledWith('1')
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('replaceAll', () => {
    it('should replace all ingredients', async () => {
      const newIngredients: Ingredient[] = [
        {
          id: '1',
          name: 'Flour',
          category: 'Baking',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.ingredients.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.ingredients.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.replaceAll(newIngredients)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.ingredients.clear).toHaveBeenCalledOnce()
      expect(mockDb.ingredients.bulkAdd).toHaveBeenCalledWith(newIngredients)
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('getLastModified', () => {
    it('should return last modified timestamp', async () => {
      const timestamp = Date.now()
      mockDb.getLastModified = vi.fn().mockResolvedValue(timestamp)

      const result = await service.getLastModified()

      expect(result).toBe(timestamp)
      expect(mockDb.getLastModified).toHaveBeenCalledOnce()
    })
  })
})
