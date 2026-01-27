import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

/**
 * Migrates recipes from old schema (ingredients without units) to new schema
 * (ingredients with units from the ingredient library).
 *
 * Migration strategy:
 * - If recipe ingredient already has a unit, preserve it
 * - If recipe ingredient is missing unit, copy from ingredient library
 * - If ingredient not found in library, use 'piece' as fallback
 * - Does not mutate original recipes array
 *
 * @param recipes - Array of recipes to migrate
 * @param ingredients - Ingredient library for looking up units
 * @returns New array of migrated recipes
 */
export function migrateRecipes(
  recipes: Recipe[],
  ingredients: Ingredient[]
): Recipe[] {
  // Create ingredient lookup map for O(1) access
  const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]))

  return recipes.map(recipe => ({
    ...recipe,
    ingredients: recipe.ingredients.map(recipeIngredient => {
      // If unit already exists, preserve it
      if (recipeIngredient.unit) {
        return recipeIngredient
      }

      // Otherwise, copy unit from ingredient library
      const ingredient = ingredientMap.get(recipeIngredient.ingredientId)
      const unit = ingredient?.unit || 'piece' // Fallback to 'piece' if not found

      return {
        ...recipeIngredient,
        unit,
      }
    }),
  }))
}
