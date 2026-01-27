import { z } from 'zod'

import { Unit, UnitSchema } from './ingredient'

/**
 * RecipeIngredient interface
 * Represents an ingredient with quantity as used in a specific recipe
 */
export interface RecipeIngredient {
  ingredientId: string // references Ingredient.id
  quantity: number
  unit?: Unit // optional during migration, will be required later
  displayName?: string // optional custom display name for this recipe
}

/**
 * Zod schema for RecipeIngredient validation
 */
export const RecipeIngredientSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number(),
  unit: UnitSchema.optional(), // optional for backward compatibility during migration
  displayName: z.string().optional(),
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
  prepTime: number // preparation time in minutes
  cookTime: number // cooking time in minutes
  totalTime?: number // DEPRECATED: kept for backward compatibility during migration
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
  prepTime: z.number().positive('Prep time must be positive'),
  cookTime: z.number().positive('Cook time must be positive'),
  totalTime: z.number().optional(), // DEPRECATED: backward compatibility
  tags: z.array(z.string()),
  imageUrl: z
    .string()
    .transform(val => (val === '' ? undefined : val))
    .pipe(
      z
        .string()
        .url('Image URL must be a valid URL')
        .refine(
          url => url.startsWith('http://') || url.startsWith('https://'),
          {
            message: 'Image URL must use http or https protocol',
          }
        )
        .optional()
    )
    .or(z.literal(undefined)),
})

/**
 * Zod schema for Recipe form validation (without id)
 */
export const RecipeFormSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().min(1, 'Description is required'),
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(1, 'At least one ingredient is required'),
  instructions: z
    .array(z.string().min(1))
    .min(1, 'At least one instruction is required'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  prepTime: z.number().min(1, 'Prep time must be at least 1 minute'),
  cookTime: z.number().min(1, 'Cook time must be at least 1 minute'),
  tags: z.array(z.string()),
  imageUrl: z
    .string()
    .transform(val => (val === '' ? undefined : val))
    .pipe(
      z
        .string()
        .url('Image URL must be a valid URL')
        .refine(
          url => url.startsWith('http://') || url.startsWith('https://'),
          {
            message: 'Image URL must use http or https protocol',
          }
        )
        .optional()
    )
    .or(z.literal(undefined)),
})

export type RecipeFormValues = z.infer<typeof RecipeFormSchema>
