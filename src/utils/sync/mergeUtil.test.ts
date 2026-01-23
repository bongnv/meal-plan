import { describe, it, expect } from 'vitest'

import { merge, resolveConflicts } from './mergeUtil'

import type { SyncData, ConflictInfo, ConflictResolution } from './types'
import type { MealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

describe('mergeUtil', () => {
  // Sample data
  const recipe1: Recipe = {
    id: '1',
    name: 'Pasta',
    description: 'Italian pasta',
    ingredients: [],
    instructions: [],
    servings: 4,
    totalTime: 30,
    tags: [],
  }

  const recipe2: Recipe = {
    id: '2',
    name: 'Pizza',
    description: 'Italian pizza',
    ingredients: [],
    instructions: [],
    servings: 2,
    totalTime: 40,
    tags: [],
  }

  const mealPlan1: MealPlan = {
    id: 'mp1',
    date: '2026-01-20',
    mealType: 'dinner',
    type: 'recipe',
    recipeId: '1',
    servings: 4,
  }

  // ingredient1 defined for potential future tests

  describe('merge', () => {
    it('should return local when no changes', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const localData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const remoteData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const result = merge(baseData, localData, remoteData)

      expect(result.success).toBe(true)
      expect(result.merged).toEqual(localData)
    })

    it('should return remote when only remote changed', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const localData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const remoteData: SyncData = {
        recipes: [recipe1, recipe2],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const result = merge(baseData, localData, remoteData)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(2)
    })

    it('should return local when only local changed', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const localData: SyncData = {
        recipes: [recipe1, recipe2],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const remoteData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const result = merge(baseData, localData, remoteData)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(2)
    })

    it('should merge non-conflicting changes from both sides', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const localData: SyncData = {
        recipes: [recipe1, recipe2],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const remoteData: SyncData = {
        recipes: [recipe1],
        mealPlans: [mealPlan1],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const result = merge(baseData, localData, remoteData)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(2)
      expect(result.merged?.mealPlans).toHaveLength(1)
    })

    it('should detect update-update conflicts', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      const updatedRecipe1Local = { ...recipe1, name: 'Pasta Carbonara' }
      const updatedRecipe1Remote = { ...recipe1, name: 'Pasta Bolognese' }

      const localData: SyncData = {
        recipes: [updatedRecipe1Local],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const remoteData: SyncData = {
        recipes: [updatedRecipe1Remote],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const result = merge(baseData, localData, remoteData)

      expect(result.success).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts![0].type).toBe('update-update')
      // Should still return partial merged data for non-conflicting records
      expect(result.merged).toBeDefined()
    })
  })

  describe('resolveConflicts', () => {
    it('should apply local resolution', () => {
      const localRecipe = { ...recipe1, name: 'Local Version' }
      const remoteRecipe = { ...recipe1, name: 'Remote Version' }

      // Partial merged data (from merge() call with conflicts)
      const partialMerged: SyncData = {
        recipes: [recipe1], // Base version still there
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'recipe-1',
        type: 'update-update',
        entity: 'recipe',
        entityId: '1',
        localVersion: localRecipe,
        remoteVersion: remoteRecipe,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['recipe-1', 'local'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes[0].name).toBe('Local Version')
    })

    it('should apply remote resolution', () => {
      const localRecipe = { ...recipe1, name: 'Local Version' }
      const remoteRecipe = { ...recipe1, name: 'Remote Version' }

      const partialMerged: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'recipe-1',
        type: 'update-update',
        entity: 'recipe',
        entityId: '1',
        localVersion: localRecipe,
        remoteVersion: remoteRecipe,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['recipe-1', 'remote'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes[0].name).toBe('Remote Version')
    })

    it('should handle delete resolution', () => {
      const partialMerged: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'recipe-1',
        type: 'update-delete',
        entity: 'recipe',
        entityId: '1',
        localVersion: recipe1,
        remoteVersion: null,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['recipe-1', 'remote'], // Choose remote (deletion)
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(0)
    })

    it('should error when resolution is missing', () => {
      const conflict: ConflictInfo = {
        id: 'recipe-1',
        type: 'update-update',
        entity: 'recipe',
        entityId: '1',
        localVersion: recipe1,
        remoteVersion: recipe2,
        baseVersion: recipe1,
      }

      const partialMerged: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const resolutions = new Map<string, ConflictResolution>()

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing resolution')
    })
  })
})
