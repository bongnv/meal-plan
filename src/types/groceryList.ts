import { z } from 'zod'

import { IngredientCategorySchema, UnitSchema } from './ingredient'

/**
 * GroceryItem represents a single item in a grocery list
 */
export const GroceryItemSchema = z.object({
  id: z.string().min(1),
  ingredientId: z.string().min(1).nullable(), // null = manually added item
  quantity: z.number().positive(),
  unit: UnitSchema,
  category: IngredientCategorySchema, // Denormalized from ingredient library
  checked: z.boolean(),
  mealPlanIds: z.array(z.string().min(1)), // Which meal plans need this ingredient
  notes: z.string().optional(), // Optional user notes
})

export type GroceryItem = z.infer<typeof GroceryItemSchema>

/**
 * GroceryList represents a shopping list generated from meal plans
 */
export const GroceryListSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    dateRange: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
    }),
    createdAt: z.number().nonnegative(), // Unix timestamp
    items: z.array(GroceryItemSchema),
  })
  .refine(
    data => {
      // Validate that start date is not after end date
      return data.dateRange.start <= data.dateRange.end
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['dateRange'],
    }
  )

export type GroceryList = z.infer<typeof GroceryListSchema>
