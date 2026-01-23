import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import * as idGenerator from '../utils/idGenerator'

import { GroceryListProvider, useGroceryLists } from './GroceryListContext'

import type { GroceryList, GroceryItem } from '../types/groceryList'

// Mock the storage service and ID generator
const mockStorageServiceInstance = {
  loadGroceryLists: vi.fn(),
  saveGroceryLists: vi.fn(),
  loadGroceryItems: vi.fn(),
  saveGroceryItems: vi.fn(),
}

vi.mock('../utils/storage/groceryListStorage', () => ({
  GroceryListStorageService: vi.fn(function () {
    return mockStorageServiceInstance
  }),
}))
vi.mock('../utils/idGenerator', () => ({
  generateId: vi.fn(),
}))

describe('GroceryListContext', () => {
  let mockStorageService: {
    loadGroceryLists: ReturnType<typeof vi.fn>
    saveGroceryLists: ReturnType<typeof vi.fn>
    loadGroceryItems: ReturnType<typeof vi.fn>
    saveGroceryItems: ReturnType<typeof vi.fn>
  }

  const mockGroceryLists: GroceryList[] = [
    {
      id: '1',
      name: 'Week of Jan 23',
      dateRange: {
        start: '2026-01-23',
        end: '2026-01-30',
      },
      createdAt: 1000,
    },
    {
      id: '2',
      name: 'Week of Jan 30',
      dateRange: {
        start: '2026-01-30',
        end: '2026-02-06',
      },
      createdAt: 2000,
    },
  ]

  const mockGroceryItems: GroceryItem[] = [
    {
      id: 'item-1',
      listId: '1',
      name: 'Banana',
      quantity: 2,
      unit: 'cup',
      checked: false,
      category: 'Fruits',
      mealPlanIds: ['meal-1'],
    },
  ]

  beforeEach(() => {
    mockStorageService = mockStorageServiceInstance
    mockStorageService.loadGroceryLists = vi
      .fn()
      .mockReturnValue(mockGroceryLists)
    mockStorageService.saveGroceryLists = vi.fn()
    mockStorageService.loadGroceryItems = vi
      .fn()
      .mockReturnValue(mockGroceryItems)
    mockStorageService.saveGroceryItems = vi.fn()

    vi.mocked(idGenerator.generateId).mockReturnValue('new-id-123')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Provider initialization', () => {
    it('should load grocery lists on mount', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      // Lists load synchronously on mount
      expect(result.current.groceryLists).toEqual(mockGroceryLists)
      expect(result.current.groceryItems).toEqual(mockGroceryItems)
      expect(mockStorageService.loadGroceryLists).toHaveBeenCalledTimes(1)
      expect(mockStorageService.loadGroceryItems).toHaveBeenCalledTimes(1)
    })

    it('should handle empty grocery lists', () => {
      mockStorageService.loadGroceryLists.mockReturnValue([])
      mockStorageService.loadGroceryItems.mockReturnValue([])

      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      expect(result.current.groceryLists).toEqual([])
      expect(result.current.groceryItems).toEqual([])
    })

    it('should handle loading errors', () => {
      mockStorageService.loadGroceryLists.mockImplementation(() => {
        throw new Error('Load error')
      })

      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      expect(result.current.error).toBe('Failed to load grocery data')
      expect(result.current.groceryLists).toEqual([])
      expect(result.current.groceryItems).toEqual([])
    })
  })

  describe('getGroceryListById', () => {
    it('should return grocery list by id from in-memory state', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const list = result.current.getGroceryListById('1')
      expect(list).toEqual(mockGroceryLists[0])
    })

    it('return undefined for non-existent id', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const list = result.current.getGroceryListById('non-existent')
      expect(list).toBeUndefined()
    })
  })

  describe('generateGroceryList', () => {
    it('generate and save a new grocery list', () => {
      mockStorageService.loadGroceryLists.mockReturnValue([])
      mockStorageService.loadGroceryItems.mockReturnValue([])

      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const newList: GroceryList = {
        id: 'new-id-123',
        name: 'New List',
        dateRange: {
          start: '2026-01-23',
          end: '2026-01-30',
        },
        createdAt: Date.now(),
      }

      const newItems: GroceryItem[] = []

      act(() => {
        result.current.generateGroceryList(newList, newItems)
      })

      expect(result.current.groceryLists).toHaveLength(1)
      expect(result.current.groceryLists[0]).toEqual(newList)
      expect(mockStorageService.saveGroceryLists).toHaveBeenCalledWith([
        newList,
      ])
      expect(mockStorageService.saveGroceryItems).toHaveBeenCalledWith([])
    })

    it('update lastModified timestamp when generating', () => {
      mockStorageService.loadGroceryLists.mockReturnValue([])
      mockStorageService.loadGroceryItems.mockReturnValue([])

      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const beforeTime = Date.now()

      const newList: GroceryList = {
        id: 'new-id-123',
        name: 'New List',
        dateRange: {
          start: '2026-01-23',
          end: '2026-01-30',
        },
        createdAt: beforeTime,
      }

      act(() => {
        result.current.generateGroceryList(newList, [])
      })

      expect(result.current.getLastModified()).toBeGreaterThanOrEqual(
        beforeTime
      )
    })
  })

  describe('updateGroceryList', () => {
    it('update an existing grocery list', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const updatedList: GroceryList = {
        ...mockGroceryLists[0],
        name: 'Updated Name',
      }

      act(() => {
        result.current.updateGroceryList(updatedList)
      })

      expect(result.current.groceryLists[0].name).toBe('Updated Name')
      expect(mockStorageService.saveGroceryLists).toHaveBeenCalled()
    })

    it('update lastModified timestamp', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const updateTime = Date.now()
      const updatedList: GroceryList = {
        ...mockGroceryLists[0],
        name: 'Updated Name',
      }

      act(() => {
        result.current.updateGroceryList(updatedList)
      })

      expect(result.current.getLastModified()).toBeGreaterThanOrEqual(
        updateTime
      )
    })

    it('not modify other lists', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const updatedList: GroceryList = {
        ...mockGroceryLists[0],
        name: 'Updated Name',
      }

      act(() => {
        result.current.updateGroceryList(updatedList)
      })

      expect(result.current.groceryLists[1]).toEqual(mockGroceryLists[1])
    })
  })

  describe('deleteGroceryList', () => {
    it('delete a grocery list', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      act(() => {
        result.current.deleteGroceryList('1')
      })

      expect(result.current.groceryLists).toHaveLength(1)
      expect(result.current.groceryLists[0].id).toBe('2')
      expect(mockStorageService.saveGroceryLists).toHaveBeenCalled()
    })

    it('handle deleting non-existent list', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      act(() => {
        result.current.deleteGroceryList('non-existent')
      })

      expect(result.current.groceryLists).toHaveLength(2)
    })
  })

  describe('addGroceryItem', () => {
    it('add an item to a grocery list', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const newItem: GroceryItem = {
        id: 'item-2',
        listId: '1',
        name: 'Milk',
        quantity: 1,
        unit: 'liter',
        checked: false,
        category: 'Dairy',
        mealPlanIds: ['meal-2'],
      }

      act(() => {
        result.current.addGroceryItem(newItem)
      })

      const items = result.current.getItemsForList('1')
      expect(items).toHaveLength(2)
      expect(items[1]).toEqual(newItem)
      expect(mockStorageService.saveGroceryItems).toHaveBeenCalled()
    })

    it('update lastModified when adding item', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const originalLastModified = result.current.getLastModified()

      const newItem: GroceryItem = {
        id: 'item-2',
        listId: '1',
        name: 'Milk',
        quantity: 1,
        unit: 'liter',
        checked: false,
        category: 'Dairy',
        mealPlanIds: ['meal-2'],
      }

      act(() => {
        result.current.addGroceryItem(newItem)
      })

      const updatedLastModified = result.current.getLastModified()
      expect(updatedLastModified).toBeGreaterThanOrEqual(originalLastModified)
    })
  })

  describe('updateGroceryItem', () => {
    it('update an existing item', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      act(() => {
        result.current.updateGroceryItem('item-1', {
          quantity: 5,
          checked: true,
        })
      })

      const items = result.current.getItemsForList('1')
      expect(items[0].quantity).toBe(5)
      expect(items[0].checked).toBe(true)
      expect(mockStorageService.saveGroceryItems).toHaveBeenCalled()
    })

    it('update lastModified when updating item', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const originalLastModified = result.current.getLastModified()

      act(() => {
        result.current.updateGroceryItem('item-1', { quantity: 5 })
      })

      const updatedLastModified = result.current.getLastModified()
      expect(updatedLastModified).toBeGreaterThanOrEqual(originalLastModified)
    })
  })

  describe('removeGroceryItem', () => {
    it('remove an item from a grocery list', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      act(() => {
        result.current.removeGroceryItem('item-1')
      })

      const items = result.current.getItemsForList('1')
      expect(items).toHaveLength(0)
      expect(mockStorageService.saveGroceryItems).toHaveBeenCalled()
    })

    it('update lastModified when removing item', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const originalLastModified = result.current.getLastModified()

      act(() => {
        result.current.removeGroceryItem('item-1')
      })

      const updatedLastModified = result.current.getLastModified()
      expect(updatedLastModified).toBeGreaterThanOrEqual(originalLastModified)
    })
  })

  describe('getLastModified', () => {
    it('return the lastModified timestamp', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const lastModified = result.current.getLastModified()
      // getLastModified returns Date.now() which should be current time
      expect(lastModified).toBeGreaterThan(0)
    })

    it('return current timestamp when no lists exist', () => {
      mockStorageService.loadGroceryLists.mockReturnValue([])
      mockStorageService.loadGroceryItems.mockReturnValue([])

      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const lastModified = result.current.getLastModified()
      // Even with no lists, returns Date.now()
      expect(lastModified).toBeGreaterThan(0)
    })
  })

  describe('replaceAllGroceryLists', () => {
    it('replace all grocery lists', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      const newLists: GroceryList[] = [
        {
          id: '3',
          name: 'New List',
          dateRange: {
            start: '2026-02-01',
            end: '2026-02-07',
          },
          createdAt: 3000,
        },
      ]

      act(() => {
        result.current.replaceAllGroceryLists(newLists)
      })

      expect(result.current.groceryLists).toEqual(newLists)
      expect(result.current.groceryLists).toHaveLength(1)
      expect(mockStorageService.saveGroceryLists).toHaveBeenCalledWith(newLists)
    })

    it('handle empty replacement', () => {
      const { result } = renderHook(() => useGroceryLists(), {
        wrapper: GroceryListProvider,
      })

      act(() => {
        result.current.replaceAllGroceryLists([])
      })

      expect(result.current.groceryLists).toEqual([])
      expect(mockStorageService.saveGroceryLists).toHaveBeenCalledWith([])
    })
  })
})
