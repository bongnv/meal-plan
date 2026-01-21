/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

import { generateId } from '../utils/idGenerator'
import { IngredientStorageService } from '../utils/storage/IngredientStorage'

import type { Ingredient, IngredientFormValues } from '../types/ingredient'

interface IngredientContextValue {
  ingredients: Ingredient[]
  loading: boolean
  error: string | null
  getIngredientById: (id: string) => Ingredient | undefined
  addIngredient: (ingredient: IngredientFormValues) => Promise<void>
  updateIngredient: (ingredient: Ingredient) => Promise<void>
  deleteIngredient: (id: string) => Promise<void>
  replaceAllIngredients: (ingredients: Ingredient[]) => void
  getLastModified: () => number
}

const IngredientContext = createContext<IngredientContextValue | undefined>(
  undefined
)

export function IngredientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastModified, setLastModified] = useState<number>(Date.now())

  // Load ingredients on mount
  useEffect(() => {
    const storage = new IngredientStorageService()
    try {
      const loadedIngredients = storage.loadIngredients()
      setIngredients(loadedIngredients)
      setError(null)
    } catch (err) {
      console.error('Failed to load ingredients:', err)
      setError('Failed to load ingredients')
      setIngredients([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getIngredientById = (id: string): Ingredient | undefined => {
    return ingredients.find(ingredient => ingredient.id === id)
  }

  const addIngredient = async (
    ingredientData: IngredientFormValues
  ): Promise<void> => {
    const storage = new IngredientStorageService()
    try {
      const newIngredient: Ingredient = {
        ...ingredientData,
        id: generateId(),
      }
      const updatedIngredients = [...ingredients, newIngredient]
      storage.saveIngredients(updatedIngredients)
      setIngredients(updatedIngredients)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      setError('Failed to add ingredient')
      throw err
    }
  }

  const updateIngredient = async (ingredient: Ingredient): Promise<void> => {
    const storage = new IngredientStorageService()
    try {
      const updatedIngredients = ingredients.map(i =>
        i.id === ingredient.id ? ingredient : i
      )
      storage.saveIngredients(updatedIngredients)
      setIngredients(updatedIngredients)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      setError('Failed to update ingredient')
      throw err
    }
  }

  const deleteIngredient = async (id: string): Promise<void> => {
    const storage = new IngredientStorageService()
    try {
      const updatedIngredients = ingredients.filter(i => i.id !== id)
      storage.saveIngredients(updatedIngredients)
      setIngredients(updatedIngredients)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      setError('Failed to delete ingredient')
      throw err
    }
  }

  // Replace all ingredients (used for sync)
  const replaceAllIngredients = (newIngredients: Ingredient[]): void => {
    const storage = new IngredientStorageService()
    try {
      storage.saveIngredients(newIngredients)
      setIngredients(newIngredients)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to replace ingredients:', err)
      setError('Failed to replace ingredients')
    }
  }

  // Get last modified timestamp
  const getLastModified = (): number => {
    return lastModified
  }

  return (
    <IngredientContext.Provider
      value={{
        ingredients,
        loading,
        error,
        getIngredientById,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        replaceAllIngredients,
        getLastModified,
      }}
    >
      {children}
    </IngredientContext.Provider>
  )
}

export function useIngredients(): IngredientContextValue {
  const context = useContext(IngredientContext)
  if (context === undefined) {
    throw new Error('useIngredients must be used within an IngredientProvider')
  }
  return context
}
