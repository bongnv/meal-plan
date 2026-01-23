import { createContext, useContext, useState, type ReactNode } from 'react'

import { GroceryListStorageService } from '../utils/storage/groceryListStorage'

import type { GroceryList, GroceryItem } from '../types/groceryList'

interface GroceryListContextType {
  groceryLists: GroceryList[]
  groceryItems: GroceryItem[]
  loading: boolean
  error: string | null
  getGroceryListById: (id: string) => GroceryList | undefined
  getItemsForList: (listId: string) => GroceryItem[]
  generateGroceryList: (list: GroceryList, items: GroceryItem[]) => void
  updateGroceryList: (list: GroceryList) => void
  deleteGroceryList: (id: string) => void
  addGroceryItem: (item: GroceryItem) => void
  updateGroceryItem: (itemId: string, updates: Partial<GroceryItem>) => void
  removeGroceryItem: (itemId: string) => void
  getLastModified: () => number
  replaceAllGroceryLists: (lists: GroceryList[]) => void
  replaceAllGroceryItems: (items: GroceryItem[]) => void
}

const GroceryListContext = createContext<GroceryListContextType | undefined>(
  undefined
)

export function GroceryListProvider({ children }: { children: ReactNode }) {
  const [storageService] = useState(() => new GroceryListStorageService())

  // Load grocery lists and items, capture any initialization error
  const [groceryListsState, setGroceryListsState] = useState<{
    groceryLists: GroceryList[]
    groceryItems: GroceryItem[]
    error: string | null
  }>(() => {
    try {
      return {
        groceryLists: storageService.loadGroceryLists(),
        groceryItems: storageService.loadGroceryItems(),
        error: null,
      }
    } catch (err) {
      console.error('Failed to load grocery data:', err)
      return {
        groceryLists: [],
        groceryItems: [],
        error: 'Failed to load grocery data',
      }
    }
  })

  const groceryLists = groceryListsState.groceryLists
  const groceryItems = groceryListsState.groceryItems

  const setGroceryLists = (newLists: GroceryList[]) => {
    setGroceryListsState({
      ...groceryListsState,
      groceryLists: newLists,
    })
  }

  const setGroceryItems = (newItems: GroceryItem[]) => {
    setGroceryListsState({
      ...groceryListsState,
      groceryItems: newItems,
    })
  }

  const [loading, _setLoading] = useState(false)
  const [error, setError] = useState<string | null>(groceryListsState.error)
  const [lastModified, setLastModified] = useState<number>(() => Date.now())

  // Get grocery list by ID from in-memory state
  const getGroceryListById = (id: string): GroceryList | undefined => {
    return groceryLists.find(list => list.id === id)
  }

  // Get all items for a specific list
  const getItemsForList = (listId: string): GroceryItem[] => {
    return groceryItems.filter(item => item.listId === listId)
  }

  // Generate (add) a new grocery list with its items and persist
  const generateGroceryList = (
    list: GroceryList,
    items: GroceryItem[]
  ): void => {
    try {
      const updatedLists = [...groceryLists, list]
      const updatedItems = [...groceryItems, ...items]
      setGroceryListsState({
        groceryLists: updatedLists,
        groceryItems: updatedItems,
        error: null,
      })
      storageService.saveGroceryLists(updatedLists)
      storageService.saveGroceryItems(updatedItems)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to generate grocery list:', err)
      setError('Failed to generate grocery list')
    }
  }

  // Update an existing grocery list and persist
  const updateGroceryList = (list: GroceryList): void => {
    try {
      const index = groceryLists.findIndex(l => l.id === list.id)
      if (index === -1) {
        return // List not found, do nothing
      }
      const updatedLists = [...groceryLists]
      updatedLists[index] = list
      setGroceryLists(updatedLists)
      storageService.saveGroceryLists(updatedLists)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to update grocery list:', err)
      setError('Failed to update grocery list')
    }
  }

  // Delete a grocery list by ID and all its items, then persist
  const deleteGroceryList = (id: string): void => {
    try {
      const updatedLists = groceryLists.filter(list => list.id !== id)
      const updatedItems = groceryItems.filter(item => item.listId !== id)
      setGroceryListsState({
        groceryLists: updatedLists,
        groceryItems: updatedItems,
        error: null,
      })
      storageService.saveGroceryLists(updatedLists)
      storageService.saveGroceryItems(updatedItems)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to delete grocery list:', err)
      setError('Failed to delete grocery list')
    }
  }

  // Add a new item to the items collection
  const addGroceryItem = (item: GroceryItem): void => {
    try {
      const updatedItems = [...groceryItems, item]
      setGroceryItems(updatedItems)
      storageService.saveGroceryItems(updatedItems)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to add grocery item:', err)
      setError('Failed to add grocery item')
    }
  }

  // Update an item in the items collection
  const updateGroceryItem = (
    itemId: string,
    updates: Partial<GroceryItem>
  ): void => {
    try {
      const updatedItems = groceryItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
      setGroceryItems(updatedItems)
      storageService.saveGroceryItems(updatedItems)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to update grocery item:', err)
      setError('Failed to update grocery item')
    }
  }

  // Remove an item from the items collection
  const removeGroceryItem = (itemId: string): void => {
    try {
      const updatedItems = groceryItems.filter(item => item.id !== itemId)
      setGroceryItems(updatedItems)
      storageService.saveGroceryItems(updatedItems)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to remove grocery item:', err)
      setError('Failed to remove grocery item')
    }
  }

  // Get the max lastModified timestamp for sync
  const getLastModified = (): number => {
    return lastModified
  }

  // Replace all grocery lists (for sync)
  const replaceAllGroceryLists = (lists: GroceryList[]): void => {
    try {
      setGroceryLists(lists)
      storageService.saveGroceryLists(lists)
      setError(null)
    } catch (err) {
      console.error('Failed to replace grocery lists:', err)
      setError('Failed to replace grocery lists')
    }
  }

  // Replace all grocery items (for sync)
  const replaceAllGroceryItems = (items: GroceryItem[]): void => {
    try {
      setGroceryItems(items)
      storageService.saveGroceryItems(items)
      setError(null)
    } catch (err) {
      console.error('Failed to replace grocery items:', err)
      setError('Failed to replace grocery items')
    }
  }

  return (
    <GroceryListContext.Provider
      value={{
        groceryLists,
        groceryItems,
        loading,
        error,
        getGroceryListById,
        getItemsForList,
        generateGroceryList,
        updateGroceryList,
        deleteGroceryList,
        addGroceryItem,
        updateGroceryItem,
        removeGroceryItem,
        getLastModified,
        replaceAllGroceryLists,
        replaceAllGroceryItems,
      }}
    >
      {children}
    </GroceryListContext.Provider>
  )
}

export function useGroceryLists() {
  const context = useContext(GroceryListContext)
  if (!context) {
    throw new Error('useGroceryLists must be used within a GroceryListProvider')
  }
  return context
}
