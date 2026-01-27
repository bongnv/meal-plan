import { db } from '../db/database'

import type { MealPlanDB } from '../db/database'
import type { GroceryList, GroceryItem } from '../types/groceryList'

/**
 * Grocery List Service
 * Stateless business logic for grocery list operations
 * Database instance injected via constructor
 */
export const createGroceryListService = (db: MealPlanDB) => ({
  /**
   * Get all grocery lists
   */
  async getAllLists(): Promise<GroceryList[]> {
    return await db.groceryLists.toArray()
  },

  /**
   * Get all grocery items
   */
  async getAllItems(): Promise<GroceryItem[]> {
    return await db.groceryItems.toArray()
  },

  /**
   * Get grocery list by ID
   */
  async getListById(id: string): Promise<GroceryList | undefined> {
    return await db.groceryLists.get(id)
  },

  /**
   * Get items for a specific list
   */
  async getItemsForList(listId: string): Promise<GroceryItem[]> {
    return await db.groceryItems.where('listId').equals(listId).toArray()
  },

  /**
   * Generate (create) a new grocery list with its items
   */
  async generateList(list: GroceryList, items: GroceryItem[]): Promise<void> {
    const now = Date.now()
    await db.transaction('rw', [db.groceryLists, db.groceryItems], async () => {
      await db.groceryLists.add({ ...list, updatedAt: now })
      const itemsWithTimestamps = items.map(item => ({
        ...item,
        createdAt: now,
        updatedAt: now,
      }))
      await db.groceryItems.bulkAdd(itemsWithTimestamps)
    })
    await db.updateLastModified()
  },

  /**
   * Update an existing grocery list
   */
  async updateList(list: GroceryList): Promise<void> {
    await db.groceryLists.put({ ...list, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Delete a grocery list and all its items
   */
  async deleteList(id: string): Promise<void> {
    await db.transaction('rw', [db.groceryLists, db.groceryItems], async () => {
      await db.groceryLists.delete(id)
      await db.groceryItems.where('listId').equals(id).delete()
    })
    await db.updateLastModified()
  },

  /**
   * Add a new grocery item
   */
  async addItem(item: GroceryItem): Promise<void> {
    const now = Date.now()
    await db.groceryItems.add({ ...item, createdAt: now, updatedAt: now })
    await db.updateLastModified()
  },

  /**
   * Update a grocery item
   */
  async updateItem(
    itemId: string,
    updates: Partial<GroceryItem>
  ): Promise<void> {
    await db.groceryItems.update(itemId, { ...updates, updatedAt: Date.now() })
    await db.updateLastModified()
  },

  /**
   * Remove a grocery item
   */
  async removeItem(itemId: string): Promise<void> {
    await db.groceryItems.delete(itemId)
    await db.updateLastModified()
  },

  /**
   * Replace all grocery lists (used for sync)
   */
  async replaceAllLists(lists: GroceryList[]): Promise<void> {
    await db.transaction('rw', db.groceryLists, async () => {
      await db.groceryLists.clear()
      await db.groceryLists.bulkAdd(lists)
    })
    await db.updateLastModified()
  },

  /**
   * Replace all grocery items (used for sync)
   */
  async replaceAllItems(items: GroceryItem[]): Promise<void> {
    await db.transaction('rw', db.groceryItems, async () => {
      await db.groceryItems.clear()
      await db.groceryItems.bulkAdd(items)
    })
    await db.updateLastModified()
  },
})

// Singleton instance
export const groceryListService = createGroceryListService(db)
