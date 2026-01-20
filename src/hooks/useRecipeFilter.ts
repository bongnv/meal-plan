import { useMemo } from 'react'

import type { Recipe } from '../types/recipe'

export type TimeRange = 'under-30' | '30-60' | 'over-60' | null

export interface RecipeFilters {
  searchText: string
  selectedTags: string[]
  selectedIngredients: string[]
  timeRange: TimeRange
}

/**
 * Custom hook to filter recipes based on multiple criteria
 * @param recipes - Array of recipes to filter
 * @param filters - Filter criteria
 * @returns Filtered array of recipes
 */
export function useRecipeFilter(
  recipes: Recipe[],
  filters: RecipeFilters
): Recipe[] {
  return useMemo(() => {
    return recipes.filter((recipe) => {
      // Filter by search text (name)
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        if (!recipe.name.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Filter by tags (OR logic - recipe must have at least one selected tag)
      if (filters.selectedTags.length > 0) {
        const hasMatchingTag = filters.selectedTags.some((tag) =>
          recipe.tags.includes(tag)
        )
        if (!hasMatchingTag) {
          return false
        }
      }

      // Filter by ingredients (OR logic - recipe must have at least one selected ingredient)
      if (filters.selectedIngredients.length > 0) {
        const hasMatchingIngredient = filters.selectedIngredients.some(
          (ingredientId) =>
            recipe.ingredients.some(
              (ing) => ing.ingredientId === ingredientId
            )
        )
        if (!hasMatchingIngredient) {
          return false
        }
      }

      // Filter by time range
      if (filters.timeRange) {
        switch (filters.timeRange) {
          case 'under-30':
            if (recipe.totalTime >= 30) return false
            break
          case '30-60':
            if (recipe.totalTime < 30 || recipe.totalTime > 60) return false
            break
          case 'over-60':
            if (recipe.totalTime <= 60) return false
            break
        }
      }

      return true
    })
  }, [recipes, filters])
}
