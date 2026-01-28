import { describe, it, expect, beforeEach, vi } from 'vitest'

import { createGroceryListService } from './groceryListService'

import type { MealPlanDB } from '../db/database'
import type { GroceryList, GroceryItem } from '../types/groceryList'

describe('groceryListService', () => {
  let mockDb: MealPlanDB
  let service: ReturnType<typeof createGroceryListService>

  beforeEach(() => {
    mockDb = {
      groceryLists: {
        toArray: vi.fn(),
        get: vi.fn(),
        add: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
      },
      groceryItems: {
        toArray: vi.fn(),
        where: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
      },
      updateLastModified: vi.fn(),
      transaction: vi.fn(async (_mode, _tables, callback) => await callback()),
    } as any

    service = createGroceryListService(mockDb)
  })

  const createMockList = (overrides?: Partial<GroceryList>): GroceryList => ({
    id: 'list1',
    name: 'Weekly Groceries',
    dateRange: { start: '2026-01-20', end: '2026-01-27' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  const createMockItem = (overrides?: Partial<GroceryItem>): GroceryItem => ({
    id: 'item1',
    listId: 'list1',
    name: 'Flour',
    quantity: 500,
    unit: 'gram',
    category: 'Baking',
    checked: false,
    mealPlanIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  describe('getAllLists', () => {
    it('should return all grocery lists', async () => {
      const mockLists = [createMockList(), createMockList({ id: 'list2' })]
      mockDb.groceryLists.toArray = vi.fn().mockResolvedValue(mockLists)

      const result = await service.getAllLists()

      expect(result).toEqual(mockLists)
      expect(mockDb.groceryLists.toArray).toHaveBeenCalledOnce()
    })
  })

  describe('getAllItems', () => {
    it('should return all grocery items', async () => {
      const mockItems = [createMockItem(), createMockItem({ id: 'item2' })]
      mockDb.groceryItems.toArray = vi.fn().mockResolvedValue(mockItems)

      const result = await service.getAllItems()

      expect(result).toEqual(mockItems)
      expect(mockDb.groceryItems.toArray).toHaveBeenCalledOnce()
    })
  })

  describe('getListById', () => {
    it('should return list by id', async () => {
      const mockList = createMockList()
      mockDb.groceryLists.get = vi.fn().mockResolvedValue(mockList)

      const result = await service.getListById('list1')

      expect(result).toEqual(mockList)
      expect(mockDb.groceryLists.get).toHaveBeenCalledWith('list1')
    })

    it('should return undefined for non-existent id', async () => {
      mockDb.groceryLists.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.getListById('999')

      expect(result).toBeUndefined()
    })
  })

  describe('getItemsForList', () => {
    it('should return items for a specific list', async () => {
      const mockItems = [
        createMockItem({ id: 'item1', listId: 'list1' }),
        createMockItem({ id: 'item2', listId: 'list1' }),
      ]

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockItems),
        }),
      }

      mockDb.groceryItems.where = vi.fn().mockReturnValue(mockWhere)

      const result = await service.getItemsForList('list1')

      expect(mockDb.groceryItems.where).toHaveBeenCalledWith('listId')
      expect(mockWhere.equals).toHaveBeenCalledWith('list1')
      expect(result).toEqual(mockItems)
    })
  })

  describe('generateList', () => {
    it('should create a new list with items', async () => {
      const list = createMockList()
      const items = [createMockItem(), createMockItem({ id: 'item2' })]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.groceryLists.add = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.generateList(list, items)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.groceryLists.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...list,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.groceryItems.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          }),
        ])
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('updateList', () => {
    it('should update a grocery list', async () => {
      const list = createMockList()
      mockDb.groceryLists.put = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.updateList(list)

      expect(mockDb.groceryLists.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...list,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('deleteList', () => {
    it('should delete a list and all its items', async () => {
      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.groceryLists.delete = vi.fn().mockResolvedValue(undefined)

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }
      mockDb.groceryItems.where = vi.fn().mockReturnValue(mockWhere)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.deleteList('list1')

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.groceryLists.delete).toHaveBeenCalledWith('list1')
      expect(mockDb.groceryItems.where).toHaveBeenCalledWith('listId')
      expect(mockWhere.equals).toHaveBeenCalledWith('list1')
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('addItem', () => {
    it('should add a new grocery item', async () => {
      const item = createMockItem()
      mockDb.groceryItems.add = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.addItem(item)

      expect(mockDb.groceryItems.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...item,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('updateItem', () => {
    it('should update a grocery item', async () => {
      const updates = { checked: true, quantity: 1000 }
      mockDb.groceryItems.update = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.updateItem('item1', updates)

      expect(mockDb.groceryItems.update).toHaveBeenCalledWith(
        'item1',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('removeItem', () => {
    it('should remove a grocery item', async () => {
      mockDb.groceryItems.delete = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.removeItem('item1')

      expect(mockDb.groceryItems.delete).toHaveBeenCalledWith('item1')
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('replaceAllLists', () => {
    it('should replace all grocery lists', async () => {
      const newLists = [createMockList()]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.groceryLists.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryLists.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.replaceAllLists(newLists)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.groceryLists.clear).toHaveBeenCalledOnce()
      expect(mockDb.groceryLists.bulkAdd).toHaveBeenCalledWith(newLists)
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('replaceAllItems', () => {
    it('should replace all grocery items', async () => {
      const newItems = [createMockItem()]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.groceryItems.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.groceryItems.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.replaceAllItems(newItems)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.groceryItems.clear).toHaveBeenCalledOnce()
      expect(mockDb.groceryItems.bulkAdd).toHaveBeenCalledWith(newItems)
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('getQuickDateRange', () => {
    it('should return date range for 7 days', () => {
      const [start, end] = service.getQuickDateRange(7)

      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)

      const daysDiff = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(6)
    })

    it('should return date range for 14 days', () => {
      const [start, end] = service.getQuickDateRange(14)

      const daysDiff = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(13)
    })

    it('should return date range for 30 days', () => {
      const [start, end] = service.getQuickDateRange(30)

      const daysDiff = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(29)
    })
  })

  describe('generateDefaultListName', () => {
    it('should generate default name with date', () => {
      const date = new Date('2026-01-28')
      const name = service.generateDefaultListName(date)

      expect(name).toContain('Grocery List')
      expect(name).toContain('2026')
    })
  })

  describe('getMostRecentList', () => {
    it('should return most recent list', () => {
      const lists = [
        {
          id: '1',
          name: 'Old',
          createdAt: 1000,
          updatedAt: 1000,
          dateRange: { start: '2026-01-01', end: '2026-01-07' },
        },
        {
          id: '2',
          name: 'Recent',
          createdAt: 3000,
          updatedAt: 3000,
          dateRange: { start: '2026-01-01', end: '2026-01-07' },
        },
        {
          id: '3',
          name: 'Middle',
          createdAt: 2000,
          updatedAt: 2000,
          dateRange: { start: '2026-01-01', end: '2026-01-07' },
        },
      ]

      const result = service.getMostRecentList(lists)

      expect(result?.id).toBe('2')
    })

    it('should return undefined for empty array', () => {
      const result = service.getMostRecentList([])

      expect(result).toBeUndefined()
    })
  })

  describe('separateCheckedItems', () => {
    it('should separate checked and unchecked items', () => {
      const items = [
        createMockItem({ id: '1', checked: false }),
        createMockItem({ id: '2', checked: true }),
        createMockItem({ id: '3', checked: false }),
        createMockItem({ id: '4', checked: true }),
      ]

      const result = service.separateCheckedItems(items)

      expect(result.unchecked).toHaveLength(2)
      expect(result.checked).toHaveLength(2)
      expect(result.unchecked[0].id).toBe('1')
      expect(result.checked[0].id).toBe('2')
    })

    it('should handle all unchecked items', () => {
      const items = [
        createMockItem({ id: '1', checked: false }),
        createMockItem({ id: '2', checked: false }),
      ]

      const result = service.separateCheckedItems(items)

      expect(result.unchecked).toHaveLength(2)
      expect(result.checked).toHaveLength(0)
    })
  })

  describe('groupItemsByCategory', () => {
    it('should group items by category', () => {
      const items = [
        createMockItem({ id: '1', category: 'Vegetables' }),
        createMockItem({ id: '2', category: 'Meat' }),
        createMockItem({ id: '3', category: 'Vegetables' }),
      ]

      const result = service.groupItemsByCategory(items)

      expect(result['Vegetables']).toHaveLength(2)
      expect(result['Meat']).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const result = service.groupItemsByCategory([])

      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('getSortedCategories', () => {
    it('should return sorted category names', () => {
      const grouped = {
        Vegetables: [createMockItem()],
        Meat: [createMockItem()],
        Dairy: [createMockItem()],
      }

      const result = service.getSortedCategories(grouped)

      expect(result).toEqual(['Dairy', 'Meat', 'Vegetables'])
    })

    it('should handle empty object', () => {
      const result = service.getSortedCategories({})

      expect(result).toHaveLength(0)
    })
  })
})
