import type { Recipe } from '../../types/recipe'

/**
 * Check if adding subRecipeId to recipe would create circular dependency
 */
export function wouldCreateCircular(
  recipeId: string,
  subRecipeId: string,
  allRecipes: Recipe[]
): boolean {
  // Self-reference check
  if (recipeId === subRecipeId) {
    return true
  }

  // Check if adding subRecipeId would create a circular path
  return hasPath(subRecipeId, recipeId, allRecipes)
}

/**
 * Check if there's a path from sourceId to targetId through sub-recipes
 */
function hasPath(
  sourceId: string,
  targetId: string,
  allRecipes: Recipe[],
  visited: Set<string> = new Set()
): boolean {
  // Prevent infinite loops in visited set
  if (visited.has(sourceId)) {
    return false
  }
  visited.add(sourceId)

  const recipe = allRecipes.find(r => r.id === sourceId)
  if (!recipe) {
    return false
  }

  // Check all sub-recipes of this recipe
  const subRecipes = recipe.subRecipes ?? []
  for (const subRecipe of subRecipes) {
    if (subRecipe.recipeId === targetId) {
      return true
    }
    // Recursively check sub-recipes
    if (hasPath(subRecipe.recipeId, targetId, allRecipes, visited)) {
      return true
    }
  }

  return false
}

/**
 * Get all recipe IDs that should be excluded (to prevent circular deps)
 */
export function getExcludedRecipeIds(
  recipeId: string,
  allRecipes: Recipe[]
): string[] {
  const excluded = new Set<string>()
  excluded.add(recipeId) // Can't add itself

  // Add all recipes that would create circular deps
  for (const recipe of allRecipes) {
    if (
      recipe.id !== recipeId &&
      wouldCreateCircular(recipeId, recipe.id, allRecipes)
    ) {
      excluded.add(recipe.id)
    }
  }

  return Array.from(excluded)
}

/**
 * Get nesting depth for a recipe (max depth of sub-recipe chain)
 */
export function getRecipeDepth(
  recipeId: string,
  allRecipes: Recipe[],
  visited: Set<string> = new Set(),
  maxDepth: number = 2
): number {
  if (visited.has(recipeId) || visited.size >= maxDepth) {
    return visited.size
  }

  visited.add(recipeId)
  const recipe = allRecipes.find(r => r.id === recipeId)

  const subRecipes = recipe?.subRecipes ?? []
  if (!recipe || subRecipes.length === 0) {
    return visited.size
  }

  let maxChildDepth = visited.size
  for (const subRecipe of subRecipes) {
    const childDepth = getRecipeDepth(
      subRecipe.recipeId,
      allRecipes,
      new Set(visited),
      maxDepth
    )
    maxChildDepth = Math.max(maxChildDepth, childDepth)
  }

  return maxChildDepth
}
