/**
 * Predefined units for ingredients
 * Ensures consistency for grocery list consolidation
 */
export const UNITS = [
  'cup',
  'tablespoon',
  'teaspoon',
  'gram',
  'kilogram',
  'milliliter',
  'liter',
  'piece',
  'clove',
  'slice',
  'bunch',
  'pinch',
  'dash',
  'can',
  'package',
] as const

export type Unit = (typeof UNITS)[number]

/**
 * Ingredient interface
 * Represents a base ingredient from the ingredient library
 */
export interface Ingredient {
  id: string
  name: string
  unit: Unit
}

/**
 * RecipeIngredient interface
 * Represents an ingredient with quantity as used in a specific recipe
 */
export interface RecipeIngredient {
  ingredientId: string // references Ingredient.id
  quantity: number
}

/**
 * Recipe interface
 * Represents a complete recipe with all its details
 */
export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  servings: number
  totalTime: number // in minutes
  tags: string[]
  imageUrl?: string // optional
}
