import { describe, expect, it } from 'vitest'

import { generateGroceryList } from './generateGroceryList'

import type { Ingredient } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

describe('generateGroceryList', () => {
  const mockIngredients: Ingredient[] = [
    {
      id: '1',
      name: 'Chicken Breast',
      category: 'Meat',
      unit: 'gram',
    },
    {
      id: '2',
      name: 'Rice',
      category: 'Grains',
      unit: 'gram',
    },
    {
      id: '3',
      name: 'Broccoli',
      category: 'Vegetables',
      unit: 'gram',
    },
  ]

  const mockRecipes: Recipe[] = [
    {
      id: 'r1',
      name: 'Chicken Rice Bowl',
      description: 'Healthy chicken bowl',
      servings: 2,
      totalTime: 30,
      ingredients: [
        { ingredientId: '1', quantity: 400, unit: 'gram' },
        { ingredientId: '2', quantity: 200, unit: 'gram' },
        { ingredientId: '3', quantity: 150, unit: 'gram' },
      ],
      instructions: ['Cook chicken', 'Cook rice', 'Steam broccoli'],
      tags: [],
    },
    {
      id: 'r2',
      name: 'Fried Rice',
      description: 'Quick fried rice',
      servings: 4,
      totalTime: 20,
      ingredients: [
        { ingredientId: '2', quantity: 400, unit: 'gram' },
        { ingredientId: '1', quantity: 200, unit: 'gram' },
      ],
      instructions: ['Cook rice', 'Fry with chicken'],
      tags: [],
    },
  ]

  describe('Basic consolidation', () => {
    it('should generate list with single recipe meal', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items).toHaveLength(3)
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken).toMatchObject({
        name: 'Chicken Breast',
        quantity: 400,
        unit: 'gram',
        category: 'Meat',
        checked: false,
        mealPlanIds: ['m1'],
      })
    })

    it('should consolidate same ingredient from multiple recipes', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
        {
          id: 'm2',
          date: '2026-01-24',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r2',
          servings: 4,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should have 3 unique ingredients
      expect(result.items).toHaveLength(3)

      // Find chicken (was id '1') - should be consolidated
      // 400g (scaled) + 200g (scaled) = 600g, which should not convert to kg (< 1000g)
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken).toBeDefined()
      expect(chicken?.quantity).toBe(600) // 400 + 200
      expect(chicken?.unit).toBe('gram')
      expect(chicken?.mealPlanIds).toEqual(['m1', 'm2'])

      // Find rice (was id '2') - should be consolidated
      // 200g + 400g = 600g, which should not convert to kg (< 1000g)
      const rice = result.items.find(item => item.name === 'Rice')
      expect(rice).toBeDefined()
      expect(rice?.quantity).toBe(600) // 200 + 400
      expect(rice?.unit).toBe('gram')
      expect(rice?.mealPlanIds).toEqual(['m1', 'm2'])
    })
  })

  describe('Servings scaling', () => {
    it('should scale ingredients by servings ratio', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1', // Recipe has servings: 2
          servings: 4, // Meal plan wants 4 servings (double)
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken?.quantity).toBe(800) // 400 * (4/2) = 800
      expect(chicken?.unit).toBe('gram')
    })

    it('should scale down for fewer servings', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r2', // Recipe has servings: 4
          servings: 2, // Meal plan wants 2 servings (half)
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      const rice = result.items.find(item => item.name === 'Rice')
      expect(rice?.quantity).toBe(200) // 400 * (2/4) = 200
    })
  })

  describe('Unit consolidation', () => {
    it('should convert 1000g to 1kg', () => {
      const recipes: Recipe[] = [
        {
          id: 'r3',
          name: 'Big Recipe',
          description: '',
          servings: 2,
          totalTime: 10,
          ingredients: [
            { ingredientId: '1', quantity: 600, unit: 'gram' }, // 600g
          ],
          instructions: [],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r3',
          servings: 2,
        },
        {
          id: 'm2',
          date: '2026-01-24',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r3',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Test List',
        mealPlans,
        recipes,
        mockIngredients
      )

      // 600g + 600g = 1200g, rounds to 1200g, converts to 1.2kg
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken?.quantity).toBe(1.2)
      expect(chicken?.unit).toBe('kilogram')
    })

    it('should convert 1500ml to 1.5L', () => {
      const ingredients: Ingredient[] = [
        {
          id: '10',
          name: 'Milk',
          category: 'Dairy',
          unit: 'milliliter',
        },
      ]

      const recipes: Recipe[] = [
        {
          id: 'r4',
          name: 'Smoothie',
          description: '',
          servings: 1,
          totalTime: 5,
          ingredients: [
            { ingredientId: '10', quantity: 750, unit: 'milliliter' }, // 750ml
          ],
          instructions: [],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r4',
          servings: 1,
        },
        {
          id: 'm2',
          date: '2026-01-24',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r4',
          servings: 1,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Test List',
        mealPlans,
        recipes,
        ingredients
      )

      // 750ml + 750ml = 1500ml, rounds to 1500ml, converts to 1.5L
      const milk = result.items.find(item => item.name === 'Milk')
      expect(milk?.quantity).toBe(1.5)
      expect(milk?.unit).toBe('liter')
    })

    it('should keep quantities below 1000g as grams', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Recipe has 400g chicken - should stay as grams
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken?.quantity).toBe(400)
      expect(chicken?.unit).toBe('gram')
    })
  })

  describe('Smart rounding', () => {
    it('should apply smart rounding to consolidated quantities', () => {
      const recipes: Recipe[] = [
        {
          id: 'r3',
          name: 'Test Recipe',
          description: '',
          servings: 3,
          totalTime: 10,
          ingredients: [
            { ingredientId: '1', quantity: 333, unit: 'gram' }, // Will be 333.33... when scaled
          ],
          instructions: [],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r3',
          servings: 2, // 333 * (2/3) = 222
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        recipes,
        mockIngredients
      )

      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      // 222 rounded to nearest 50g = 200
      expect(chicken?.quantity).toBe(200)
      expect(chicken?.unit).toBe('gram')
    })
  })

  describe('Category assignment', () => {
    it('should assign category from ingredient library', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items[0].category).toBe('Meat')
      expect(result.items[1].category).toBe('Grains')
      expect(result.items[2].category).toBe('Vegetables')
    })
  })

  describe('MealPlan tracking', () => {
    it('should track which meal plans need each ingredient', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
        {
          id: 'm2',
          date: '2026-01-24',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r2',
          servings: 4,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken?.mealPlanIds).toEqual(['m1', 'm2'])

      const broccoli = result.items.find(item => item.name === 'Broccoli')
      expect(broccoli?.mealPlanIds).toEqual(['m1']) // Only in r1
    })
  })

  describe('Edge cases', () => {
    it('should handle empty meal plans', () => {
      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Empty List',
        [],
        mockRecipes,
        mockIngredients
      )

      expect(result.items).toHaveLength(0)
      expect(result.list.name).toBe('Empty List')
    })

    it('should skip non-recipe meal plans', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'dining-out',
        },
        {
          id: 'm2',
          date: '2026-01-23',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should only include items from m2 (recipe meal)
      expect(result.items).toHaveLength(3)
      result.items.forEach(item => {
        expect(item.mealPlanIds).toEqual(['m2'])
      })
    })

    it('should handle meals outside date range', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-22', // Before range
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
        {
          id: 'm2',
          date: '2026-01-23', // In range
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
        {
          id: 'm3',
          date: '2026-01-25', // After range
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-24' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      // Should only include items from m2
      result.items.forEach(item => {
        expect(item.mealPlanIds).toEqual(['m2'])
      })
    })

    it('should handle missing recipe', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'non-existent',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      expect(result.items).toHaveLength(0)
    })

    it('should handle missing ingredient', () => {
      const recipes: Recipe[] = [
        {
          id: 'r3',
          name: 'Test Recipe',
          description: '',
          servings: 2,
          totalTime: 10,
          ingredients: [{ ingredientId: 'non-existent', quantity: 100, unit: 'gram' }],
          instructions: [],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r3',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        recipes,
        mockIngredients
      )

      // Should skip ingredient with missing data
      expect(result.items).toHaveLength(0)
    })
  })

  describe('Generated list metadata', () => {
    it('should set correct name and date range', () => {
      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-30' },
        'Weekly Groceries',
        [],
        mockRecipes,
        mockIngredients
      )

      expect(result.list.name).toBe('Weekly Groceries')
      expect(result.list.dateRange).toEqual({
        start: '2026-01-23',
        end: '2026-01-30',
      })
    })

    it('should generate unique IDs for items', () => {
      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        mockRecipes,
        mockIngredients
      )

      const ids = result.items.map(item => item.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length) // All IDs should be unique
    })
  })

  describe('Recipe-level units', () => {
    it('should use recipe ingredient unit instead of library unit', () => {
      const recipesWithUnits: Recipe[] = [
        {
          id: 'r1',
          name: 'Chicken Rice Bowl',
          description: 'Healthy chicken bowl',
          servings: 2,
          totalTime: 30,
          ingredients: [
            { ingredientId: '1', quantity: 2, unit: 'cup' }, // Override library unit (gram)
            { ingredientId: '2', quantity: 300, unit: 'gram' }, // Matches library unit
          ],
          instructions: ['Cook chicken', 'Cook rice'],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        recipesWithUnits,
        mockIngredients
      )

      // Chicken should use recipe unit (cup), not library unit (gram)
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken).toMatchObject({
        quantity: 2,
        unit: 'cup',
      })

      // Rice should use recipe unit (gram)
      const rice = result.items.find(item => item.name === 'Rice')
      expect(rice).toMatchObject({
        quantity: 300,
        unit: 'gram',
      })
    })

    it('should consolidate ingredients with same recipe unit', () => {
      const recipesWithUnits: Recipe[] = [
        {
          id: 'r1',
          name: 'Recipe 1',
          description: 'Test',
          servings: 2,
          totalTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 2, unit: 'cup' }],
          instructions: ['Cook'],
          tags: [],
        },
        {
          id: 'r2',
          name: 'Recipe 2',
          description: 'Test',
          servings: 2,
          totalTime: 30,
          ingredients: [{ ingredientId: '1', quantity: 3, unit: 'cup' }],
          instructions: ['Cook'],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
        {
          id: 'm2',
          date: '2026-01-23',
          mealType: 'dinner',
          type: 'recipe',
          recipeId: 'r2',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        recipesWithUnits,
        mockIngredients
      )

      // Should consolidate both recipes into one item with 5 cups
      expect(result.items).toHaveLength(1)
      const chicken = result.items.find(item => item.name === 'Chicken Breast')
      expect(chicken).toMatchObject({
        quantity: 5,
        unit: 'cup',
        mealPlanIds: ['m1', 'm2'],
      })
    })

    it('should handle "whole" unit without displaying it', () => {
      const recipesWithWholeUnit: Recipe[] = [
        {
          id: 'r1',
          name: 'Egg Recipe',
          description: 'Test',
          servings: 2,
          totalTime: 30,
          ingredients: [
            { ingredientId: '1', quantity: 4, unit: 'whole' }, // 4 whole items
          ],
          instructions: ['Cook'],
          tags: [],
        },
      ]

      const mealPlans: MealPlan[] = [
        {
          id: 'm1',
          date: '2026-01-23',
          mealType: 'lunch',
          type: 'recipe',
          recipeId: 'r1',
          servings: 2,
        },
      ]

      const result = generateGroceryList(
        { start: '2026-01-23', end: '2026-01-23' },
        'Test List',
        mealPlans,
        recipesWithWholeUnit,
        mockIngredients
      )

      // Item should have 'whole' unit stored (for consolidation)
      const item = result.items[0]
      expect(item.unit).toBe('whole')
      expect(item.quantity).toBe(4)
    })
  })
})
