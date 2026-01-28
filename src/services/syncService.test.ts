import { describe, it, expect, beforeEach, vi } from 'vitest'

import { createSyncService } from './syncService'

import type { SyncData } from './syncService'
import type { MealPlanDB } from '../db/database'

describe('syncService', () => {
  let mockDb: MealPlanDB
  let service: ReturnType<typeof createSyncService>

  beforeEach(() => {
    mockDb = {
      recipes: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
      mealPlans: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
      ingredients: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
      groceryLists: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
      groceryItems: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
      metadata: { put: vi.fn() },
      getLastModified: vi.fn(),
      transaction: vi.fn(async (_mode, _tables, callback) => await callback()),
    } as any

    service = createSyncService(mockDb)
  })

  const createEmptySyncData = (): SyncData => ({
    recipes: [],
    mealPlans: [],
    ingredients: [],
    groceryLists: [],
    groceryItems: [],
    lastModified: 0,
    version: 1,
  })

  describe('getLocalSnapshot', () => {
    it('should get current local state', async () => {
      const mockRecipes = [{ id: '1', name: 'Recipe 1' }] as any
      const mockMealPlans = [{ id: 'mp1', type: 'recipe' }] as any
      const mockIngredients = [{ id: 'ing1', name: 'Flour' }] as any
      const mockLists = [{ id: 'gl1', name: 'List 1' }] as any
      const mockItems = [{ id: 'gi1', listId: 'gl1' }] as any

      mockDb.recipes.toArray = vi.fn().mockResolvedValue(mockRecipes)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue(mockMealPlans)
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue(mockIngredients)
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue(mockLists)
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue(mockItems)
      mockDb.getLastModified = vi.fn().mockResolvedValue(12345)

      const result = await service.getLocalSnapshot()

      expect(result).toEqual({
        recipes: mockRecipes,
        mealPlans: mockMealPlans,
        ingredients: mockIngredients,
        groceryLists: mockLists,
        groceryItems: mockItems,
        lastModified: 12345,
        version: 1,
      })
    })
  })

  describe('mergeWithLWW', () => {
    it('should merge recipes using last write wins', async () => {
      const local: SyncData = {
        ...createEmptySyncData(),
        recipes: [
          {
            id: '1',
            name: 'Recipe 1',
            updatedAt: 1000,
          } as any,
        ],
      }

      const remote: SyncData = {
        ...createEmptySyncData(),
        recipes: [
          {
            id: '1',
            name: 'Recipe 1 Updated',
            updatedAt: 2000, // Remote is newer
          } as any,
        ],
      }

      const result = await service.mergeWithLWW(local, remote)

      expect(result.merged.recipes).toHaveLength(1)
      expect(result.merged.recipes[0].name).toBe('Recipe 1 Updated')
      expect(result.merged.recipes[0].updatedAt).toBe(2000)
    })

    it('should keep local if it is newer', async () => {
      const local: SyncData = {
        ...createEmptySyncData(),
        ingredients: [
          {
            id: '1',
            name: 'Local Ingredient',
            updatedAt: 2000,
          } as any,
        ],
      }

      const remote: SyncData = {
        ...createEmptySyncData(),
        ingredients: [
          {
            id: '1',
            name: 'Remote Ingredient',
            updatedAt: 1000, // Remote is older
          } as any,
        ],
      }

      const result = await service.mergeWithLWW(local, remote)

      expect(result.merged.ingredients).toHaveLength(1)
      expect(result.merged.ingredients[0].name).toBe('Local Ingredient')
    })

    it('should add new items from remote', async () => {
      const local: SyncData = {
        ...createEmptySyncData(),
        recipes: [{ id: '1', name: 'Recipe 1', updatedAt: 1000 } as any],
      }

      const remote: SyncData = {
        ...createEmptySyncData(),
        recipes: [{ id: '2', name: 'Recipe 2', updatedAt: 1000 } as any],
      }

      const result = await service.mergeWithLWW(local, remote)

      expect(result.merged.recipes).toHaveLength(2)
      expect(result.merged.recipes.map(r => r.id)).toContain('1')
      expect(result.merged.recipes.map(r => r.id)).toContain('2')
    })

    it('should merge all entity types', async () => {
      const local: SyncData = {
        recipes: [{ id: '1', updatedAt: 1000 } as any],
        mealPlans: [{ id: 'mp1', updatedAt: 1000 } as any],
        ingredients: [{ id: 'ing1', updatedAt: 1000 } as any],
        groceryLists: [{ id: 'gl1', updatedAt: 1000 } as any],
        groceryItems: [{ id: 'gi1', updatedAt: 1000 } as any],
        lastModified: 1000,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [{ id: '2', updatedAt: 2000 } as any],
        mealPlans: [{ id: 'mp2', updatedAt: 2000 } as any],
        ingredients: [{ id: 'ing2', updatedAt: 2000 } as any],
        groceryLists: [{ id: 'gl2', updatedAt: 2000 } as any],
        groceryItems: [{ id: 'gi2', updatedAt: 2000 } as any],
        lastModified: 2000,
        version: 1,
      }

      const result = await service.mergeWithLWW(local, remote)

      expect(result.merged.recipes).toHaveLength(2)
      expect(result.merged.mealPlans).toHaveLength(2)
      expect(result.merged.ingredients).toHaveLength(2)
      expect(result.merged.groceryLists).toHaveLength(2)
      expect(result.merged.groceryItems).toHaveLength(2)
    })
  })

  describe('applyMergedData', () => {
    it('should apply merged data to database', async () => {
      const merged: SyncData = {
        recipes: [{ id: '1', name: 'Recipe 1' } as any],
        mealPlans: [{ id: 'mp1' } as any],
        ingredients: [{ id: 'ing1' } as any],
        groceryLists: [{ id: 'gl1' } as any],
        groceryItems: [{ id: 'gi1' } as any],
        lastModified: 5000,
        version: 1,
      }

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.recipes.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.recipes.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.ingredients.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.ingredients.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryLists.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryLists.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.getLastModified = vi.fn().mockResolvedValue(3000)
      mockDb.metadata.put = vi.fn().mockResolvedValue(undefined)

      await service.applyMergedData(merged)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.recipes.clear).toHaveBeenCalledOnce()
      expect(mockDb.recipes.bulkAdd).toHaveBeenCalledWith(merged.recipes)
      expect(mockDb.mealPlans.clear).toHaveBeenCalledOnce()
      expect(mockDb.mealPlans.bulkAdd).toHaveBeenCalledWith(merged.mealPlans)
      expect(mockDb.metadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: 5000, // Uses max of current (3000) and merged (5000)
      })
    })

    it('should preserve newer local timestamp if present', async () => {
      const merged: SyncData = {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 3000,
        version: 1,
      }

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.recipes.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.recipes.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.mealPlans.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.ingredients.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.ingredients.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryLists.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryLists.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.getLastModified = vi.fn().mockResolvedValue(5000) // Current is newer
      mockDb.metadata.put = vi.fn().mockResolvedValue(undefined)

      await service.applyMergedData(merged)

      expect(mockDb.metadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: 5000, // Uses current timestamp since it's newer
      })
    })
  })

  describe('validateSyncFileName', () => {
    it('should return error for empty file name', () => {
      const result = service.validateSyncFileName('', [])
      expect(result).toBe('File name is required')
    })

    it('should return error for whitespace-only file name', () => {
      const result = service.validateSyncFileName('   ', [])
      expect(result).toBe('File name is required')
    })

    it('should return error for invalid characters', () => {
      const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
      invalidChars.forEach(char => {
        const result = service.validateSyncFileName(`file${char}name`, [])
        expect(result).toBe('Invalid characters in file name')
      })
    })

    it('should return error if file already exists', () => {
      const existingFiles = ['backup.json.gz', 'data.json.gz']
      const result = service.validateSyncFileName('backup', existingFiles)
      expect(result).toBe('File already exists in this folder')
    })

    it('should return error if file with extension already exists', () => {
      const existingFiles = ['backup.json.gz']
      const result = service.validateSyncFileName(
        'backup.json.gz',
        existingFiles
      )
      expect(result).toBe('File already exists in this folder')
    })

    it('should return null for valid file name', () => {
      const result = service.validateSyncFileName('my-backup', [])
      expect(result).toBeNull()
    })

    it('should return null for valid file name with extension', () => {
      const result = service.validateSyncFileName('my-backup.json.gz', [])
      expect(result).toBeNull()
    })

    it('should handle file names with special valid characters', () => {
      const result = service.validateSyncFileName('my-backup_2024.01.15', [])
      expect(result).toBeNull()
    })
  })

  describe('normalizeSyncFileName', () => {
    it('should add .json.gz extension if missing', () => {
      const result = service.normalizeSyncFileName('backup')
      expect(result).toBe('backup.json.gz')
    })

    it('should not add extension if already present', () => {
      const result = service.normalizeSyncFileName('backup.json.gz')
      expect(result).toBe('backup.json.gz')
    })

    it('should handle empty string', () => {
      const result = service.normalizeSyncFileName('')
      expect(result).toBe('.json.gz')
    })

    it('should handle names with dots', () => {
      const result = service.normalizeSyncFileName('my.backup.file')
      expect(result).toBe('my.backup.file.json.gz')
    })
  })
})
