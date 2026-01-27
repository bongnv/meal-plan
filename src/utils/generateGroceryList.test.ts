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
    },
    {
      id: '2',
      name: 'Rice',
      category: 'Grains',
    },
    {
      id: '3',
      name: 'Broccoli',
      category: 'Vegetables',
    },
  ]

  const mockRecipes: Recipe[] = [
    {
      id: 'r1',
      name: 'Chicken Rice Bowl',
      description: 'Healthy chicken bowl',
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      ingredients: [
        { ingredientId: '1', quantity: 400, unit: 'gram' },
        { ingredientId: '2', quantity: 200, unit: 'gram' },
        { ingredientId: '3', quantity: 150, unit: 'gram' },
      ],
      instructions: ['Cook chicken', 'Cook rice', 'Steam broccoli'],
      subRecipes: [],
      tags: [],
    },
    {
      id: 'r2',
      name: 'Fried Rice',
      description: 'Quick fried rice',
      servings: 4,
      prepTime: 10,
      cookTime: 10,
      ingredients: [
        { ingredientId: '1', quantity: 200, unit: 'gram' },
        { ingredientId: '2', quantity: 400, unit: 'gram' },
      ],
      instructions: ['Cook rice', 'Fry with chicken'],
      subRecipes: [],
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
          prepTime: 5,
          cookTime: 5,
          ingredients: [
            { ingredientId: '1', quantity: 600, unit: 'gram' }, // 600g
          ],
          instructions: [],
          subRecipes: [],
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
        },
      ]

      const recipes: Recipe[] = [
        {
          id: 'r4',
          name: 'Smoothie',
          description: '',
          servings: 1,
          prepTime: 3,
          cookTime: 2,
          ingredients: [
            { ingredientId: '10', quantity: 750, unit: 'milliliter' }, // 750ml
          ],
          instructions: [],
          subRecipes: [],
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
          prepTime: 5,
          cookTime: 5,
          ingredients: [
            { ingredientId: '1', quantity: 333, unit: 'gram' }, // Will be 333.33... when scaled
          ],
          instructions: [],
          subRecipes: [],
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
          prepTime: 5,
          cookTime: 5,
          ingredients: [
            { ingredientId: '999', quantity: 100, unit: 'gram' }, // Non-existent ingredient
          ],
          instructions: [],
          subRecipes: [],
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
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 2, unit: 'cup' }, // Override library unit (gram)
            { ingredientId: '2', quantity: 300, unit: 'gram' }, // Matches library unit
          ],
          instructions: ['Cook chicken', 'Cook rice'],
          subRecipes: [],
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
      })

      // Rice should use recipe unit (gram)
      const rice = result.items.find(item => item.name === 'Rice')
      expect(rice).toMatchObject({
        quantity: 300,
      })
    })

    it('should consolidate ingredients with same recipe unit', () => {
      const recipesWithUnits: Recipe[] = [
        {
          id: 'r1',
          name: 'Recipe 1',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [{ ingredientId: '1', quantity: 2.5, unit: 'cup' }],
          instructions: ['Cook'],
          subRecipes: [],
          tags: [],
        },
        {
          id: 'r2',
          name: 'Recipe 2',
          description: 'Test',
          servings: 2,
          prepTime: 15,
          cookTime: 15,
          ingredients: [{ ingredientId: '1', quantity: 2.5, unit: 'cup' }],
          instructions: ['Cook'],
          subRecipes: [],
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
          prepTime: 15,
          cookTime: 15,
          ingredients: [
            { ingredientId: '1', quantity: 4, unit: 'whole' }, // 4 whole items
          ],
          instructions: ['Cook'],
          subRecipes: [],
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

  describe('Sub-Recipe Expansion', () => {
    it('should expand recipe with sub-recipes correctly', () => {
      // Create a sub-recipe (e.g., cilantro rice)
      const subRecipe: Recipe = {
        id: 'rice_recipe',
        name: 'Cilantro Rice',
        description: 'Fluffy cilantro rice',
        servings: 4,
        prepTime: 5,
        cookTime: 15,
        ingredients: [
          { ingredientId: 'rice_id', quantity: 200, unit: 'gram' },
          { ingredientId: 'cilantro_id', quantity: 10, unit: 'gram' },
        ],
        instructions: ['Cook rice', 'Mix cilantro'],
        tags: [],
        subRecipes: [],
      }

      // Create main recipe that uses the sub-recipe
      const mainRecipe: Recipe = {
        id: 'burrito_bowl',
        name: 'Burrito Bowl',
        description: 'Bowl with rice, beans',
        servings: 2,
        prepTime: 10,
        cookTime: 20,
        ingredients: [
          { ingredientId: 'beans_id', quantity: 200, unit: 'gram' },
        ],
        instructions: ['Prepare bowl'],
        tags: [],
        subRecipes: [
          { recipeId: 'rice_recipe', servings: 2 }, // Half of the sub-recipe
        ],
      }

      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2024-01-01',
        type: 'recipe',
        recipeId: 'burrito_bowl',
        servings: 2,
      }

      const result = generateGroceryList(
        { start: '2024-01-01', end: '2024-01-01' },
        'Weekly List',
        [mealPlan],
        [mainRecipe, subRecipe],
        [
          { id: 'beans_id', name: 'Black Beans', category: 'pantry' },
          { id: 'rice_id', name: 'Rice', category: 'pantry' },
          { id: 'cilantro_id', name: 'Cilantro', category: 'produce' },
        ]
      )

      expect(result.items).toHaveLength(3)

      // Check beans (direct ingredient)
      const beansItem = result.items.find(i => i.name === 'Black Beans')
      expect(beansItem).toBeDefined()
      expect(beansItem!.quantity).toBe(200)
      expect(beansItem!.unit).toBe('gram')

      // Check rice (from sub-recipe, scaled by 2/4 = 0.5)
      const riceItem = result.items.find(i => i.name === 'Rice')
      expect(riceItem).toBeDefined()
      expect(riceItem!.quantity).toBe(100) // 200 * 0.5
      expect(riceItem!.unit).toBe('gram')

      // Check cilantro (from sub-recipe, scaled by 0.5)
      // 10 * 0.5 = 5g, but grams are rounded to nearest 50g, so becomes 50g
      const cilantroItem = result.items.find(i => i.name === 'Cilantro')
      expect(cilantroItem).toBeDefined()
      expect(cilantroItem!.quantity).toBe(50) // 10 * 0.5 = 5g → rounded to 50g
      expect(cilantroItem!.unit).toBe('gram')
    })

    it('should scale quantities by both recipe servings and sub-recipe quantity', () => {
      const subRecipe: Recipe = {
        id: 'sauce_recipe',
        name: 'Salsa',
        description: 'Tomato salsa',
        servings: 4,
        prepTime: 5,
        cookTime: 0,
        ingredients: [
          { ingredientId: 'tomato_id', quantity: 400, unit: 'gram' },
        ],
        instructions: ['Mix'],
        tags: [],
        subRecipes: [],
      }

      const mainRecipe: Recipe = {
        id: 'taco_recipe',
        name: 'Tacos',
        description: 'Delicious tacos',
        servings: 4,
        prepTime: 10,
        cookTime: 10,
        ingredients: [{ ingredientId: 'meat_id', quantity: 400, unit: 'gram' }],
        instructions: ['Cook meat'],
        tags: [],
        subRecipes: [
          { recipeId: 'sauce_recipe', servings: 2 }, // Half of the sub-recipe
        ],
      }

      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2024-01-01',
        type: 'recipe',
        recipeId: 'taco_recipe',
        servings: 8, // Double the recipe
        mealType: 'dinner',
      }

      const result = generateGroceryList(
        { start: '2024-01-01', end: '2024-01-01' },
        'Weekly List',
        [mealPlan],
        [mainRecipe, subRecipe],
        [
          { id: 'meat_id', name: 'Ground Meat', category: 'Meat' },
          { id: 'tomato_id', name: 'Tomatoes', category: 'Vegetables' },
        ]
      )

      expect(result.items).toHaveLength(2)

      // Meat: 400 * (8/4) = 800
      const meatItem = result.items.find(i => i.name === 'Ground Meat')
      expect(meatItem!.quantity).toBe(800)

      // Tomatoes: 400 * (8/4) * (2/4) = 400
      // Wait, recalculating: main recipe 4 servings, meal plan 8 servings = 2x
      // sub-recipe 4 servings, used quantity 2 = 2/4 = 0.5x
      // So: 400 * (2) * (0.5) = 400
      const tomatoItem = result.items.find(i => i.name === 'Tomatoes')
      expect(tomatoItem!.quantity).toBe(400)
    })

    it('should handle recursive expansion (sub-recipe with sub-recipes)', () => {
      // Level 2: spice blend
      const spiceRecipe: Recipe = {
        id: 'spice_blend',
        name: 'Spice Blend',
        description: 'Cumin and paprika',
        servings: 1,
        prepTime: 0,
        cookTime: 0,
        ingredients: [{ ingredientId: 'cumin_id', quantity: 10, unit: 'gram' }],
        instructions: [],
        tags: [],
        subRecipes: [],
      }

      // Level 1: sauce with spice blend as sub-recipe
      const sauceRecipe: Recipe = {
        id: 'sauce_recipe',
        name: 'Sauce',
        description: 'Spiced sauce',
        servings: 2,
        prepTime: 5,
        cookTime: 10,
        ingredients: [{ ingredientId: 'oil_id', quantity: 50, unit: 'milliliter' }],
        instructions: [],
        tags: [],
        subRecipes: [{ recipeId: 'spice_blend', servings: 1 }],
      }

      // Level 0: main dish with sauce as sub-recipe
      const mainRecipe: Recipe = {
        id: 'main_dish',
        name: 'Main Dish',
        description: 'Delicious dish',
        servings: 1,
        prepTime: 10,
        cookTime: 20,
        ingredients: [
          { ingredientId: 'protein_id', quantity: 200, unit: 'gram' },
        ],
        instructions: [],
        tags: [],
        subRecipes: [{ recipeId: 'sauce_recipe', servings: 2 }],
      }

      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2024-01-01',
        type: 'recipe',
        recipeId: 'main_dish',
        servings: 1,
        mealType: 'dinner',
      }

      const result = generateGroceryList(
        { start: '2024-01-01', end: '2024-01-01' },
        'Weekly List',
        [mealPlan],
        [mainRecipe, sauceRecipe, spiceRecipe],
        [
          { id: 'protein_id', name: 'Protein', category: 'Meat' },
          { id: 'oil_id', name: 'Oil', category: 'Oils & Fats' },
          { id: 'cumin_id', name: 'Cumin', category: 'Herbs & Spices' },
        ]
      )

      expect(result.items).toHaveLength(3)

      // Protein: 200 * 1 = 200
      const proteinItem = result.items.find(i => i.name === 'Protein')
      expect(proteinItem!.quantity).toBe(200)

      // Oil: 50 * (2/2) = 50
      const oilItem = result.items.find(i => i.name === 'Oil')
      expect(oilItem!.quantity).toBe(50)

      // Cumin: 10 * (2/2) = 10, but grams rounded to nearest 50g, so becomes 50g
      const cuminItem = result.items.find(i => i.name === 'Cumin')
      expect(cuminItem!.quantity).toBe(50) // 10g → rounded to 50g
    })

    it('should handle missing sub-recipe gracefully', () => {
      const mainRecipe: Recipe = {
        id: 'broken_recipe',
        name: 'Broken Recipe',
        description: 'References non-existent sub-recipe',
        servings: 1,
        prepTime: 10,
        cookTime: 20,
        ingredients: [
          { ingredientId: 'ingredient_id', quantity: 100, unit: 'gram' },
        ],
        instructions: [],
        tags: [],
        subRecipes: [{ recipeId: 'non_existent_recipe', servings: 1 }],
      }

      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2024-01-01',
        type: 'recipe',
        recipeId: 'broken_recipe',
        servings: 1,
        mealType: 'dinner',
      }

      const result = generateGroceryList(
        { start: '2024-01-01', end: '2024-01-01' },
        'Weekly List',
        [mealPlan],
        [mainRecipe],
        [{ id: 'ingredient_id', name: 'Ingredient', category: 'pantry' }]
      )

      // Should still include the main recipe's ingredients
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Ingredient')
      expect(result.items[0].quantity).toBe(100)
    })

    it('should track mealPlanIds through sub-recipes', () => {
      const subRecipe: Recipe = {
        id: 'sub_recipe',
        name: 'Sub Recipe',
        description: 'Sub',
        servings: 1,
        prepTime: 0,
        cookTime: 0,
        ingredients: [{ ingredientId: 'ing_id', quantity: 100, unit: 'gram' }],
        instructions: [],
        tags: [],
        subRecipes: [],
      }

      const mainRecipe: Recipe = {
        id: 'main_recipe',
        name: 'Main Recipe',
        description: 'Main',
        servings: 1,
        prepTime: 10,
        cookTime: 10,
        ingredients: [],
        instructions: [],
        tags: [],
        subRecipes: [{ recipeId: 'sub_recipe', servings: 1 }],
      }

      const mealPlan: MealPlan = {
        id: 'mp_123',
        date: '2024-01-01',
        type: 'recipe',
        recipeId: 'main_recipe',
        servings: 1,
        mealType: 'dinner',
      }

      const result = generateGroceryList(
        { start: '2024-01-01', end: '2024-01-01' },
        'Weekly List',
        [mealPlan],
        [mainRecipe, subRecipe],
        [{ id: 'ing_id', name: 'Ingredient', category: 'Other' }]
      )

      expect(result.items).toHaveLength(1)
      expect(result.items[0].mealPlanIds).toContain('mp_123')
    })
  })
})
