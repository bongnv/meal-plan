import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { generateGroceryList } from './generateGroceryList'

import type { Ingredient } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

describe('generateGroceryList', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: 'ing1',
      name: 'Flour',
      category: 'Baking',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ing2',
      name: 'Sugar',
      category: 'Baking',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ing3',
      name: 'Butter',
      category: 'Dairy',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ing4',
      name: 'Salt',
      category: 'Spices',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const mockRecipes: Recipe[] = [
    {
      id: 'recipe1',
      name: 'Cookies',
      description: 'Chocolate chip cookies',
      servings: 4,
      prepTime: 15,
      cookTime: 12,
      ingredients: [
        { ingredientId: 'ing1', quantity: 250, unit: 'gram' },
        { ingredientId: 'ing2', quantity: 200, unit: 'gram' },
        { ingredientId: 'ing3', quantity: 125, unit: 'gram' },
      ],
      instructions: ['Mix', 'Bake'],
      subRecipes: [],
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'recipe2',
      name: 'Cake',
      description: 'Vanilla cake',
      servings: 8,
      prepTime: 30,
      cookTime: 45,
      ingredients: [
        { ingredientId: 'ing1', quantity: 500, unit: 'gram' },
        { ingredientId: 'ing2', quantity: 400, unit: 'gram' },
        { ingredientId: 'ing3', quantity: 250, unit: 'gram' },
        { ingredientId: 'ing4', quantity: 5, unit: 'gram' },
      ],
      instructions: ['Mix', 'Bake'],
      subRecipes: [],
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('should generate empty list when no meal plans in date range', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = []

      const result = generateGroceryList(
        dateRange,
        'Weekly List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.list.name).toBe('Weekly List')
      expect(result.list.dateRange).toEqual(dateRange)
      expect(result.items).toEqual([])
    })

    it('should generate list with single recipe', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Weekly List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items).toHaveLength(3) // Flour, Sugar, Butter
      expect(result.items.every(item => item.listId === result.list.id)).toBe(
        true
      )
    })

    it('should filter out non-recipe meal plans', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'mp2',
          type: 'leftover',
          date: '2026-01-22',
          mealType: 'lunch',
          description: 'Leftover cookies',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Weekly List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should only include recipe1 ingredients
      expect(result.items).toHaveLength(3)
    })

    it('should filter meal plans by date range', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-22' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'mp2',
          type: 'recipe',
          date: '2026-01-25', // Outside date range
          mealType: 'dinner',
          recipeId: 'recipe2',
          servings: 8,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Short List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should only include recipe1 ingredients
      expect(result.items).toHaveLength(3)
    })
  })

  describe('ingredient consolidation', () => {
    it('should consolidate same ingredients from multiple recipes', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'mp2',
          type: 'recipe',
          date: '2026-01-22',
          mealType: 'dinner',
          recipeId: 'recipe2',
          servings: 8,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Weekly List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should have 4 unique ingredients: Flour, Sugar, Butter, Salt
      expect(result.items).toHaveLength(4)

      // Check flour consolidation: 250g + 500g = 750g
      const flourItem = result.items.find(item => item.name === 'Flour')
      expect(flourItem).toBeDefined()
      expect(flourItem!.quantity).toBe(750)
      expect(flourItem!.unit).toBe('gram')

      // Check that mealPlanIds includes both
      expect(flourItem!.mealPlanIds).toContain('mp1')
      expect(flourItem!.mealPlanIds).toContain('mp2')
    })

    it('should scale ingredients based on servings', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 8, // Double the recipe servings (4)
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Scaled List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Flour should be doubled: 250g * 2 = 500g
      const flourItem = result.items.find(item => item.name === 'Flour')
      expect(flourItem!.quantity).toBe(500)
    })

    it('should convert and consolidate compatible units', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'mp2',
          type: 'recipe',
          date: '2026-01-22',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Consolidation Test',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Flour: 250g + 250g = 500g
      const flourItem = result.items.find(item => item.name === 'Flour')
      expect(flourItem!.quantity).toBe(500)
      expect(flourItem!.unit).toBe('gram')
    })
  })

  describe('sub-recipes', () => {
    it('should expand sub-recipes and consolidate ingredients', () => {
      const subRecipe: Recipe = {
        id: 'subrecipe1',
        name: 'Frosting',
        description: 'Buttercream frosting',
        servings: 4,
        prepTime: 10,
        cookTime: 0,
        ingredients: [
          { ingredientId: 'ing3', quantity: 100, unit: 'gram' },
          { ingredientId: 'ing2', quantity: 200, unit: 'gram' },
        ],
        instructions: ['Mix'],
        subRecipes: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const mainRecipe: Recipe = {
        id: 'main1',
        name: 'Frosted Cake',
        description: 'Cake with frosting',
        servings: 8,
        prepTime: 40,
        cookTime: 45,
        ingredients: [{ ingredientId: 'ing1', quantity: 500, unit: 'gram' }],
        instructions: ['Make cake', 'Add frosting'],
        subRecipes: [{ recipeId: 'subrecipe1', servings: 4 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dessert',
          recipeId: 'main1',
          servings: 8,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Sub-recipe Test',
        mealPlans,
        [mainRecipe, subRecipe],
        mockIngredients
      )

      // Should have Flour (500g), Butter (100g), Sugar (200g)
      expect(result.items).toHaveLength(3)
      expect(result.items.find(i => i.name === 'Flour')).toBeDefined()
      expect(result.items.find(i => i.name === 'Butter')).toBeDefined()
      expect(result.items.find(i => i.name === 'Sugar')).toBeDefined()
    })

    it('should handle nested sub-recipes', () => {
      const level2SubRecipe: Recipe = {
        id: 'level2',
        name: 'Vanilla Extract',
        description: 'Homemade vanilla',
        servings: 1,
        prepTime: 5,
        cookTime: 0,
        ingredients: [{ ingredientId: 'ing4', quantity: 1, unit: 'gram' }],
        instructions: ['Mix'],
        subRecipes: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const level1SubRecipe: Recipe = {
        id: 'level1',
        name: 'Frosting',
        description: 'Frosting with vanilla',
        servings: 4,
        prepTime: 10,
        cookTime: 0,
        ingredients: [{ ingredientId: 'ing3', quantity: 100, unit: 'gram' }],
        instructions: ['Mix'],
        subRecipes: [{ recipeId: 'level2', servings: 1 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const mainRecipe: Recipe = {
        id: 'main',
        name: 'Cake',
        description: 'Cake with frosting',
        servings: 8,
        prepTime: 40,
        cookTime: 45,
        ingredients: [{ ingredientId: 'ing1', quantity: 500, unit: 'gram' }],
        instructions: ['Bake'],
        subRecipes: [{ recipeId: 'level1', servings: 4 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dessert',
          recipeId: 'main',
          servings: 8,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Nested Test',
        mealPlans,
        [mainRecipe, level1SubRecipe, level2SubRecipe],
        mockIngredients
      )

      // Should include ingredients from all levels
      expect(result.items.find(i => i.name === 'Flour')).toBeDefined()
      expect(result.items.find(i => i.name === 'Butter')).toBeDefined()
      expect(result.items.find(i => i.name === 'Salt')).toBeDefined()
    })

    it('should handle missing sub-recipe gracefully', () => {
      const mainRecipe: Recipe = {
        id: 'main',
        name: 'Recipe with missing sub',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        ingredients: [{ ingredientId: 'ing1', quantity: 200, unit: 'gram' }],
        instructions: ['Cook'],
        subRecipes: [{ recipeId: 'nonexistent', servings: 2 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'main',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = generateGroceryList(
        dateRange,
        'Missing Sub Test',
        mealPlans,
        [mainRecipe],
        mockIngredients
      )

      // Should still have main recipe ingredients
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Flour')

      // Should have logged warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sub-recipe not found')
      )

      consoleSpy.mockRestore()
    })

    it('should prevent infinite recursion with circular dependencies', () => {
      const recipe1: Recipe = {
        id: 'circular1',
        name: 'Recipe 1',
        description: 'Circular test',
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        ingredients: [{ ingredientId: 'ing1', quantity: 200, unit: 'gram' }],
        instructions: ['Cook'],
        subRecipes: [{ recipeId: 'circular2', servings: 2 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const recipe2: Recipe = {
        id: 'circular2',
        name: 'Recipe 2',
        description: 'Circular test',
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        ingredients: [{ ingredientId: 'ing2', quantity: 100, unit: 'gram' }],
        instructions: ['Cook'],
        subRecipes: [{ recipeId: 'circular1', servings: 2 }],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'circular1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = generateGroceryList(
        dateRange,
        'Circular Test',
        mealPlans,
        [recipe1, recipe2],
        mockIngredients
      )

      // Should handle circular dependency
      expect(result.items.length).toBeGreaterThan(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Circular dependency')
      )

      consoleSpy.mockRestore()
    })

    it('should prevent deep recursion beyond max depth', () => {
      const recipes: Recipe[] = []

      // Create a chain of 5 recipes (exceeds MAX_RECURSION_DEPTH of 3)
      for (let i = 0; i < 5; i++) {
        recipes.push({
          id: `deep${i}`,
          name: `Recipe ${i}`,
          description: 'Deep test',
          servings: 4,
          prepTime: 10,
          cookTime: 10,
          ingredients: [{ ingredientId: 'ing1', quantity: 100, unit: 'gram' }],
          instructions: ['Cook'],
          subRecipes: i < 4 ? [{ recipeId: `deep${i + 1}`, servings: 4 }] : [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'deep0',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      generateGroceryList(
        dateRange,
        'Deep Test',
        mealPlans,
        recipes,
        mockIngredients
      )

      // Should stop at max depth and log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max recursion depth')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle missing recipe', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'nonexistent',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Missing Recipe',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items).toEqual([])
    })

    it('should handle missing ingredient', () => {
      const recipeWithMissingIngredient: Recipe = {
        id: 'recipe3',
        name: 'Test Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        ingredients: [
          { ingredientId: 'nonexistent', quantity: 100, unit: 'gram' },
        ],
        instructions: ['Cook'],
        subRecipes: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe3',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Missing Ingredient',
        mealPlans,
        [recipeWithMissingIngredient],
        mockIngredients
      )

      // Should skip missing ingredient
      expect(result.items).toEqual([])
    })

    it('should create unique IDs for list and items', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'ID Test',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.list.id).toMatch(/^gl_/)
      expect(result.items.every(item => item.id.startsWith('gi_'))).toBe(true)

      // All IDs should be unique
      const itemIds = result.items.map(item => item.id)
      expect(new Set(itemIds).size).toBe(itemIds.length)
    })

    it('should set timestamps', () => {
      const now = Date.now()

      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: now,
          updatedAt: now,
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Timestamp Test',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.list.createdAt).toBeGreaterThan(0)
      expect(result.list.updatedAt).toBeGreaterThan(0)
      expect(result.list.createdAt).toBe(result.list.updatedAt)
      expect(result.items.every(item => item.createdAt > 0)).toBe(true)
      expect(result.items.every(item => item.updatedAt > 0)).toBe(true)
    })

    it('should set all items to unchecked by default', () => {
      const dateRange = { start: '2026-01-20', end: '2026-01-27' }
      const mealPlans: MealPlan[] = [
        {
          id: 'mp1',
          type: 'recipe',
          date: '2026-01-21',
          mealType: 'dinner',
          recipeId: 'recipe1',
          servings: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      const result = generateGroceryList(
        dateRange,
        'Checked Test',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items.every(item => item.checked === false)).toBe(true)
    })
  })
})
