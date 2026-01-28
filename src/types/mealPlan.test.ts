import { describe, expect, it } from 'vitest'

import {
  CUSTOM_MEAL_TYPES,
  CustomMealPlanSchema,
  getMealPlanTypeInfo,
  isCustomMealPlan,
  isRecipeMealPlan,
  MealPlanSchema,
  MealPlanTypeSchema,
  MealTypeSchema,
  RecipeMealPlanSchema,
} from './mealPlan'

import type { CustomMealPlan, MealPlan, RecipeMealPlan } from './mealPlan'

describe('mealPlan types', () => {
  describe('MealTypeSchema', () => {
    it('should validate valid meal types', () => {
      expect(MealTypeSchema.parse('breakfast')).toBe('breakfast')
      expect(MealTypeSchema.parse('lunch')).toBe('lunch')
      expect(MealTypeSchema.parse('dinner')).toBe('dinner')
      expect(MealTypeSchema.parse('snack')).toBe('snack')
    })

    it('should reject invalid meal types', () => {
      expect(() => MealTypeSchema.parse('brunch')).toThrow()
    })
  })

  describe('MealPlanTypeSchema', () => {
    it('should validate valid meal plan types', () => {
      expect(MealPlanTypeSchema.parse('recipe')).toBe('recipe')
      expect(MealPlanTypeSchema.parse('dining-out')).toBe('dining-out')
      expect(MealPlanTypeSchema.parse('takeout')).toBe('takeout')
      expect(MealPlanTypeSchema.parse('leftovers')).toBe('leftovers')
      expect(MealPlanTypeSchema.parse('skipping')).toBe('skipping')
      expect(MealPlanTypeSchema.parse('other')).toBe('other')
    })

    it('should reject invalid meal plan types', () => {
      expect(() => MealPlanTypeSchema.parse('invalid')).toThrow()
    })
  })

  describe('getMealPlanTypeInfo', () => {
    it('should return info for custom meal types', () => {
      const info = getMealPlanTypeInfo('dining-out')
      expect(info).toEqual({
        value: 'dining-out',
        label: 'Dining Out',
        icon: '🍽️',
      })
    })

    it('should return info for all custom meal types', () => {
      CUSTOM_MEAL_TYPES.forEach(type => {
        const info = getMealPlanTypeInfo(type.value)
        expect(info).toEqual(type)
      })
    })

    it('should return null for recipe type', () => {
      const info = getMealPlanTypeInfo('recipe')
      expect(info).toBeNull()
    })
  })

  describe('RecipeMealPlanSchema', () => {
    it('should validate a complete recipe meal plan', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = RecipeMealPlanSchema.parse(mealPlan)
      expect(result).toEqual(mealPlan)
    })

    it('should set default timestamps', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
      }

      const result = RecipeMealPlanSchema.parse(mealPlan)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should accept optional note', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        note: 'Make extra for leftovers',
      }

      const result = RecipeMealPlanSchema.parse(mealPlan)
      expect(result.note).toBe('Make extra for leftovers')
    })

    it('should reject non-positive servings', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 0,
      }

      expect(() => RecipeMealPlanSchema.parse(mealPlan)).toThrow()
    })

    it('should reject negative servings', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: -1,
      }

      expect(() => RecipeMealPlanSchema.parse(mealPlan)).toThrow()
    })
  })

  describe('CustomMealPlanSchema', () => {
    it('should validate a custom meal plan', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'dining-out',
        customText: 'Italian Restaurant',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = CustomMealPlanSchema.parse(mealPlan)
      expect(result).toEqual(mealPlan)
    })

    it('should validate all custom meal types', () => {
      const types = [
        'dining-out',
        'takeout',
        'leftovers',
        'skipping',
        'other',
      ] as const

      types.forEach(type => {
        const mealPlan = {
          id: 'mp1',
          date: '2026-01-28',
          mealType: 'dinner',
          type,
        }

        const result = CustomMealPlanSchema.parse(mealPlan)
        expect(result.type).toBe(type)
      })
    })

    it('should accept optional customText', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'other',
        customText: 'Meal prep containers',
      }

      const result = CustomMealPlanSchema.parse(mealPlan)
      expect(result.customText).toBe('Meal prep containers')
    })

    it('should reject recipe type', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
      }

      expect(() => CustomMealPlanSchema.parse(mealPlan)).toThrow()
    })
  })

  describe('MealPlanSchema', () => {
    it('should validate recipe meal plan', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
      }

      const result = MealPlanSchema.parse(mealPlan)
      expect(result.type).toBe('recipe')
    })

    it('should validate custom meal plan', () => {
      const mealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'dining-out',
      }

      const result = MealPlanSchema.parse(mealPlan)
      expect(result.type).toBe('dining-out')
    })
  })

  describe('isRecipeMealPlan', () => {
    it('should return true for recipe meal plan', () => {
      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as RecipeMealPlan

      expect(isRecipeMealPlan(mealPlan)).toBe(true)
    })

    it('should return false for custom meal plan', () => {
      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'dining-out',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CustomMealPlan

      expect(isRecipeMealPlan(mealPlan)).toBe(false)
    })
  })

  describe('isCustomMealPlan', () => {
    it('should return true for custom meal plan', () => {
      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'dining-out',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CustomMealPlan

      expect(isCustomMealPlan(mealPlan)).toBe(true)
    })

    it('should return false for recipe meal plan', () => {
      const mealPlan: MealPlan = {
        id: 'mp1',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as RecipeMealPlan

      expect(isCustomMealPlan(mealPlan)).toBe(false)
    })
  })
})
