import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'

import {
  getNextMeal,
  getUpcomingMeals,
  getMealTime,
  formatMealDate,
} from './upcomingMeals'

import type { MealPlan } from '../../types/mealPlan'

describe('getMealTime', () => {
  it('should return 12:00:00 for lunch', () => {
    expect(getMealTime('lunch')).toBe('12:00:00')
  })

  it('should return 18:00:00 for dinner', () => {
    expect(getMealTime('dinner')).toBe('18:00:00')
  })

  it('should return 08:00:00 for breakfast', () => {
    expect(getMealTime('breakfast')).toBe('08:00:00')
  })

  it('should return 15:00:00 for snack', () => {
    expect(getMealTime('snack')).toBe('15:00:00')
  })
})

describe('formatMealDate', () => {
  beforeEach(() => {
    // Mock the current date to be 2026-01-28 10:00 AM
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "TODAY" for today\'s date with lunch', () => {
    expect(formatMealDate('2026-01-28', 'lunch')).toBe('TODAY - Lunch')
  })

  it('should return "TODAY" for today\'s date with dinner', () => {
    expect(formatMealDate('2026-01-28', 'dinner')).toBe('TODAY - Dinner')
  })

  it('should return "TOMORROW" for tomorrow\'s date', () => {
    expect(formatMealDate('2026-01-29', 'lunch')).toBe('TOMORROW - Lunch')
  })

  it('should return formatted date for dates beyond tomorrow', () => {
    expect(formatMealDate('2026-01-30', 'dinner')).toBe('Fri, Jan 30 - Dinner')
  })

  it('should return formatted date for dates in the future', () => {
    expect(formatMealDate('2026-02-05', 'lunch')).toBe('Thu, Feb 5 - Lunch')
  })

  it('should capitalize meal type', () => {
    expect(formatMealDate('2026-01-30', 'breakfast')).toBe(
      'Fri, Jan 30 - Breakfast'
    )
  })
})

describe('getNextMeal', () => {
  beforeEach(() => {
    // Mock the current date/time to be 2026-01-28 10:00 AM (before lunch)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when no meal plans exist', () => {
    expect(getNextMeal([])).toBeNull()
  })

  it('should return null when all meals are in the past', () => {
    const pastMeals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-27',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]
    expect(getNextMeal(pastMeals)).toBeNull()
  })

  it('should return next meal after current time', () => {
    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-28',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]
    const next = getNextMeal(meals)
    expect(next?.id).toBe('1')
    expect(next?.mealType).toBe('lunch')
  })

  it('should skip past meals and return next future meal', () => {
    // Set time to 1:00 PM (after lunch)
    vi.setSystemTime(new Date('2026-01-28T13:00:00'))

    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-28',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]
    const next = getNextMeal(meals)
    expect(next?.id).toBe('2')
    expect(next?.mealType).toBe('dinner')
  })
})

describe('getUpcomingMeals', () => {
  beforeEach(() => {
    // Mock the current date/time to be 2026-01-28 10:00 AM
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return empty array when no meal plans exist', () => {
    expect(getUpcomingMeals([], 5)).toEqual([])
  })

  it('should return empty array when all meals are before today', () => {
    const pastMeals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-27',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]
    expect(getUpcomingMeals(pastMeals, 5)).toEqual([])
  })

  it('should return requested number of upcoming meals', () => {
    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-28',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '3',
        date: '2026-01-29',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe3',
        servings: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '4',
        date: '2026-01-29',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe4',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '5',
        date: '2026-01-30',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe5',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]

    const upcoming = getUpcomingMeals(meals, 3)
    expect(upcoming).toHaveLength(3)
    expect(upcoming[0].id).toBe('1')
    expect(upcoming[1].id).toBe('2')
    expect(upcoming[2].id).toBe('3')
  })

  it('should return all upcoming meals when count exceeds available meals', () => {
    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-28',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-29',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]

    const upcoming = getUpcomingMeals(meals, 10)
    expect(upcoming).toHaveLength(2)
  })

  it('should sort meals by date and time correctly', () => {
    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-30',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-29',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '3',
        date: '2026-01-29',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe3',
        servings: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]

    const upcoming = getUpcomingMeals(meals, 5)
    expect(upcoming[0].id).toBe('3') // Jan 29 lunch
    expect(upcoming[1].id).toBe('2') // Jan 29 dinner
    expect(upcoming[2].id).toBe('1') // Jan 30 lunch
  })

  it('should include all meals from today even if they are in the past', () => {
    // Set time to 1:00 PM (after lunch at 12:00 PM)
    vi.setSystemTime(new Date('2026-01-28T13:00:00'))

    const meals: MealPlan[] = [
      {
        id: '1',
        date: '2026-01-28',
        mealType: 'lunch', // This is in the past (12:00 PM) but should still be included
        type: 'recipe',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '2',
        date: '2026-01-28',
        mealType: 'dinner',
        type: 'recipe',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
      {
        id: '3',
        date: '2026-01-29',
        mealType: 'lunch',
        type: 'recipe',
        recipeId: 'recipe3',
        servings: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as MealPlan,
    ]

    const upcoming = getUpcomingMeals(meals, 5)
    expect(upcoming).toHaveLength(3)
    // Should include today's lunch even though it's past
    expect(upcoming[0].id).toBe('1')
    expect(upcoming[0].mealType).toBe('lunch')
    expect(upcoming[1].id).toBe('2')
    expect(upcoming[2].id).toBe('3')
  })
})
