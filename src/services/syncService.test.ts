import { describe, it, expect, beforeEach, vi } from 'vitest'

import { SyncService } from './syncService'

import type { SyncData } from './syncService'
import type { MealPlanDB } from '@/db/database'
import type { GroceryItem } from '@/types/groceryList'
import type { Recipe } from '@/types/recipe'
import type { ICloudStorageProvider } from '@/utils/storage/ICloudStorageProvider'

describe('syncService', () => {
  let mockDb: MealPlanDB
  let mockStorage: ICloudStorageProvider
  let service: SyncService

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

    mockStorage = {
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      listFoldersAndFiles: vi.fn(),
      isAuthenticated: vi.fn(),
      getAccountInfo: vi.fn(),
    } as any

    service = new SyncService(mockStorage, mockDb)
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

  describe('performSync', () => {
    it('should sync new file - upload local data', async () => {
      const newFile = {
        id: '',
        name: 'new.json.gz',
        path: '/folder/new.json.gz',
        isSharedWithMe: false,
      }
      const mockRecipes = [
        { id: '1', name: 'Recipe 1', updatedAt: 1000 },
      ] as any

      mockDb.recipes.toArray = vi.fn().mockResolvedValue(mockRecipes)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(1000)
      mockStorage.uploadFile = vi
        .fn()
        .mockResolvedValue({ ...newFile, id: '123' })

      const result = await service.performSync(newFile)

      // New file should be uploaded with generated ID
      expect(result.updatedFileInfo).toEqual({ ...newFile, id: '123' })
      expect(mockStorage.uploadFile).toHaveBeenCalled()
      expect(result.merged.recipes).toEqual(mockRecipes)
    })

    it('should sync existing file - download, merge, upload if changes', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }
      const remoteData = {
        recipes: [{ id: '2', name: 'Remote Recipe', updatedAt: 2000 }],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 2000,
        version: 1,
      }

      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(1000)
      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockStorage.uploadFile = vi.fn().mockResolvedValue(existingFile)

      await service.performSync(existingFile)

      // Should download, merge, and upload when lastModified differs
      expect(mockStorage.downloadFile).toHaveBeenCalledWith(existingFile)
      expect(mockStorage.uploadFile).toHaveBeenCalled()
    })

    it('should detect changes when local has new records not in remote', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
      }
      const remoteData = {
        recipes: [],
        mealPlans: [],
        ingredients: [
          {
            id: 'ing-1',
            name: 'Remote Ingredient',
            updatedAt: 1000,
          },
        ],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }
      const localRecipe = {
        id: 'local-1',
        name: 'Local Recipe',
        updatedAt: 2000,
      } as any

      mockDb.recipes.toArray = vi.fn().mockResolvedValue([localRecipe])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(2000)
      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockStorage.uploadFile = vi.fn().mockResolvedValue(existingFile)

      const result = await service.performSync(existingFile)

      expect(result.merged.recipes).toHaveLength(1)
      expect(result.merged.recipes[0].id).toBe('local-1')
      expect(mockStorage.uploadFile).toHaveBeenCalled()
      expect(mockStorage.downloadFile).toHaveBeenCalledWith(existingFile)
      expect(mockStorage.uploadFile).toHaveBeenCalled()
    })

    it('should not upload if no changes after merge', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }
      const sameData = {
        recipes: [{ id: '1', name: 'Recipe 1', updatedAt: 1000 }],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      mockDb.recipes.toArray = vi.fn().mockResolvedValue(sameData.recipes)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(1000)
      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(sameData))

      const result = await service.performSync(existingFile)

      // Should not upload when lastModified is the same (no changes)
      expect(mockStorage.uploadFile).not.toHaveBeenCalled()
      expect(result.merged.recipes).toEqual(sameData.recipes)
    })

    it('should not upload soft-deleted records to cloud', async () => {
      const newFile = {
        id: '',
        name: 'new.json.gz',
        path: '/folder/new.json.gz',
        isSharedWithMe: false,
      }

      // Local has mix of deleted and non-deleted records
      const mockRecipes = [
        { id: '1', name: 'Recipe 1', isDeleted: false, updatedAt: 1000 },
        { id: '2', name: 'Recipe 2', isDeleted: true, updatedAt: 2000 },
      ] as any

      const mockMealPlans = [
        { id: 'mp1', type: 'recipe', isDeleted: true, updatedAt: 1000 },
      ] as any

      mockDb.recipes.toArray = vi.fn().mockResolvedValue(mockRecipes)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue(mockMealPlans)
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(2000)
      mockStorage.uploadFile = vi
        .fn()
        .mockResolvedValue({ ...newFile, id: '123' })

      const result = await service.performSync(newFile)

      // Verify uploadFile was called with filtered data
      expect(mockStorage.uploadFile).toHaveBeenCalled()
      const uploadedData = JSON.parse(
        vi.mocked(mockStorage.uploadFile).mock.calls[0][1]
      )

      // Uploaded data should only contain non-deleted records
      expect(uploadedData.recipes).toHaveLength(1)
      expect(uploadedData.recipes[0].id).toBe('1')
      expect(uploadedData.mealPlans).toHaveLength(0)

      // Merged result includes ALL records (even deleted) for local database
      expect(result.merged.recipes).toHaveLength(2)
      expect(result.merged.recipes.find(r => r.id === '1')).toBeDefined()
      expect(result.merged.recipes.find(r => r.id === '2')).toBeDefined()
      expect(result.merged.mealPlans).toHaveLength(1)
    })

    it('should throw error for invalid remote data', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }
      const invalidData = { invalid: 'structure' }

      // Mock local snapshot
      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(1000)

      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(invalidData))

      await expect(service.performSync(existingFile)).rejects.toThrow(
        'Invalid remote data format'
      )
    })
  })

  // Note: The following tests access private methods for comprehensive testing
  // In production, these are called internally by performSync()

  describe('getLocalSnapshot (private)', () => {
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

      // @ts-expect-error - Accessing private method for testing
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

    it('should include soft-deleted records in local snapshot for merge', async () => {
      const mockRecipes = [
        { id: '1', name: 'Recipe 1', isDeleted: false, updatedAt: 1000 },
        { id: '2', name: 'Recipe 2', isDeleted: true, updatedAt: 2000 },
        { id: '3', name: 'Recipe 3', updatedAt: 3000 }, // no isDeleted field
      ] as any

      const mockMealPlans = [
        { id: 'mp1', type: 'recipe', isDeleted: false, updatedAt: 1000 },
        { id: 'mp2', type: 'recipe', isDeleted: true, updatedAt: 2000 },
      ] as any

      const mockIngredients = [
        { id: 'ing1', name: 'Flour', updatedAt: 1000 },
        { id: 'ing2', name: 'Sugar', isDeleted: true, updatedAt: 2000 },
      ] as any

      const mockLists = [
        { id: 'gl1', name: 'List 1', updatedAt: 1000 },
        { id: 'gl2', name: 'List 2', isDeleted: true, updatedAt: 2000 },
      ] as any

      const mockItems = [
        { id: 'gi1', listId: 'gl1', updatedAt: 1000 },
        { id: 'gi2', listId: 'gl1', isDeleted: true, updatedAt: 2000 },
      ] as any

      mockDb.recipes.toArray = vi.fn().mockResolvedValue(mockRecipes)
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue(mockMealPlans)
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue(mockIngredients)
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue(mockLists)
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue(mockItems)
      mockDb.getLastModified = vi.fn().mockResolvedValue(12345)

      // @ts-expect-error - Accessing private method for testing
      const result = await service.getLocalSnapshot()

      // Should include ALL items (even deleted ones) for proper merge
      expect(result.recipes).toHaveLength(3)
      expect(result.recipes.map(r => r.id)).toEqual(['1', '2', '3'])

      expect(result.mealPlans).toHaveLength(2)
      expect(result.mealPlans.map(m => m.id)).toEqual(['mp1', 'mp2'])

      expect(result.ingredients).toHaveLength(2)
      expect(result.ingredients.map(i => i.id)).toEqual(['ing1', 'ing2'])

      expect(result.groceryLists).toHaveLength(2)
      expect(result.groceryLists.map(l => l.id)).toEqual(['gl1', 'gl2'])

      expect(result.groceryItems).toHaveLength(2)
      expect(result.groceryItems.map(i => i.id)).toEqual(['gi1', 'gi2'])
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

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].name).toBe('Recipe 1 Updated')
      expect(result.recipes[0].updatedAt).toBe(2000)
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

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.ingredients).toHaveLength(1)
      expect(result.ingredients[0].name).toBe('Local Ingredient')
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

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(2)
      expect(result.recipes.map(r => r.id)).toContain('1')
      expect(result.recipes.map(r => r.id)).toContain('2')
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

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(2)
      expect(result.mealPlans).toHaveLength(2)
      expect(result.ingredients).toHaveLength(2)
      expect(result.groceryLists).toHaveLength(2)
      expect(result.groceryItems).toHaveLength(2)
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

      // @ts-expect-error - Accessing private method for testing
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

      // @ts-expect-error - Accessing private method for testing
      await service.applyMergedData(merged)

      expect(mockDb.metadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: 5000, // Uses current timestamp since it's newer
      })
    })
  })

  describe('Last Write Wins (LWW) merge logic', () => {
    it('should include local records in merge when remote is empty', async () => {
      const local: SyncData = {
        recipes: [{ id: '1', name: 'Test', updatedAt: 1000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 0,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].name).toBe('Test')
    })

    it('should produce identical result when local and remote are identical', async () => {
      const recipe = { id: '1', name: 'Test', updatedAt: 1000 } as Recipe

      const local: SyncData = {
        recipes: [recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(1)
      expect(result.lastModified).toBe(1000)
    })

    it('should include remote records when local is empty', async () => {
      const local: SyncData = {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 0,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [{ id: '1', name: 'Test', updatedAt: 1000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].name).toBe('Test')
    })

    it('should use remote version when remote has newer timestamp', async () => {
      const local: SyncData = {
        recipes: [{ id: '1', name: 'Old', updatedAt: 1000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [{ id: '1', name: 'New', updatedAt: 2000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 2000,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.recipes[0].name).toBe('New')
      expect(result.lastModified).toBe(2000)
    })

    it('should merge grocery items from remote', async () => {
      const local: SyncData = {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 0,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [
          { id: '1', name: 'Item', updatedAt: 1000 } as GroceryItem,
        ],
        lastModified: 1000,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      expect(result.groceryItems).toHaveLength(1)
      expect(result.groceryItems[0].name).toBe('Item')
    })

    it('should keep local version when local is newer', async () => {
      const local: SyncData = {
        recipes: [{ id: '1', name: 'Newer', updatedAt: 2000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 2000,
        version: 1,
      }

      const remote: SyncData = {
        recipes: [{ id: '1', name: 'Older', updatedAt: 1000 } as Recipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      // @ts-expect-error - Accessing private method for testing
      const result = await service.mergeWithLWW(local, remote)

      // Local is newer, so merged should use local version
      expect(result.recipes[0].name).toBe('Newer')
      expect(result.lastModified).toBe(2000)
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

  describe('recipe migration from cloud', () => {
    it('should migrate old format recipe (flat structure) to sections', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }

      // Old format recipe from cloud
      const oldFormatRecipe = {
        id: '1',
        name: 'Old Recipe',
        ingredients: [
          { name: 'flour', amount: 2, unit: 'cups' },
          { name: 'eggs', amount: 3, unit: 'whole' },
        ],
        instructions: ['Mix flour', 'Add eggs', 'Bake'],
        subRecipes: [],
        updatedAt: 1000,
      }

      const remoteData = {
        recipes: [oldFormatRecipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(0)

      const result = await service.performSync(existingFile)

      // Verify recipe was migrated to sections format
      expect(result.merged.recipes).toHaveLength(1)
      const migratedRecipe = result.merged.recipes[0]

      expect(migratedRecipe.sections).toBeDefined()
      expect(migratedRecipe.sections).toHaveLength(1)
      expect(migratedRecipe.sections[0]).toEqual({
        name: undefined,
        ingredients: oldFormatRecipe.ingredients,
        instructions: oldFormatRecipe.instructions,
      })

      // Old fields should be removed
      expect((migratedRecipe as any).ingredients).toBeUndefined()
      expect((migratedRecipe as any).instructions).toBeUndefined()
      expect((migratedRecipe as any).subRecipes).toBeUndefined()
    })

    it('should not modify recipe that already has sections', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }

      // New format recipe (already has sections)
      const newFormatRecipe = {
        id: '1',
        name: 'New Recipe',
        sections: [
          {
            name: 'Main',
            ingredients: [{ name: 'flour', amount: 2, unit: 'cups' }],
            instructions: ['Mix', 'Bake'],
          },
          {
            name: 'Sauce',
            ingredients: [{ name: 'tomato', amount: 1, unit: 'can' }],
            instructions: ['Heat', 'Simmer'],
          },
        ],
        updatedAt: 1000,
      }

      const remoteData = {
        recipes: [newFormatRecipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(0)

      const result = await service.performSync(existingFile)

      // Recipe should remain unchanged
      expect(result.merged.recipes).toHaveLength(1)
      expect(result.merged.recipes[0]).toEqual(newFormatRecipe)
    })

    it('should handle recipe with missing ingredients/instructions arrays', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }

      // Old format recipe with missing arrays
      const oldFormatRecipe = {
        id: '1',
        name: 'Minimal Recipe',
        updatedAt: 1000,
      }

      const remoteData = {
        recipes: [oldFormatRecipe],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(0)

      const result = await service.performSync(existingFile)

      // Should create section with empty arrays
      expect(result.merged.recipes).toHaveLength(1)
      const migratedRecipe = result.merged.recipes[0]

      expect(migratedRecipe.sections).toHaveLength(1)
      expect(migratedRecipe.sections[0]).toEqual({
        name: undefined,
        ingredients: [],
        instructions: [],
      })
    })

    it('should migrate multiple old format recipes', async () => {
      const existingFile = {
        id: '123',
        name: 'backup.json.gz',
        path: '/folder/backup.json.gz',
        isSharedWithMe: false,
      }

      const remoteData = {
        recipes: [
          {
            id: '1',
            name: 'Recipe 1',
            ingredients: [{ name: 'flour' }],
            instructions: ['Mix'],
            updatedAt: 1000,
          },
          {
            id: '2',
            name: 'Recipe 2',
            ingredients: [{ name: 'sugar' }],
            instructions: ['Stir'],
            updatedAt: 1000,
          },
        ],
        mealPlans: [],
        ingredients: [],
        groceryLists: [],
        groceryItems: [],
        lastModified: 1000,
        version: 1,
      }

      mockStorage.downloadFile = vi
        .fn()
        .mockResolvedValue(JSON.stringify(remoteData))
      mockDb.recipes.toArray = vi.fn().mockResolvedValue([])
      mockDb.mealPlans.toArray = vi.fn().mockResolvedValue([])
      mockDb.ingredients.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue([])
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue([])
      mockDb.getLastModified = vi.fn().mockResolvedValue(0)

      const result = await service.performSync(existingFile)

      // All recipes should be migrated
      expect(result.merged.recipes).toHaveLength(2)
      result.merged.recipes.forEach(recipe => {
        expect(recipe.sections).toBeDefined()
        expect(recipe.sections).toHaveLength(1)
        expect((recipe as any).ingredients).toBeUndefined()
        expect((recipe as any).instructions).toBeUndefined()
      })
    })
  })
})
