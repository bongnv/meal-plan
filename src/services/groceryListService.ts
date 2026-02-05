import { db } from '@/db/database'
import { generateId } from '@/utils/idGenerator'

import type { MealPlanDB } from '@/db/database'
import type { GroceryList, GroceryItem } from '@/types/groceryList'
import type { IngredientCategory, Unit } from '@/types/ingredient'

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
    return await db.groceryLists.filter(l => l.isDeleted !== true).toArray()
  },

  /**
   * Get all grocery items
   */
  async getAllItems(): Promise<GroceryItem[]> {
    return await db.groceryItems.filter(i => i.isDeleted !== true).toArray()
  },

  /**
   * Get grocery list by ID
   */
  async getListById(id: string): Promise<GroceryList | undefined> {
    return await db.groceryLists.get(id)
  },

  /**
   * Get grocery list by ID (alias for useLiveQuery compatibility)
   */
  async getList(id: string): Promise<GroceryList | undefined> {
    return await db.groceryLists.get(id)
  },

  /**
   * Get items for a specific list
   */
  async getItemsForList(listId: string): Promise<GroceryItem[]> {
    return await db.groceryItems
      .where('listId')
      .equals(listId)
      .filter(item => item.isDeleted !== true)
      .toArray()
  },

  /**
   * Get items for a specific list (includes potentially deleted items, alias for useLiveQuery)
   */
  async getItems(listId: string): Promise<GroceryItem[]> {
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
   * Delete a grocery list and all its items (soft delete)
   */
  async deleteList(id: string): Promise<void> {
    const now = Date.now()
    await db.transaction('rw', [db.groceryLists, db.groceryItems], async () => {
      await db.groceryLists.update(id, { isDeleted: true, updatedAt: now })
      const items = await db.groceryItems.where('listId').equals(id).toArray()
      const updates = items.map(async item =>
        db.groceryItems.update(item.id, { isDeleted: true, updatedAt: now })
      )
      await Promise.all(updates)
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
   * Add a manual grocery item (user-created, not from recipe)
   * Handles ID generation and timestamps automatically
   * @param listId ID of the grocery list
   * @param itemData Item data without ID or timestamps
   * @returns ID of the newly created item
   */
  async addManualItem(
    listId: string,
    itemData: {
      name: string
      quantity: number
      unit: Unit
      category: IngredientCategory
    }
  ): Promise<string> {
    const now = Date.now()
    const newItem: GroceryItem = {
      id: generateId(),
      listId,
      name: itemData.name,
      quantity: itemData.quantity,
      unit: itemData.unit,
      category: itemData.category,
      checked: false,
      mealPlanIds: [],
      createdAt: now,
      updatedAt: now,
    }

    await db.groceryItems.add(newItem)
    await db.updateLastModified()
    return newItem.id
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
   * Remove a grocery item (soft delete)
   */
  async removeItem(itemId: string): Promise<void> {
    await db.groceryItems.update(itemId, {
      isDeleted: true,
      updatedAt: Date.now(),
    })
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

  /**
   * Get date range for quick list generation
   * @param days Number of days from today
   * @returns Tuple of [startDate, endDate]
   */
  getQuickDateRange(days: number): [Date, Date] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)
    return [today, endDate]
  },

  /**
   * Generate default list name based on start date
   * @param startDate The start date for the list
   * @returns Formatted list name
   */
  generateDefaultListName(startDate: Date): string {
    return `Grocery List - ${startDate.toLocaleDateString()}`
  },

  /**
   * Get most recent grocery list
   * @param lists Array of grocery lists
   * @returns Most recent list or undefined if empty
   */
  getMostRecentList(lists: GroceryList[]): GroceryList | undefined {
    if (lists.length === 0) return undefined
    return [...lists].sort((a, b) => b.createdAt - a.createdAt)[0]
  },

  /**
   * Separate grocery items into checked and unchecked
   * @param items Array of grocery items
   * @returns Object with checked and unchecked arrays
   */
  separateCheckedItems(items: GroceryItem[]): {
    checked: GroceryItem[]
    unchecked: GroceryItem[]
  } {
    const checked: GroceryItem[] = []
    const unchecked: GroceryItem[] = []

    items.forEach(item => {
      if (item.checked) {
        checked.push(item)
      } else {
        unchecked.push(item)
      }
    })

    return { checked, unchecked }
  },

  /**
   * Group grocery items by category
   * @param items Array of grocery items
   * @returns Object mapping category names to arrays of items
   */
  groupItemsByCategory(items: GroceryItem[]): Record<string, GroceryItem[]> {
    const groups: Record<string, GroceryItem[]> = {}

    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })

    return groups
  },

  /**
   * Get sorted category names from grouped items
   * @param itemsByCategory Object mapping categories to items
   * @returns Sorted array of category names
   */
  getSortedCategories(
    itemsByCategory: Record<string, GroceryItem[]>
  ): string[] {
    return Object.keys(itemsByCategory).sort((a, b) => a.localeCompare(b))
  },
})

// Singleton instance
export const groceryListService = createGroceryListService(db)
