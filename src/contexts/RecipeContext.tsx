import { createContext, useContext, useState, type ReactNode } from 'react'

import { generateId } from '../utils/idGenerator'
import { RecipeStorageService } from '../utils/storage/recipeStorage'

import type { Recipe } from '../types/recipe'

interface RecipeContextType {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  getRecipeById: (id: string) => Recipe | undefined
  addRecipe: (recipe: Omit<Recipe, 'id'>) => string
  updateRecipe: (recipe: Recipe) => void
  deleteRecipe: (id: string) => void
  replaceAllRecipes: (recipes: Recipe[]) => void
  getLastModified: () => number
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined)

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [storageService] = useState(() => new RecipeStorageService())

  // Load recipes and capture any initialization error
  const [recipesState, setRecipesState] = useState<{
    recipes: Recipe[]
    error: string | null
  }>(() => {
    try {
      return {
        recipes: storageService.loadRecipes(),
        error: null,
      }
    } catch (err) {
      console.error('Failed to load recipes:', err)
      return {
        recipes: [],
        error: 'Failed to load recipes',
      }
    }
  })

  const recipes = recipesState.recipes
  const setRecipes = (newRecipes: Recipe[] | ((prev: Recipe[]) => Recipe[])) => {
    if (typeof newRecipes === 'function') {
      setRecipesState(prev => ({ recipes: newRecipes(prev.recipes), error: prev.error }))
    } else {
      setRecipesState({ recipes: newRecipes, error: recipesState.error })
    }
  }

  const [loading, _setLoading] = useState(false)
  const [error, setError] = useState<string | null>(recipesState.error)
  const [lastModified, setLastModified] = useState<number>(() => Date.now())

  // Get recipe by ID from in-memory state
  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.id === id)
  }

  // Add recipe to in-memory state and persist
  const addRecipe = (recipe: Omit<Recipe, 'id'>): string => {
    try {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
      }
      // Use functional update to avoid stale state when adding multiple recipes in succession
      setRecipes(prevRecipes => {
        const updatedRecipes = [...prevRecipes, newRecipe]
        storageService.saveRecipes(updatedRecipes)
        return updatedRecipes
      })
      setLastModified(Date.now())
      setError(null)
      return newRecipe.id
    } catch (err) {
      console.error('Failed to add recipe:', err)
      setError('Failed to add recipe')
      // Return a generated ID even if save fails (recipe is in memory)
      const fallbackId = generateId()
      return fallbackId
    }
  }

  // Update recipe in in-memory state and persist
  const updateRecipe = (recipe: Recipe): void => {
    try {
      const index = recipes.findIndex(r => r.id === recipe.id)
      if (index === -1) {
        return // Recipe not found, do nothing
      }
      const updatedRecipes = [...recipes]
      updatedRecipes[index] = recipe
      setRecipes(updatedRecipes)
      storageService.saveRecipes(updatedRecipes)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to update recipe:', err)
      setError('Failed to update recipe')
    }
  }

  // Delete recipe from in-memory state and persist
  const deleteRecipe = (id: string): void => {
    try {
      const updatedRecipes = recipes.filter(recipe => recipe.id !== id)
      if (updatedRecipes.length === recipes.length) {
        return // Recipe not found, do nothing
      }
      setRecipes(updatedRecipes)
      storageService.saveRecipes(updatedRecipes)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to delete recipe:', err)
      setError('Failed to delete recipe')
    }
  }

  // Replace all recipes (used for sync)
  const replaceAllRecipes = (newRecipes: Recipe[]): void => {
    try {
      setRecipes(newRecipes)
      storageService.saveRecipes(newRecipes)
      setLastModified(Date.now())
      setError(null)
    } catch (err) {
      console.error('Failed to replace recipes:', err)
      setError('Failed to replace recipes')
    }
  }

  // Get last modified timestamp
  const getLastModified = (): number => {
    return lastModified
  }

  const value: RecipeContextType = {
    recipes,
    loading,
    error,
    getRecipeById,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    replaceAllRecipes,
    getLastModified,
  }

  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  )
}

export function useRecipes(): RecipeContextType {
  const context = useContext(RecipeContext)
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider')
  }
  return context
}
