import { z } from 'zod'

import {
  Ingredient,
  IngredientCategorySchema,
  UnitSchema,
} from '../types/ingredient'
import { RecipeSchema } from '../types/recipe'

/**
 * Extended ingredient schema for AI-generated recipes with suggested new ingredients
 * Reuses IngredientCategorySchema and UnitSchema from ingredient types
 */
const ImportedIngredientSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number(),
  suggestedIngredient: z
    .object({
      id: z.string(),
      name: z.string(),
      category: IngredientCategorySchema,
      unit: UnitSchema,
    })
    .optional(),
})

const ImportedRecipeSchema = RecipeSchema.extend({
  ingredients: z
    .array(ImportedIngredientSchema)
    .min(1, 'At least one ingredient is required'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  totalTime: z.number().min(1, 'Total time must be at least 1 minute'),
})

export interface ValidationResult {
  isValid: boolean
  recipe?: z.infer<typeof RecipeSchema>
  newIngredients: Ingredient[]
  errors: string[]
}

/**
 * Validates imported recipe JSON from AI and checks ingredient references
 * @param jsonString - The JSON string from AI response
 * @param existingIngredients - Current ingredient library
 * @returns Validation result with errors or validated recipe
 */
export function validateRecipeImport(
  jsonString: string,
  existingIngredients: Ingredient[]
): ValidationResult {
  const errors: string[] = []
  const newIngredients: Ingredient[] = []

  // Step 1: Parse JSON
  let parsedData: unknown
  try {
    parsedData = JSON.parse(jsonString)
  } catch (error) {
    console.log('JSON parse error:', error);
    return {
      isValid: false,
      newIngredients: [],
      errors: ['Invalid JSON format. Please check the JSON syntax.'],
    }
  }

  // Step 2: Validate against schema
  const validation = ImportedRecipeSchema.safeParse(parsedData)

  if (!validation.success) {
    const zodErrors = validation.error.errors.map(err => {
      const path = err.path.join('.')
      return path ? `${path}: ${err.message}` : err.message
    })
    return {
      isValid: false,
      newIngredients: [],
      errors: zodErrors,
    }
  }

  const importedRecipe = validation.data
  const existingIngredientIds = new Set(existingIngredients.map(ing => ing.id))
  const newIngredientIds = new Set<string>()

  // Step 3: Validate and collect ingredient references
  for (const ingredient of importedRecipe.ingredients) {
    const ingredientId = ingredient.ingredientId

    // Check if ingredient exists in library
    if (existingIngredientIds.has(ingredientId)) {
      // Valid existing ingredient
      continue
    }

    // Check if there's a suggested new ingredient
    if (ingredient.suggestedIngredient) {
      // Validate suggested ingredient ID matches ingredientId
      if (ingredient.suggestedIngredient.id !== ingredientId) {
        errors.push(
          `Ingredient ID mismatch: ${ingredientId} !== ${ingredient.suggestedIngredient.id}`
        )
        continue
      }

      // Add to new ingredients list (avoid duplicates)
      if (!newIngredientIds.has(ingredientId)) {
        newIngredientIds.add(ingredientId)
        newIngredients.push({
          id: ingredient.suggestedIngredient.id,
          name: ingredient.suggestedIngredient.name,
          category: ingredient.suggestedIngredient.category,
          unit: ingredient.suggestedIngredient.unit,
        })
      }
    } else {
      // Ingredient not in library and no suggestion provided
      errors.push(
        `Ingredient ID "${ingredientId}" not found in library and no suggested ingredient provided`
      )
    }
  }

  // If there are ingredient validation errors, return them
  if (errors.length > 0) {
    return {
      isValid: false,
      newIngredients: [],
      errors,
    }
  }

  // Step 4: Build final recipe with clean ingredients (remove suggestedIngredient field)
  const cleanRecipe = {
    ...importedRecipe,
    ingredients: importedRecipe.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      quantity: ing.quantity,
    })),
  }

  return {
    isValid: true,
    recipe: cleanRecipe,
    newIngredients,
    errors: [],
  }
}
