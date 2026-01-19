import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'

import { Recipe, RecipeInput } from '../types/recipe'
import { RecipeStorageService } from '../utils/storage/RecipeStorage'

interface RecipeContextType {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  getRecipeById: (id: string) => Recipe | null
  addRecipe: (recipe: RecipeInput) => void
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
      setError(null)
    } catch (err) {
      console.error('Failed to load recipes:', err)
      setError('Failed to load recipes')
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }, [storageService])

  // Get recipe by ID from in-memory state
  const getRecipeById = useCallback(
    (id: string): Recipe | null => {
      return recipes.find(recipe => recipe.id === id) || null
    },
    [recipes],
  )

  // Add new recipe to state and persist
  const addRecipe = useCallback(
    (recipeInput: RecipeInput): void => {
      const now = new Date().toISOString()
      const newRecipe: Recipe = {
        ...recipeInput,
        id: storageService.generateId(),
        createdAt: now,
        updatedAt: now,
      }

      const updatedRecipes = [...recipes, newRecipe]
      setRecipes(updatedRecipes)
      storageService.saveRecipes(updatedRecipes)
    },
    [recipes, storageService],
  )

  // Update existing recipe in state and persist
  const updateRecipe = useCallback(
    (recipe: Recipe): void => {
      const index = recipes.findIndex(r => r.id === recipe.id)
      if (index === -1) {
        return // Recipe not found, do nothing
      }

      const now = new Date().toISOString()
      const updatedRecipe: Recipe = {
        ...recipe,
        updatedAt: now,
      }

      const updatedRecipes = [...recipes]
      updatedRecipes[index] = updatedRecipe
      setRecipes(updatedRecipes)
      storageService.saveRecipes(updatedRecipes)
    },
    [recipes, storageService],
  )

  // Delete recipe from state and persist
  const deleteRecipe = useCallback(
    (id: string): void => {
      const updatedRecipes = recipes.filter(recipe => recipe.id !== id)

      // Only update if a recipe was actually removed
      if (updatedRecipes.length !== recipes.length) {
        setRecipes(updatedRecipes)
        storageService.saveRecipes(updatedRecipes)
      }
    },
    [recipes, storageService],
  )

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        error,
        getRecipeById,
        addRecipe,
        updateRecipe,
        deleteRecipe,
      }}
    >
      {children}
    </RecipeContext.Provider>
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
