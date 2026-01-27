import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

/**
 * Migrates recipes from old totalTime schema to new prepTime/cookTime schema.
 *
 * Migration strategy:
 * - If recipe already has prepTime and cookTime, preserve them
 * - If recipe only has totalTime, split it 50/50:
 *   - prepTime = Math.ceil(totalTime / 2) (gets extra minute for odd numbers)
 *   - cookTime = Math.floor(totalTime / 2)
 * - Does not mutate original recipes array
 *
 * @param recipes - Array of recipes to migrate
 * @returns New array of migrated recipes with prepTime and cookTime
 */
export function migrateRecipeTime(recipes: Recipe[]): Recipe[] {
  return recipes.map(recipe => {
    // If recipe already has prepTime and cookTime, no migration needed
    if (recipe.prepTime !== undefined && recipe.cookTime !== undefined) {
      return recipe
    }

    // If recipe has totalTime but not prepTime/cookTime, split it 50/50
    if (recipe.totalTime !== undefined) {
      return {
        ...recipe,
        prepTime: Math.ceil(recipe.totalTime / 2),
        cookTime: Math.floor(recipe.totalTime / 2),
      }
    }

    // If recipe has neither (shouldn't happen), default to 0
    return {
      ...recipe,
      prepTime: recipe.prepTime ?? 0,
      cookTime: recipe.cookTime ?? 0,
    }
  })
}

/**
 * Migrates recipes from old schema (ingredients without units) to new schema
 * (ingredients with units at recipe level).
 *
 * Migration strategy:
 * - If recipe ingredient already has a unit, preserve it
 * - If recipe ingredient is missing unit, try to copy from old ingredient library (pre-I9.7 data)
 * - If ingredient doesn't have a unit (post-I9.7), use 'piece' as fallback
 * - Does not mutate original recipes array
 *
 * @param recipes - Array of recipes to migrate
 * @param ingredients - Ingredient library (may have units for pre-I9.7 data)
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

      // Try to get unit from ingredient library (for old pre-I9.7 data)
      const ingredient = ingredientMap.get(recipeIngredient.ingredientId)
      const unit = (ingredient as any)?.unit || 'piece' // Fallback to 'piece'

      return {
        ...recipeIngredient,
        unit,
      }
    }),
  }))
}
