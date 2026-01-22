import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRecipeFilter } from './useRecipeFilter'

import type { Recipe } from '../types/recipe'

describe('useRecipeFilter', () => {
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta',
      ingredients: [
        { ingredientId: 'ing1', quantity: 400 },
        { ingredientId: 'ing2', quantity: 200 },
      ],
      instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
      servings: 4,
      totalTime: 25,
      tags: ['italian', 'pasta', 'quick'],
      imageUrl: undefined,
    },
    {
      id: '2',
      name: 'Chicken Curry',
      description: 'Spicy Indian curry',
      ingredients: [
        { ingredientId: 'ing3', quantity: 500 },
        { ingredientId: 'ing4', quantity: 200 },
      ],
      instructions: ['Cook chicken', 'Add spices', 'Simmer'],
      servings: 6,
      totalTime: 45,
      tags: ['indian', 'spicy', 'chicken'],
      imageUrl: undefined,
    },
    {
      id: '3',
      name: 'Quick Salad',
      description: 'Fresh vegetable salad',
      ingredients: [{ ingredientId: 'ing5', quantity: 300 }],
      instructions: ['Chop vegetables', 'Mix dressing', 'Toss'],
      servings: 2,
      totalTime: 10,
      tags: ['vegetarian', 'quick', 'salad'],
      imageUrl: undefined,
    },
    {
      id: '4',
      name: 'Beef Stew',
      description: 'Hearty beef stew',
      ingredients: [
        { ingredientId: 'ing6', quantity: 800 },
        { ingredientId: 'ing1', quantity: 300 },
      ],
      instructions: ['Brown beef', 'Add vegetables', 'Slow cook'],
      servings: 8,
      totalTime: 120,
      tags: ['beef', 'comfort', 'slow-cook'],
      imageUrl: undefined,
    },
  ]

  describe('no filters', () => {
    it('should return all recipes when no filters are applied', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(4)
      expect(result.current).toEqual(mockRecipes)
    })
  })

  describe('search by name', () => {
    it('should filter recipes by name (case-insensitive)', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'chicken',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Chicken Curry')
    })

    it('should filter recipes by partial name match', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'sal',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Quick Salad')
    })

    it('should return empty array when no recipes match name', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'pizza',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(0)
    })
  })

  describe('filter by tags', () => {
    it('should filter recipes by single tag', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: ['quick'],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Spaghetti Carbonara')
      expect(result.current.map(r => r.name)).toContain('Quick Salad')
    })

    it('should filter recipes by multiple tags (OR logic)', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: ['italian', 'indian'],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Spaghetti Carbonara')
      expect(result.current.map(r => r.name)).toContain('Chicken Curry')
    })

    it('should return empty array when no recipes match tags', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: ['mexican'],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(0)
    })
  })

  describe('filter by ingredients', () => {
    it('should filter recipes by single ingredient', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: ['ing1'],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Spaghetti Carbonara')
      expect(result.current.map(r => r.name)).toContain('Beef Stew')
    })

    it('should filter recipes by multiple ingredients (OR logic)', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: ['ing3', 'ing5'],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Chicken Curry')
      expect(result.current.map(r => r.name)).toContain('Quick Salad')
    })

    it('should return empty array when no recipes match ingredients', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: ['ing999'],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(0)
    })
  })

  describe('filter by time range', () => {
    it('should filter recipes under 30 minutes', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: 'under-30',
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Spaghetti Carbonara')
      expect(result.current.map(r => r.name)).toContain('Quick Salad')
    })

    it('should filter recipes between 30-60 minutes', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: '30-60',
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Chicken Curry')
    })

    it('should filter recipes over 60 minutes', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: [],
          selectedIngredients: [],
          timeRange: 'over-60',
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Beef Stew')
    })
  })

  describe('combined filters', () => {
    it('should apply name search and tag filter together (AND logic)', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'quick',
          selectedTags: ['vegetarian'],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Quick Salad')
    })

    it('should apply all filters together', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'carb',
          selectedTags: ['italian'],
          selectedIngredients: ['ing1'],
          timeRange: 'under-30',
        })
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Spaghetti Carbonara')
    })

    it('should return empty when filters do not match any recipe', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: 'curry',
          selectedTags: ['italian'],
          selectedIngredients: [],
          timeRange: null,
        })
      )

      expect(result.current).toHaveLength(0)
    })

    it('should filter by time and tags', () => {
      const { result } = renderHook(() =>
        useRecipeFilter(mockRecipes, {
          searchText: '',
          selectedTags: ['quick'],
          selectedIngredients: [],
          timeRange: 'under-30',
        })
      )

      expect(result.current).toHaveLength(2)
      expect(result.current.map(r => r.name)).toContain('Spaghetti Carbonara')
      expect(result.current.map(r => r.name)).toContain('Quick Salad')
    })
  })
})
