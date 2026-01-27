import { z } from 'zod'

import { IngredientCategorySchema, UnitSchema } from './ingredient'

/**
 * GroceryItem represents a single item in a grocery list
 */
export const GroceryItemSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1), // Reference to parent grocery list
  name: z.string().min(1), // Item name (copied from ingredient or manually entered)
  quantity: z.number().positive(),
  unit: UnitSchema,
  category: IngredientCategorySchema, // Category for grouping
  checked: z.boolean(),
  mealPlanIds: z.array(z.string().min(1)), // Which meal plans need this ingredient
  notes: z.string().optional(), // Optional user notes
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

export type GroceryItem = z.infer<typeof GroceryItemSchema>

/**
 * GroceryList represents a shopping list metadata (items stored separately)
 */
export const GroceryListSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    dateRange: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
    }),
    createdAt: z
      .number()
      .nonnegative()
      .optional()
      .default(() => Date.now()), // Unix timestamp
    updatedAt: z
      .number()
      .nonnegative()
      .optional()
      .default(() => Date.now()), // Unix timestamp
    note: z.string().optional(), // Optional note for the grocery list
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
