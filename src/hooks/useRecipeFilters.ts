import { useState, useMemo } from 'react'

import type { TimeRange } from '../services/recipeService'

export interface RecipeFilterState {
  searchText: string
  selectedTags: string[]
  selectedIngredients: string[]
  timeRange: TimeRange
}

export interface RecipeFilterActions {
  setSearchText: (text: string) => void
  setSelectedTags: (tags: string[]) => void
  setSelectedIngredients: (ingredients: string[]) => void
  setTimeRange: (range: TimeRange) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

export interface UseRecipeFiltersReturn {
  filters: RecipeFilterState
  actions: RecipeFilterActions
}

/**
 * Custom hook for managing recipe filter state
 * Provides filter state and actions for search, tags, ingredients, and time range
 * @returns Filter state and actions
 */
export function useRecipeFilters(): UseRecipeFiltersReturn {
  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>(null)

  const hasActiveFilters = useMemo(
    () =>
      searchText !== '' ||
      selectedTags.length > 0 ||
      selectedIngredients.length > 0 ||
      timeRange !== null,
    [searchText, selectedTags, selectedIngredients, timeRange]
  )

  const clearFilters = () => {
    setSearchText('')
    setSelectedTags([])
    setSelectedIngredients([])
    setTimeRange(null)
  }

  return {
    filters: {
      searchText,
      selectedTags,
      selectedIngredients,
      timeRange,
    },
    actions: {
      setSearchText,
      setSelectedTags,
      setSelectedIngredients,
      setTimeRange,
      clearFilters,
      hasActiveFilters,
    },
  }
}
