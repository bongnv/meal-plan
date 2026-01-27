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
  'whole',
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

// Ingredient categories for organization
export const INGREDIENT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Meat',
  'Poultry',
  'Seafood',
  'Dairy',
  'Grains',
  'Legumes',
  'Nuts & Seeds',
  'Herbs & Spices',
  'Oils & Fats',
  'Condiments',
  'Baking',
  'Other',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

export const IngredientCategorySchema = z.enum(INGREDIENT_CATEGORIES)

// Ingredient interface - base ingredient in the library
export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  createdAt: number // Unix timestamp
  updatedAt: number // Unix timestamp
}

// Zod schema for Ingredient
export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ingredient name is required'),
  category: IngredientCategorySchema,
  createdAt: z
    .number()
    .nonnegative()
    .optional()
    .default(() => Date.now()),
  updatedAt: z
    .number()
    .nonnegative()
    .optional()
    .default(() => Date.now()),
})

// Form values type (without id)
export const IngredientFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  category: z.enum(INGREDIENT_CATEGORIES, {
    errorMap: () => ({ message: 'Category is required' }),
  }),
})

export type IngredientFormValues = z.infer<typeof IngredientFormSchema>
