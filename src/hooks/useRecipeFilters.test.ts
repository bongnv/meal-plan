import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { useRecipeFilters } from './useRecipeFilters'

describe('useRecipeFilters', () => {
  it('should initialize with default empty state', () => {
    const { result } = renderHook(() => useRecipeFilters())

    expect(result.current.filters.searchText).toBe('')
    expect(result.current.filters.selectedTags).toEqual([])
    expect(result.current.filters.selectedIngredients).toEqual([])
    expect(result.current.filters.timeRange).toBeNull()
    expect(result.current.actions.hasActiveFilters).toBe(false)
  })

  it('should update search text', () => {
    const { result } = renderHook(() => useRecipeFilters())

    act(() => {
      result.current.actions.setSearchText('pasta')
    })

    expect(result.current.filters.searchText).toBe('pasta')
    expect(result.current.actions.hasActiveFilters).toBe(true)
  })

  it('should update selected tags', () => {
    const { result } = renderHook(() => useRecipeFilters())

    act(() => {
      result.current.actions.setSelectedTags(['italian', 'quick'])
    })

    expect(result.current.filters.selectedTags).toEqual(['italian', 'quick'])
    expect(result.current.actions.hasActiveFilters).toBe(true)
  })

  it('should update selected ingredients', () => {
    const { result } = renderHook(() => useRecipeFilters())

    act(() => {
      result.current.actions.setSelectedIngredients(['ing1', 'ing2'])
    })

    expect(result.current.filters.selectedIngredients).toEqual(['ing1', 'ing2'])
    expect(result.current.actions.hasActiveFilters).toBe(true)
  })

  it('should update time range', () => {
    const { result } = renderHook(() => useRecipeFilters())

    act(() => {
      result.current.actions.setTimeRange('under-30')
    })

    expect(result.current.filters.timeRange).toBe('under-30')
    expect(result.current.actions.hasActiveFilters).toBe(true)
  })

  it('should clear all filters', () => {
    const { result } = renderHook(() => useRecipeFilters())

    // Set multiple filters
    act(() => {
      result.current.actions.setSearchText('pasta')
      result.current.actions.setSelectedTags(['italian'])
      result.current.actions.setSelectedIngredients(['ing1'])
      result.current.actions.setTimeRange('30-60')
    })

    expect(result.current.actions.hasActiveFilters).toBe(true)

    // Clear all
    act(() => {
      result.current.actions.clearFilters()
    })

    expect(result.current.filters.searchText).toBe('')
    expect(result.current.filters.selectedTags).toEqual([])
    expect(result.current.filters.selectedIngredients).toEqual([])
    expect(result.current.filters.timeRange).toBeNull()
    expect(result.current.actions.hasActiveFilters).toBe(false)
  })

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useRecipeFilters())

    // No filters active initially
    expect(result.current.actions.hasActiveFilters).toBe(false)

    // Search text makes it active
    act(() => {
      result.current.actions.setSearchText('test')
    })
    expect(result.current.actions.hasActiveFilters).toBe(true)

    act(() => {
      result.current.actions.setSearchText('')
    })
    expect(result.current.actions.hasActiveFilters).toBe(false)

    // Tags make it active
    act(() => {
      result.current.actions.setSelectedTags(['tag1'])
    })
    expect(result.current.actions.hasActiveFilters).toBe(true)

    act(() => {
      result.current.actions.setSelectedTags([])
    })
    expect(result.current.actions.hasActiveFilters).toBe(false)

    // Ingredients make it active
    act(() => {
      result.current.actions.setSelectedIngredients(['ing1'])
    })
    expect(result.current.actions.hasActiveFilters).toBe(true)

    act(() => {
      result.current.actions.setSelectedIngredients([])
    })
    expect(result.current.actions.hasActiveFilters).toBe(false)

    // Time range makes it active
    act(() => {
      result.current.actions.setTimeRange('over-60')
    })
    expect(result.current.actions.hasActiveFilters).toBe(true)

    act(() => {
      result.current.actions.setTimeRange(null)
    })
    expect(result.current.actions.hasActiveFilters).toBe(false)
  })
})
