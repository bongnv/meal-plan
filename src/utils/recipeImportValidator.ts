import { z } from 'zod'

import { Ingredient, UnitSchema } from '../types/ingredient'
import { Recipe, RecipeSchema } from '../types/recipe'

import { generateId } from './idGenerator'

/**
 * Extended ingredient schema for AI-generated recipes
 * Uses ingredient names instead of IDs - will be matched or created automatically
 */
const ImportedIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: UnitSchema, // Unit is at recipe ingredient level (post-I9.7)
  category: z.string().optional(), // Category for new ingredients
  displayName: z.string().optional(),
})

/**
 * Schema for sections in AI imports
 */
const ImportedSectionSchema = z.object({
  name: z.string().optional(),
  ingredients: z.array(ImportedIngredientSchema).min(1),
  instructions: z.array(z.string()).min(1),
})

const ImportedRecipeSchema = RecipeSchema.omit({ id: true }).extend({
  sections: z
    .array(ImportedSectionSchema)
    .min(1, 'At least one section is required'),
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
  const idMapping: Record<string, string> = {} // Maps ingredient names to IDs

  // Step 3: Match ingredients by name from all sections and create mapping
  for (const section of importedRecipe.sections) {
    for (const ingredient of section.ingredients) {
      const ingredientName = ingredient.name
      const ingredientCategory = ingredient.category

      // Skip if already mapped (avoid duplicate processing)
      if (idMapping[ingredientName]) {
        continue
      }

      // Try to find matching ingredient by name (case-insensitive)
      const matchingExisting = existingIngredients.find(
        existing => existing.name.toLowerCase() === ingredientName.toLowerCase()
      )

      if (matchingExisting) {
        // Map ingredient name to existing ingredient ID
        idMapping[ingredientName] = matchingExisting.id
      } else {
        // Create new ingredient with provided category
        const newId = generateId()
        idMapping[ingredientName] = newId

        // Check if we already added this ingredient (avoid duplicates)
        if (
          !newIngredients.find(
            ing => ing.name.toLowerCase() === ingredientName.toLowerCase()
          )
        ) {
          newIngredients.push({
            id: newId,
            name: ingredientName,
            category: (ingredientCategory as any) || 'Other', // Use provided category or default
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      }
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

  // Step 4: Build final recipe with clean sections
  const cleanRecipe: Recipe = {
    ...importedRecipe,
    id: generateId(), // Always generate ID
    sections: importedRecipe.sections.map(section => ({
      name: section.name,
      ingredients: section.ingredients.map(ing => ({
        ingredientId: idMapping[ing.name],
        quantity: ing.quantity,
        unit: ing.unit,
        ...(ing.displayName && { displayName: ing.displayName }),
      })),
      instructions: section.instructions,
    })),
  }

  return {
    isValid: true,
    recipe: cleanRecipe,
    newIngredients,
    errors: [],
  }
}
