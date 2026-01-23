import { roundQuantity } from './quantityRounding'

import type { GroceryList } from '../types/groceryList'
import type { Ingredient, IngredientCategory, Unit } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

interface DateRange {
  start: string // ISO date string YYYY-MM-DD
  end: string // ISO date string YYYY-MM-DD
}

interface AccumulatedIngredient {
  ingredientId: string
  quantity: number
  unit: Unit
  category: IngredientCategory
  mealPlanIds: string[]
}

/**
 * Generate a grocery list from meal plans within a date range.
 * Consolidates ingredients by ingredientId, scales quantities by servings,
 * and applies smart rounding based on unit type.
 */
export function generateGroceryList(
  dateRange: DateRange,
  name: string,
  mealPlans: MealPlan[],
  recipes: Recipe[],
  ingredients: Ingredient[]
): GroceryList {
  // Create lookup maps for fast access
  const recipeMap = new Map(recipes.map(r => [r.id, r]))
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

  // Filter meal plans in date range and only recipe-based meals
  const relevantMealPlans = mealPlans.filter(mp => {
    if (mp.type !== 'recipe') return false
    return mp.date >= dateRange.start && mp.date <= dateRange.end
  })

  // Accumulate ingredients by ingredientId
  const accumulated = new Map<string, AccumulatedIngredient>()

  for (const mealPlan of relevantMealPlans) {
    // Type guard ensures mp is RecipeMealPlan
    if (mealPlan.type !== 'recipe') continue

    const recipe = recipeMap.get(mealPlan.recipeId)
    if (!recipe) continue // Skip if recipe not found

    const scaleFactor = mealPlan.servings / recipe.servings

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = ingredientMap.get(recipeIngredient.ingredientId)
      if (!ingredient) continue // Skip if ingredient not found

      const scaledQuantity = recipeIngredient.quantity * scaleFactor
      const key = recipeIngredient.ingredientId

      if (accumulated.has(key)) {
        // Add to existing
        const existing = accumulated.get(key)!
        existing.quantity += scaledQuantity
        existing.mealPlanIds.push(mealPlan.id)
      } else {
        // Create new entry (get unit from ingredient library)
        accumulated.set(key, {
          ingredientId: recipeIngredient.ingredientId,
          quantity: scaledQuantity,
          unit: ingredient.unit, // Get unit from ingredient library
          category: ingredient.category,
          mealPlanIds: [mealPlan.id],
        })
      }
    }
  }

  // Convert accumulated data to grocery items with smart rounding
  const items = Array.from(accumulated.values()).map(acc => ({
    id: `gi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ingredientId: acc.ingredientId,
    quantity: roundQuantity(acc.quantity, acc.unit),
    unit: acc.unit,
    category: acc.category,
    checked: false,
    mealPlanIds: acc.mealPlanIds,
  }))

  return {
    id: `gl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    dateRange,
    createdAt: Date.now(),
    items,
  }
}
