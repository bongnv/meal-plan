import { z } from 'zod'

export enum IngredientCategory {
  Produce = 'produce',
  Dairy = 'dairy',
  Meat = 'meat',
  Pantry = 'pantry',
  Frozen = 'frozen',
  Bakery = 'bakery',
  Other = 'other',
}

// Zod schemas
export const IngredientItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.nativeEnum(IngredientCategory),
  standardUnit: z.string().min(1),
})

export const RecipeIngredientSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number().positive(),
})

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  instructions: z.array(z.string()),
  servings: z.number().int().positive(),
  totalTime: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const RecipeInputSchema = RecipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// TypeScript types inferred from schemas
export type IngredientItem = z.infer<typeof IngredientItemSchema>
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>
export type Recipe = z.infer<typeof RecipeSchema>
export type RecipeInput = z.infer<typeof RecipeInputSchema>
