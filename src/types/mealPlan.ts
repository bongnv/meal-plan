import { z } from 'zod'

export type MealType = 'lunch' | 'dinner'

export type MealPlanType =
  | 'recipe'
  | 'dining-out'
  | 'takeout'
  | 'leftovers'
  | 'skipping'
  | 'other'

export interface MealPlanTypeInfo {
  value: MealPlanType
  label: string
  icon: string
}

export const CUSTOM_MEAL_TYPES: MealPlanTypeInfo[] = [
  { value: 'dining-out', label: 'Dining Out', icon: '🍽️' },
  { value: 'takeout', label: 'Takeout', icon: '🥡' },
  { value: 'leftovers', label: 'Leftovers', icon: '♻️' },
  { value: 'skipping', label: 'Skipping Meal', icon: '⏭️' },
  { value: 'other', label: 'Other', icon: '📝' },
]

export function getMealPlanTypeInfo(
  type: MealPlanType
): MealPlanTypeInfo | null {
  return CUSTOM_MEAL_TYPES.find(c => c.value === type) || null
}

interface BaseMealPlan {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  mealType: MealType
  type: MealPlanType
  note?: string // Optional note for any meal (e.g., "make extra for leftovers", "John's favorite")
}

export interface RecipeMealPlan extends BaseMealPlan {
  type: 'recipe'
  recipeId: string // Recipe name will be fetched from RecipeContext when needed
  servings: number
}

export interface CustomMealPlan extends BaseMealPlan {
  type: 'dining-out' | 'takeout' | 'leftovers' | 'skipping' | 'other'
  customText?: string
}

export type MealPlan = RecipeMealPlan | CustomMealPlan

export function isRecipeMealPlan(
  mealPlan: MealPlan
): mealPlan is RecipeMealPlan {
  return mealPlan.type === 'recipe'
}

export function isCustomMealPlan(
  mealPlan: MealPlan
): mealPlan is CustomMealPlan {
  return mealPlan.type !== 'recipe'
}

// Copy functionality types
export type CopyFrequency =
  | 'one-time'
  | 'weekly'
  | 'specific-weekday'
  | 'custom-interval'

export type CopyEndCondition = 'until-date' | 'after-occurrences'

export type ConflictResolution = 'replace' | 'skip' | 'cancel'

export interface CopyOptions {
  frequency: CopyFrequency
  targetDate: Date // Initial target date (for one-time or start date for recurring)
  weeklyInterval?: number // For weekly: every X weeks (default 1)
  specificWeekday?: number // For specific-weekday: 0-6 (Sunday-Saturday)
  customIntervalDays?: number // For custom-interval: every X days
  endCondition?: CopyEndCondition // Required for recurring patterns
  endDate?: Date // For until-date
  occurrences?: number // For after-occurrences
}

export interface CopyPreviewItem {
  date: string // ISO date string
  hasConflict: boolean
  existingMeal?: MealPlan // The conflicting meal if any
}

export interface CopyResult {
  targetDates: string[] // ISO date strings
  conflicts: CopyPreviewItem[]
  preview: CopyPreviewItem[]
}

// Zod Schemas for validation

export const MealTypeSchema = z.enum(['lunch', 'dinner'])

export const MealPlanTypeSchema = z.enum([
  'recipe',
  'dining-out',
  'takeout',
  'leftovers',
  'skipping',
  'other',
])

const BaseMealPlanSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  mealType: MealTypeSchema,
  type: MealPlanTypeSchema,
  note: z.string().optional(),
})

export const RecipeMealPlanSchema = BaseMealPlanSchema.extend({
  type: z.literal('recipe'),
  recipeId: z.string(),
  servings: z.number().positive(),
})

export const CustomMealPlanSchema = BaseMealPlanSchema.extend({
  type: z.enum(['dining-out', 'takeout', 'leftovers', 'skipping', 'other']),
  customText: z.string().optional(),
})

export const MealPlanSchema = z.discriminatedUnion('type', [
  RecipeMealPlanSchema,
  CustomMealPlanSchema,
])
