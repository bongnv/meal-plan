import { z } from 'zod'

import {
  GroceryListSchema,
  GroceryItemSchema,
  type GroceryList,
  type GroceryItem,
} from '../../types/groceryList'

const LISTS_STORAGE_KEY = 'groceryLists'
const ITEMS_STORAGE_KEY = 'groceryItems'

/**
 * GroceryListStorageService
 * Handles persistence of grocery lists and items to localStorage with Zod validation
 * Lists and items are stored separately to reduce sync conflicts
 */
export class GroceryListStorageService {
  /**
   * Load all grocery lists from localStorage
   * Returns empty array if no lists found
   * Validates data with Zod schema
   */
  loadGroceryLists(): GroceryList[] {
    const stored = localStorage.getItem(LISTS_STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    const validated = z.array(GroceryListSchema).parse(parsed)
    return validated
  }

  /**
   * Save grocery lists to localStorage
   * Overwrites existing lists
   * Validates data with Zod schema before saving
   */
  saveGroceryLists(lists: GroceryList[]): void {
    const validated = z.array(GroceryListSchema).parse(lists)
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(validated))
  }

  /**
   * Load all grocery items from localStorage
   * Returns empty array if no items found
   * Validates data with Zod schema
   */
  loadGroceryItems(): GroceryItem[] {
    const stored = localStorage.getItem(ITEMS_STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    const validated = z.array(GroceryItemSchema).parse(parsed)
    return validated
  }

  /**
   * Save grocery items to localStorage
   * Overwrites existing items
   * Validates data with Zod schema before saving
   */
  saveGroceryItems(items: GroceryItem[]): void {
    const validated = z.array(GroceryItemSchema).parse(items)
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(validated))
  }
}
