import { z } from 'zod'

import { Ingredient, UnitSchema } from '../types/ingredient'
import { Recipe, RecipeSchema } from '../types/recipe'

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
 * Schema for sub-recipes in AI imports - includes the full recipe inline
 * No ID required - will be generated automatically
 */
const ImportedSubRecipeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    recipe: z.object({
      name: z.string(),
      description: z.string(),
      ingredients: z.array(ImportedIngredientSchema).min(1),
      instructions: z.array(z.string()).min(1),
      servings: z.number().positive(),
      prepTime: z.number().positive(),
      cookTime: z.number().positive(),
      tags: z.array(z.string()),
      subRecipes: z.array(ImportedSubRecipeSchema).default([]),
      imageUrl: z.string().optional(),
    }),
    servings: z.number().positive('Servings must be positive'),
    displayName: z.string().optional(),
  })
)

const ImportedRecipeSchema = RecipeSchema.omit({ id: true }).extend({
  ingredients: z
    .array(ImportedIngredientSchema)
    .min(1, 'At least one ingredient is required'),
  subRecipes: z.array(ImportedSubRecipeSchema).default([]),
  servings: z.number().min(1, 'Servings must be at least 1'),
  prepTime: z.number().min(1, 'Prep time must be at least 1 minute'),
  cookTime: z.number().min(1, 'Cook time must be at least 1 minute'),
})

export interface ValidationResult {
  isValid: boolean
  recipe?: z.infer<typeof RecipeSchema>
  subRecipes: z.infer<typeof RecipeSchema>[] // All sub-recipes extracted and flattened
  newIngredients: Ingredient[]
  errors: string[]
}

/**
 * Helper to recursively extract sub-recipes from imported format and convert to standard Recipe format
 * @param importedSubRecipes - Sub-recipes in AI import format (with inline recipe objects)
 * @param existingIngredients - Current ingredient library
 * @param newIngredients - Array to collect new ingredients from sub-recipes
 * @param subRecipeIdMapping - Mapping of sub-recipe names to generated IDs
 * @returns Array of extracted Recipe objects and array of SubRecipe references
 */
function extractSubRecipes(
  importedSubRecipes: any[],
  existingIngredients: Ingredient[],
  newIngredients: Ingredient[]
): {
  recipes: z.infer<typeof RecipeSchema>[]
  references: z.infer<typeof import('../types/recipe').SubRecipeSchema>[]
} {
  const extractedRecipes: z.infer<typeof RecipeSchema>[] = []
  const references: z.infer<
    typeof import('../types/recipe').SubRecipeSchema
  >[] = []

  for (const importedSubRecipe of importedSubRecipes) {
    const subRecipe = importedSubRecipe.recipe

    // Generate ID for this sub-recipe
    const subRecipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Match ingredients by name for sub-recipe
    const ingredientIdMapping: Record<string, string> = {}
    for (const ingredient of subRecipe.ingredients) {
      const ingredientName = ingredient.name
      const ingredientCategory = ingredient.category

      const matchingExisting = existingIngredients.find(
        existing => existing.name.toLowerCase() === ingredientName.toLowerCase()
      )

      if (matchingExisting) {
        ingredientIdMapping[ingredientName] = matchingExisting.id
      } else {
        const newId = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        ingredientIdMapping[ingredientName] = newId

        if (
          !newIngredients.find(
            ing => ing.name.toLowerCase() === ingredientName.toLowerCase()
          )
        ) {
          newIngredients.push({
            id: newId,
            name: ingredientName,
            category: ingredientCategory || 'Other',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      }
    }

    // Recursively extract nested sub-recipes
    const { recipes: nestedRecipes, references: nestedReferences } =
      extractSubRecipes(
        subRecipe.subRecipes || [],
        existingIngredients,
        newIngredients
      )

    // Build clean sub-recipe with remapped ingredient IDs
    const cleanSubRecipe: z.infer<typeof RecipeSchema> = {
      id: subRecipeId,
      name: subRecipe.name,
      description: subRecipe.description,
      ingredients: subRecipe.ingredients.map((ing: any) => ({
        ingredientId: ingredientIdMapping[ing.name],
        quantity: ing.quantity,
        unit: ing.unit,
        ...(ing.displayName && { displayName: ing.displayName }),
      })),
      subRecipes: nestedReferences,
      instructions: subRecipe.instructions,
      servings: subRecipe.servings,
      prepTime: subRecipe.prepTime,
      cookTime: subRecipe.cookTime,
      tags: subRecipe.tags,
      ...(subRecipe.imageUrl && { imageUrl: subRecipe.imageUrl }),
    }

    extractedRecipes.push(cleanSubRecipe, ...nestedRecipes)

    // Create reference to this sub-recipe for parent
    references.push({
      recipeId: subRecipeId,
      servings: importedSubRecipe.servings,
      ...(importedSubRecipe.displayName && {
        displayName: importedSubRecipe.displayName,
      }),
    })
  }

  return { recipes: extractedRecipes, references }
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
      subRecipes: [],
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
      subRecipes: [],
      errors: zodErrors,
    }
  }

  const importedRecipe = validation.data
  const idMapping: Record<string, string> = {} // Maps ingredient names to IDs

  // Step 3: Match ingredients by name and create mapping
  for (const ingredient of importedRecipe.ingredients) {
    const ingredientName = ingredient.name
    const ingredientCategory = ingredient.category

    // Try to find matching ingredient by name (case-insensitive)
    const matchingExisting = existingIngredients.find(
      existing => existing.name.toLowerCase() === ingredientName.toLowerCase()
    )

    if (matchingExisting) {
      // Map ingredient name to existing ingredient ID
      idMapping[ingredientName] = matchingExisting.id
    } else {
      // Create new ingredient with provided category
      const newId = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  // If there are ingredient validation errors, return them
  if (errors.length > 0) {
    return {
      isValid: false,
      newIngredients: [],
      subRecipes: [],
      errors,
    }
  }

  // Step 4: Extract and process sub-recipes from imported format
  const { recipes: extractedSubRecipes, references: subRecipeReferences } =
    extractSubRecipes(
      importedRecipe.subRecipes || [],
      existingIngredients,
      newIngredients
    )

  // Step 5: Build final recipe with clean ingredients and sub-recipe references
  const cleanRecipe: Recipe = {
    ...importedRecipe,
    id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Always generate ID
    ingredients: importedRecipe.ingredients.map(ing => ({
      ingredientId: idMapping[ing.name] || idMapping[ing.name], // Use mapped ID based on ingredient name
      quantity: ing.quantity,
      unit: ing.unit, // Preserve unit from recipe ingredient
      ...(ing.displayName && { displayName: ing.displayName }),
    })),
    subRecipes: subRecipeReferences,
  }

  return {
    isValid: true,
    recipe: cleanRecipe,
    subRecipes: extractedSubRecipes,
    newIngredients,
    errors: [],
  }
}
