import { roundQuantity } from './quantityRounding'
import {
  consolidateUnit,
  normalizeUnitForConsolidation,
  convertQuantity,
} from './unitConversion'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { Ingredient, IngredientCategory, Unit } from '../types/ingredient'
import type { MealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

interface DateRange {
  start: string // ISO date string YYYY-MM-DD
  end: string // ISO date string YYYY-MM-DD
}

interface AccumulatedIngredient {
  name: string
  quantity: number
  unit: Unit
  category: IngredientCategory
  mealPlanIds: string[]
}

interface ExpandedIngredient {
  ingredientId: string
  quantity: number
  unit: Unit
  mealPlanId: string
}

const MAX_RECURSION_DEPTH = 3

/**
 * Recursively expand a recipe's ingredients, including sub-recipes.
 * Returns a flat list of all ingredients with their scaled quantities.
 *
 * @param recipe - The recipe to expand
 * @param servingMultiplier - How much to scale the recipe (mealPlan.servings / recipe.servings)
 * @param mealPlanId - The meal plan ID to track ingredient sources
 * @param recipeMap - Map of all recipes for sub-recipe lookup
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param visited - Set of recipe IDs visited in current chain (prevents circular dependencies)
 * @returns Array of expanded ingredients with scaled quantities
 */
function expandRecipeIngredients(
  recipe: Recipe,
  servingMultiplier: number,
  mealPlanId: string,
  _recipeMap: Map<string, Recipe>,
  depth: number = 0,
  visited: Set<string> = new Set()
): ExpandedIngredient[] {
  const result: ExpandedIngredient[] = []

  // Safety checks
  if (depth >= MAX_RECURSION_DEPTH) {
    console.warn(
      `Max recursion depth (${MAX_RECURSION_DEPTH}) reached for recipe: ${recipe.name}`
    )
    return result
  }

  if (visited.has(recipe.id)) {
    console.warn(`Circular dependency detected for recipe: ${recipe.name}`)
    return result
  }

  // Mark this recipe as visited
  const newVisited = new Set(visited)
  newVisited.add(recipe.id)

  // Flatten sections to get all ingredients
  const allIngredients = recipe.sections.flatMap(section => section.ingredients)

  // Add direct ingredients
  for (const recipeIngredient of allIngredients) {
    result.push({
      ingredientId: recipeIngredient.ingredientId,
      quantity: recipeIngredient.quantity * servingMultiplier,
      unit: recipeIngredient.unit || 'piece',
      mealPlanId,
    })
  }

  return result
}

/**
 * Generate a grocery list from meal plans within a date range.
 * Consolidates ingredients by ingredientId, scales quantities by servings,
 * and applies smart rounding based on unit type.
 * Returns separate list metadata and items array for normalized storage.
 */
export function generateGroceryList(
  dateRange: DateRange,
  name: string,
  mealPlans: MealPlan[],
  recipes: Recipe[],
  ingredients: Ingredient[]
): { list: GroceryList; items: GroceryItem[] } {
  // Create lookup maps for fast access
  const recipeMap = new Map(recipes.map(r => [r.id, r]))
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

  // Filter meal plans in date range and only recipe-based meals
  const relevantMealPlans = mealPlans.filter(mp => {
    if (mp.type !== 'recipe') return false
    return mp.date >= dateRange.start && mp.date <= dateRange.end
  })

  // Accumulate ingredients by ingredientId and normalized unit
  // This allows us to combine e.g., 500g + 600g = 1.1kg
  const accumulated = new Map<string, AccumulatedIngredient>()

  for (const mealPlan of relevantMealPlans) {
    // Type guard ensures mp is RecipeMealPlan
    if (mealPlan.type !== 'recipe') continue

    const recipe = recipeMap.get(mealPlan.recipeId)
    if (!recipe) continue // Skip if recipe not found

    const scaleFactor = mealPlan.servings / recipe.servings

    // Recursively expand recipe ingredients (including sub-recipes)
    const expandedIngredients = expandRecipeIngredients(
      recipe,
      scaleFactor,
      mealPlan.id,
      recipeMap
    )

    for (const expandedIngredient of expandedIngredients) {
      const ingredient = ingredientMap.get(expandedIngredient.ingredientId)
      if (!ingredient) continue // Skip if ingredient not found

      const key = expandedIngredient.ingredientId

      if (accumulated.has(key)) {
        // Add to existing - convert to normalized unit first
        const existing = accumulated.get(key)!
        const normalizedUnit = normalizeUnitForConsolidation(
          expandedIngredient.unit
        )
        const existingNormalizedUnit = normalizeUnitForConsolidation(
          existing.unit
        )

        // If units can be combined (same normalized unit), add quantities
        if (normalizedUnit === existingNormalizedUnit) {
          // Convert ingredient quantity to normalized unit
          const convertedQuantity = convertQuantity(
            expandedIngredient.quantity,
            expandedIngredient.unit,
            normalizedUnit
          )
          // Convert existing quantity to normalized unit
          const existingConverted = convertQuantity(
            existing.quantity,
            existing.unit,
            normalizedUnit
          )

          existing.quantity = existingConverted + convertedQuantity
          existing.unit = normalizedUnit
          existing.mealPlanIds.push(expandedIngredient.mealPlanId)
        } else {
          // Different unit types - shouldn't happen in practice but handle it
          existing.quantity += expandedIngredient.quantity
          existing.mealPlanIds.push(expandedIngredient.mealPlanId)
        }
      } else {
        // Create new entry (use recipe ingredient unit and ingredient library name)
        accumulated.set(key, {
          name: ingredient.name,
          quantity: expandedIngredient.quantity,
          unit: expandedIngredient.unit,
          category: ingredient.category,
          mealPlanIds: [expandedIngredient.mealPlanId],
        })
      }
    }
  }

  // Convert accumulated data to grocery items with smart rounding and unit consolidation
  const listId = `gl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const items: GroceryItem[] = Array.from(accumulated.values()).map(acc => {
    const roundedQuantity = roundQuantity(acc.quantity, acc.unit)
    // Apply unit consolidation after rounding (e.g., 1000g becomes 1kg)
    const [consolidatedQuantity, consolidatedUnit] = consolidateUnit(
      roundedQuantity,
      acc.unit
    )

    return {
      id: `gi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      listId, // Link item to the parent list
      name: acc.name,
      quantity: consolidatedQuantity,
      unit: consolidatedUnit,
      category: acc.category,
      checked: false,
      mealPlanIds: acc.mealPlanIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  })

  const list: GroceryList = {
    id: listId,
    name,
    dateRange,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return { list, items }
}
