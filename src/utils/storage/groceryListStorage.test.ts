import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { generateId } from '../idGenerator'

import { GroceryListStorageService } from './groceryListStorage'

import type { GroceryList } from '../../types/groceryList'

describe('GroceryListStorageService', () => {
  let service: GroceryListStorageService

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    service = new GroceryListStorageService()
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

  describe('loadGroceryLists', () => {
    it('should return an empty array when no grocery lists are stored', () => {
      const lists = service.loadGroceryLists()
      expect(lists).toEqual([])
    })

    it('should load grocery lists from localStorage', () => {
      const mockLists: GroceryList[] = [
        {
          id: '1',
          name: 'Week of Jan 23',
          dateRange: {
            start: '2026-01-23',
            end: '2026-01-30',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      localStorage.setItem('groceryLists', JSON.stringify(mockLists))

      const lists = service.loadGroceryLists()
      expect(lists).toEqual(mockLists)
    })

    it('should throw error if localStorage data is corrupted', () => {
      localStorage.setItem('groceryLists', 'invalid json')

      expect(() => service.loadGroceryLists()).toThrow()
    })

    it('should throw error if data fails Zod validation', () => {
      const invalidLists = [
        {
          id: '1',
          name: 'Invalid List',
          // missing required fields like dateRange, createdAt, etc.
        },
      ]

      localStorage.setItem('groceryLists', JSON.stringify(invalidLists))

      expect(() => service.loadGroceryLists()).toThrow()
    })

    it('should handle valid grocery lists with various item types', () => {
      const mockLists: GroceryList[] = [
        {
          id: '1',
          name: 'Mixed List',
          dateRange: {
            start: '2026-01-23',
            end: '2026-01-30',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      localStorage.setItem('groceryLists', JSON.stringify(mockLists))

      const lists = service.loadGroceryLists()
      expect(lists).toEqual(mockLists)
    })
  })

  describe('saveGroceryLists', () => {
    it('should save grocery lists to localStorage', () => {
      const mockLists: GroceryList[] = [
        {
          id: '1',
          name: 'Week of Jan 23',
          dateRange: {
            start: '2026-01-23',
            end: '2026-01-30',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      service.saveGroceryLists(mockLists)

      const stored = localStorage.getItem('groceryLists')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(mockLists)
    })

    it('should overwrite existing grocery lists', () => {
      const firstLists: GroceryList[] = [
        {
          id: '1',
          name: 'First List',
          dateRange: {
            start: '2026-01-23',
            end: '2026-01-30',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const secondLists: GroceryList[] = [
        {
          id: '2',
          name: 'Second List',
          dateRange: {
            start: '2026-01-30',
            end: '2026-02-06',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      service.saveGroceryLists(firstLists)
      service.saveGroceryLists(secondLists)

      const stored = localStorage.getItem('groceryLists')
      expect(JSON.parse(stored!)).toEqual(secondLists)
      expect(JSON.parse(stored!)).toHaveLength(1)
      expect(JSON.parse(stored!)[0].id).toBe('2')
    })

    it('should handle empty array', () => {
      service.saveGroceryLists([])

      const stored = localStorage.getItem('groceryLists')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual([])
    })

    it('should validate data before saving', () => {
      const invalidLists = [
        {
          id: '1',
          // missing required fields
        },
      ] as unknown as GroceryList[]

      expect(() => service.saveGroceryLists(invalidLists)).toThrow()
    })
  })

  describe('loadGroceryItems', () => {
    it('should return an empty array when no grocery items are stored', () => {
      const items = service.loadGroceryItems()
      expect(items).toEqual([])
    })

    it('should load grocery items from localStorage', () => {
      const mockItems = [
        {
          id: '1',
          listId: 'list1',
          name: 'Flour',
          quantity: 2,
          unit: 'cup' as const,
          category: 'Baking' as const,
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      localStorage.setItem('groceryItems', JSON.stringify(mockItems))

      const items = service.loadGroceryItems()
      expect(items).toEqual(mockItems)
    })

    it('should throw error if localStorage data is corrupted', () => {
      localStorage.setItem('groceryItems', 'invalid json')

      expect(() => service.loadGroceryItems()).toThrow()
    })

    it('should throw error if data fails Zod validation', () => {
      const invalidItems = [
        {
          id: '1',
          // missing required fields
        },
      ]

      localStorage.setItem('groceryItems', JSON.stringify(invalidItems))

      expect(() => service.loadGroceryItems()).toThrow()
    })
  })

  describe('saveGroceryItems', () => {
    it('should save grocery items to localStorage', () => {
      const mockItems = [
        {
          id: '1',
          listId: 'list1',
          name: 'Flour',
          quantity: 2,
          unit: 'cup' as const,
          category: 'Baking' as const,
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      service.saveGroceryItems(mockItems)

      const stored = localStorage.getItem('groceryItems')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(mockItems)
    })

    it('should overwrite existing grocery items', () => {
      const firstItems = [
        {
          id: '1',
          listId: 'list1',
          name: 'Flour',
          quantity: 2,
          unit: 'cup' as const,
          category: 'Baking' as const,
          checked: false,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const secondItems = [
        {
          id: '2',
          listId: 'list2',
          name: 'Sugar',
          quantity: 3,
          unit: 'tablespoon' as const,
          category: 'Baking' as const,
          checked: true,
          mealPlanIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      service.saveGroceryItems(firstItems)
      service.saveGroceryItems(secondItems)

      const stored = localStorage.getItem('groceryItems')
      expect(JSON.parse(stored!)).toEqual(secondItems)
      expect(JSON.parse(stored!)).toHaveLength(1)
      expect(JSON.parse(stored!)[0].id).toBe('2')
    })

    it('should handle empty array', () => {
      service.saveGroceryItems([])

      const stored = localStorage.getItem('groceryItems')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual([])
    })

    it('should validate data before saving', () => {
      const invalidItems = [
        {
          id: '1',
          // missing required fields
        },
      ] as any

      expect(() => service.saveGroceryItems(invalidItems)).toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage to throw quota exceeded error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const mockLists: GroceryList[] = [
        {
          id: '1',
          name: 'Test List',
          dateRange: {
            start: '2026-01-23',
            end: '2026-01-30',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      expect(() => service.saveGroceryLists(mockLists)).toThrow(
        'QuotaExceededError'
      )
    })

    it('should handle localStorage not available', () => {
      // Mock localStorage to be undefined
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage is not available')
      })

      expect(() => service.loadGroceryLists()).toThrow()
    })
  })
})
