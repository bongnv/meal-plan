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
  unit: UnitSchema, // Unit is at recipe ingredient level (post-I9.7)
  displayName: z.string().optional(),
  suggestedIngredient: z
    .object({
      id: z.string(),
      name: z.string(),
      category: IngredientCategorySchema,
      // No unit field - ingredients don't have units after I9.7
    })
    .optional(),
})

const ImportedRecipeSchema = RecipeSchema.extend({
  ingredients: z
    .array(ImportedIngredientSchema)
    .min(1, 'At least one ingredient is required'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  prepTime: z.number().min(1, 'Prep time must be at least 1 minute'),
  cookTime: z.number().min(1, 'Cook time must be at least 1 minute'),
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
    console.log('JSON parse error:', error)
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
  const idMapping: Record<string, string> = {} // Maps AI-suggested IDs to existing/new IDs

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

      // Check if an existing ingredient has the same name (case-insensitive)
      // Note: Ingredients no longer have units (I9.7), match by name only
      const matchingExisting = existingIngredients.find(
        existing =>
          existing.name.toLowerCase() ===
          ingredient.suggestedIngredient!.name.toLowerCase()
      )

      if (matchingExisting) {
        // Remap the AI-suggested ID to the existing ingredient's ID
        idMapping[ingredientId] = matchingExisting.id
      } else {
        // Add to new ingredients list (avoid duplicates)
        if (!newIngredientIds.has(ingredientId)) {
          newIngredientIds.add(ingredientId)
          newIngredients.push({
            id: ingredient.suggestedIngredient.id,
            name: ingredient.suggestedIngredient.name,
            category: ingredient.suggestedIngredient.category,
          })
        }
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

  // Step 4: Build final recipe with clean ingredients (remove suggestedIngredient field and apply ID mapping)
  const cleanRecipe = {
    ...importedRecipe,
    ingredients: importedRecipe.ingredients.map(ing => ({
      ingredientId: idMapping[ing.ingredientId] || ing.ingredientId,
      quantity: ing.quantity,
      unit: ing.unit, // Preserve unit from recipe ingredient
      ...(ing.displayName && { displayName: ing.displayName }),
    })),
  }

  return {
    isValid: true,
    recipe: cleanRecipe,
    newIngredients,
    errors: [],
  }
}
