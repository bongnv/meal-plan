import { describe, expect, it } from 'vitest'

import {
  wouldCreateCircular,
  getExcludedRecipeIds,
  getRecipeDepth,
} from './circularDependency'

import type { Recipe } from '../../types/recipe'

const createMockRecipe = (id: string, subRecipeIds: string[] = []): Recipe => ({
  id,
  name: `Recipe ${id}`,
  description: 'Test recipe',
  ingredients: [],
  subRecipes: subRecipeIds.map(subId => ({
    recipeId: subId,
    quantity: 1,
  })),
  instructions: ['Step 1'],
  servings: 4,
  prepTime: 10,
  cookTime: 20,
  tags: [],
})

describe('circularDependency', () => {
  describe('wouldCreateCircular', () => {
    it('should detect direct circular dependency (A → B → A)', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', [])
      const recipes = [recipeA, recipeB]

      // Adding A to B would create: B → A → B (circular)
      expect(wouldCreateCircular('B', 'A', recipes)).toBe(true)
    })

    it('should detect indirect circular dependency (A → B → C → A)', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', [])
      const recipes = [recipeA, recipeB, recipeC]

      // Adding A to C would create: C → A → B → C (circular)
      expect(wouldCreateCircular('C', 'A', recipes)).toBe(true)
    })

    it('should allow valid non-circular dependencies (A → B → C)', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', [])
      const recipes = [recipeA, recipeB, recipeC]

      // Adding D to A is fine (no circular)
      const recipeD = createMockRecipe('D', [])
      expect(wouldCreateCircular('A', 'D', [...recipes, recipeD])).toBe(false)
    })

    it('should detect self-reference (A → A)', () => {
      const recipeA = createMockRecipe('A', [])
      const recipes = [recipeA]

      // Adding A to itself
      expect(wouldCreateCircular('A', 'A', recipes)).toBe(true)
    })

    it('should allow adding recipe with no existing references', () => {
      const recipeA = createMockRecipe('A', [])
      const recipeB = createMockRecipe('B', [])
      const recipes = [recipeA, recipeB]

      // A and B have no relationship, so adding B to A is fine
      expect(wouldCreateCircular('A', 'B', recipes)).toBe(false)
    })

    it('should handle deep nesting without circular deps', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', ['D'])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      // Adding E to D is fine (extends chain without circular)
      const recipeE = createMockRecipe('E', [])
      expect(wouldCreateCircular('D', 'E', [...recipes, recipeE])).toBe(false)

      // But adding A to D would create circular: A → B → C → D → A
      expect(wouldCreateCircular('D', 'A', recipes)).toBe(true)
    })

    it('should handle recipe with multiple sub-recipes', () => {
      const recipeA = createMockRecipe('A', ['B', 'C'])
      const recipeB = createMockRecipe('B', ['D'])
      const recipeC = createMockRecipe('C', [])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      // Adding A to D would create circular: A → B → D → A
      expect(wouldCreateCircular('D', 'A', recipes)).toBe(true)

      // But adding E to A is fine
      const recipeE = createMockRecipe('E', [])
      expect(wouldCreateCircular('A', 'E', [...recipes, recipeE])).toBe(false)
    })

    it('should handle missing recipes gracefully', () => {
      const recipeA = createMockRecipe('A', ['MISSING'])
      const recipes = [recipeA]

      // Adding B to A should be fine (missing recipe doesn't create circular)
      const recipeB = createMockRecipe('B', [])
      expect(wouldCreateCircular('A', 'B', [...recipes, recipeB])).toBe(false)
    })
  })

  describe('getExcludedRecipeIds', () => {
    it('should exclude self and recipes that would create circular deps', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', [])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      const excluded = getExcludedRecipeIds('C', recipes)

      // Should exclude: C (self), A (A → B → C, adding C would create circular),
      // and B (B → C, adding C would create circular)
      expect(excluded).toContain('C')
      expect(excluded).toContain('A')
      expect(excluded).toContain('B')
      expect(excluded).not.toContain('D')
    })

    it('should only exclude self when no circular deps exist', () => {
      const recipeA = createMockRecipe('A', [])
      const recipeB = createMockRecipe('B', [])
      const recipeC = createMockRecipe('C', [])
      const recipes = [recipeA, recipeB, recipeC]

      const excluded = getExcludedRecipeIds('A', recipes)

      // Should only exclude A itself
      expect(excluded).toEqual(['A'])
    })

    it('should exclude multiple recipes in circular chain', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', ['D'])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      const excluded = getExcludedRecipeIds('D', recipes)

      // Should exclude: D (self), A, B, C (all would create circular)
      expect(excluded).toContain('D')
      expect(excluded).toContain('A')
      expect(excluded).toContain('B')
      expect(excluded).toContain('C')
      expect(excluded.length).toBe(4)
    })
  })

  describe('getRecipeDepth', () => {
    it('should return 1 for recipe with no sub-recipes', () => {
      const recipeA = createMockRecipe('A', [])
      const recipes = [recipeA]

      expect(getRecipeDepth('A', recipes)).toBe(1)
    })

    it('should return 2 for recipe with one level of sub-recipes', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', [])
      const recipes = [recipeA, recipeB]

      expect(getRecipeDepth('A', recipes)).toBe(2)
    })

    it('should return max depth for recipe with multiple sub-recipes', () => {
      const recipeA = createMockRecipe('A', ['B', 'C'])
      const recipeB = createMockRecipe('B', ['D'])
      const recipeC = createMockRecipe('C', [])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      // A → B → D (depth 3) is deeper than A → C (depth 2)
      expect(getRecipeDepth('A', recipes)).toBe(2) // Limited to maxDepth of 2
    })

    it('should stop at max depth limit', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['C'])
      const recipeC = createMockRecipe('C', ['D'])
      const recipeD = createMockRecipe('D', [])
      const recipes = [recipeA, recipeB, recipeC, recipeD]

      // Should stop at depth 2 (default maxDepth)
      expect(getRecipeDepth('A', recipes)).toBe(2)
    })

    it('should handle circular references without infinite loop', () => {
      const recipeA = createMockRecipe('A', ['B'])
      const recipeB = createMockRecipe('B', ['A']) // Circular!
      const recipes = [recipeA, recipeB]

      // Should not hang, should return visited count
      expect(getRecipeDepth('A', recipes)).toBe(2)
    })
  })
})
