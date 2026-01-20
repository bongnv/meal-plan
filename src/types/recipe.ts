import { z } from 'zod'

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
 * Zod schema for Unit validation
 */
export const UnitSchema = z.enum(UNITS)

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
 * Zod schema for Ingredient validation
 */
export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: UnitSchema,
})

/**
 * RecipeIngredient interface
 * Represents an ingredient with quantity as used in a specific recipe
 */
export interface RecipeIngredient {
  ingredientId: string // references Ingredient.id
  quantity: number
}

/**
 * Zod schema for RecipeIngredient validation
 */
export const RecipeIngredientSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number(),
})

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

/**
 * Zod schema for Recipe validation
 */
export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  instructions: z.array(z.string()),
  servings: z.number(),
  totalTime: z.number(),
  tags: z.array(z.string()),
  imageUrl: z.string().optional(),
})
