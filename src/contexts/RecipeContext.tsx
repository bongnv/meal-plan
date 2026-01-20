import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

import { RecipeStorageService } from '../utils/storage/recipeStorage'
import { generateId } from '../utils/idGenerator'

import type { Recipe } from '../types/recipe'

interface RecipeContextType {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  getRecipeById: (id: string) => Recipe | undefined
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void
  updateRecipe: (recipe: Recipe) => void
  deleteRecipe: (id: string) => void
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined)

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storageService] = useState(() => new RecipeStorageService())

  // Load recipes on mount
  useEffect(() => {
    try {
      const loadedRecipes = storageService.loadRecipes()
      setRecipes(loadedRecipes)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load recipes:', err)
      setError('Failed to load recipes')
      setLoading(false)
    }
  }, [storageService])

  // Get recipe by ID from in-memory state
  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find(recipe => recipe.id === id)
  }

  // Add recipe to in-memory state and persist
  const addRecipe = (recipe: Omit<Recipe, 'id'>): void => {
    try {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
      }
      const updatedRecipes = [...recipes, newRecipe]
      setRecipes(updatedRecipes)
      storageService.saveRecipes(updatedRecipes)
      setError(null)
    } catch (err) {
      console.error('Failed to add recipe:', err)
      setError('Failed to add recipe')
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
      setError(null)
    } catch (err) {
      console.error('Failed to delete recipe:', err)
      setError('Failed to delete recipe')
    }
  }

  const value: RecipeContextType = {
    recipes,
    loading,
    error,
    getRecipeById,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  }

  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecipes(): RecipeContextType {
  const context = useContext(RecipeContext)
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider')
  }
  return context
}
