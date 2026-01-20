import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

import { IngredientStorageService } from '../utils/storage/IngredientStorage'

import type { IngredientItem } from '../types/recipe'

interface IngredientContextType {
  ingredients: IngredientItem[]
  getIngredientById: (id: string) => IngredientItem | undefined
  addIngredient: (ingredient: Omit<IngredientItem, 'id'>) => void
  updateIngredient: (ingredient: IngredientItem) => void
  deleteIngredient: (id: string) => void
}

const IngredientContext = createContext<IngredientContextType | undefined>(
  undefined
)

export const IngredientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([])

  // Load ingredients from storage on mount
  useEffect(() => {
    const loadedIngredients = IngredientStorageService.loadIngredients()
    setIngredients(loadedIngredients)
  }, [])

  const getIngredientById = (id: string): IngredientItem | undefined => {
    return ingredients.find(ingredient => ingredient.id === id)
  }

  const addIngredient = (ingredient: Omit<IngredientItem, 'id'>): void => {
    const newIngredient: IngredientItem = {
      id: IngredientStorageService.generateId(),
      ...ingredient,
    }

    const updatedIngredients = [...ingredients, newIngredient]
    setIngredients(updatedIngredients)
    IngredientStorageService.saveIngredients(updatedIngredients)
  }

  const updateIngredient = (ingredient: IngredientItem): void => {
    const index = ingredients.findIndex(i => i.id === ingredient.id)
    if (index === -1) return

    const updatedIngredients = [...ingredients]
    updatedIngredients[index] = ingredient
    setIngredients(updatedIngredients)
    IngredientStorageService.saveIngredients(updatedIngredients)
  }

  const deleteIngredient = (id: string): void => {
    const updatedIngredients = ingredients.filter(
      ingredient => ingredient.id !== id
    )
    if (updatedIngredients.length === ingredients.length) return

    setIngredients(updatedIngredients)
    IngredientStorageService.saveIngredients(updatedIngredients)
  }

  return (
    <IngredientContext.Provider
      value={{
        ingredients,
        getIngredientById,
        addIngredient,
        updateIngredient,
        deleteIngredient,
      }}
    >
      {children}
    </IngredientContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useIngredients = (): IngredientContextType => {
  const context = useContext(IngredientContext)
  if (!context) {
    throw new Error('useIngredients must be used within an IngredientProvider')
  }
  return context
}
