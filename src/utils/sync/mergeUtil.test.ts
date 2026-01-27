import { describe, it, expect } from 'vitest'

import { Ingredient } from '@/types/ingredient'

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
    subRecipes: [],
    servings: 4,
    prepTime: 15,
    cookTime: 15,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const recipe2: Recipe = {
    id: '2',
    name: 'Pizza',
    description: 'Italian pizza',
    ingredients: [],
    instructions: [],
    subRecipes: [],
    servings: 2,
    prepTime: 20,
    cookTime: 20,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const mealPlan1: MealPlan = {
    id: 'mp1',
    date: '2026-01-20',
    mealType: 'dinner',
    type: 'recipe',
    recipeId: '1',
    servings: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
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

    it('should handle conflicts for mealPlans', () => {
      const localMealPlan = { ...mealPlan1, servings: 6 }
      const remoteMealPlan = { ...mealPlan1, servings: 8 }

      const partialMerged: SyncData = {
        recipes: [],
        mealPlans: [mealPlan1],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'mealPlan-mp1',
        type: 'update-update',
        entity: 'mealPlan',
        entityId: 'mp1',
        localVersion: localMealPlan as any,
        remoteVersion: remoteMealPlan as any,
        baseVersion: mealPlan1 as any,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['mealPlan-mp1', 'local'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      if (result.merged?.mealPlans[0].type === 'recipe') {
        expect(result.merged.mealPlans[0].servings).toBe(6)
      }
    })

    it('should handle conflicts for ingredients', () => {
      const ingredient1: Ingredient = {
        id: 'ing1',
        name: 'Flour',
        category: 'Baking',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const localIngredient = { ...ingredient1, category: 'Grains' }
      const remoteIngredient = { ...ingredient1, category: 'Pantry' }

      const partialMerged: SyncData = {
        recipes: [],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [ingredient1],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'ingredient-ing1',
        type: 'update-update',
        entity: 'ingredient',
        entityId: 'ing1',
        localVersion: localIngredient as any,
        remoteVersion: remoteIngredient as any,
        baseVersion: ingredient1 as any,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['ingredient-ing1', 'remote'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.ingredients[0].category).toBe('Pantry')
    })

    it('should handle conflicts for groceryLists', () => {
      const groceryList1 = {
        id: 'gl1',
        name: 'Week 1',
        dateRange: { start: '2026-01-20', end: '2026-01-27' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const localList = { ...groceryList1, name: 'Week 1 - Local' }
      const remoteList = { ...groceryList1, name: 'Week 1 - Remote' }

      const partialMerged: SyncData = {
        recipes: [],
        mealPlans: [],
        groceryLists: [groceryList1],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'groceryList-gl1',
        type: 'update-update',
        entity: 'groceryList',
        entityId: 'gl1',
        localVersion: localList as any,
        remoteVersion: remoteList as any,
        baseVersion: groceryList1 as any,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['groceryList-gl1', 'local'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.groceryLists[0].name).toBe('Week 1 - Local')
    })

    it('should handle conflicts for groceryItems', () => {
      const groceryItem1 = {
        id: 'gi1',
        listId: 'gl1',
        name: 'Test Item',
        ingredientId: 'ing1',
        quantity: 2,
        unit: 'cup' as const,
        category: 'Vegetables' as const,
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const localItem = { ...groceryItem1, checked: true }
      const remoteItem = { ...groceryItem1, quantity: 3 }

      const partialMerged: SyncData = {
        recipes: [],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [groceryItem1],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'groceryItem-gi1',
        type: 'update-update',
        entity: 'groceryItem',
        entityId: 'gi1',
        localVersion: localItem as any,
        remoteVersion: remoteItem as any,
        baseVersion: groceryItem1 as any,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['groceryItem-gi1', 'remote'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.groceryItems[0].quantity).toBe(3)
    })

    it('should add new entity when resolving conflict for non-existent entity', () => {
      const newRecipe = { ...recipe1, id: '999' }

      const partialMerged: SyncData = {
        recipes: [],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const conflict: ConflictInfo = {
        id: 'recipe-999',
        type: 'delete-update',
        entity: 'recipe',
        entityId: '999',
        localVersion: null,
        remoteVersion: newRecipe,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['recipe-999', 'remote'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(1)
      expect(result.merged?.recipes[0].id).toBe('999')
    })

    it('should handle update-delete conflict choosing local (keep)', () => {
      const partialMerged: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 2000,
        version: 1,
      }

      const localRecipe = { ...recipe1, name: 'Updated Locally' }

      const conflict: ConflictInfo = {
        id: 'recipe-1',
        type: 'update-delete',
        entity: 'recipe',
        entityId: '1',
        localVersion: localRecipe,
        remoteVersion: null,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>([
        ['recipe-1', 'local'],
      ])

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(true)
      expect(result.merged?.recipes).toHaveLength(1)
      expect(result.merged?.recipes[0].name).toBe('Updated Locally')
    })

    it('should handle error during conflict resolution', () => {
      const partialMerged: SyncData = {
        recipes: [],
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
        localVersion: recipe1,
        remoteVersion: recipe2,
        baseVersion: recipe1,
      }

      const resolutions = new Map<string, ConflictResolution>()

      const result = resolveConflicts(partialMerged, [conflict], resolutions)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('merge error handling', () => {
    it('should handle errors during merge operation', () => {
      const baseData: SyncData = {
        recipes: [recipe1],
        mealPlans: [],
        groceryLists: [],
        groceryItems: [],
        ingredients: [],
        lastModified: 1000,
        version: 1,
      }

      // Create invalid data that will cause JSON.stringify comparison to fail
      const localData = {
        ...baseData,
        lastModified: 2000,
      } as any

      const remoteData = {
        ...baseData,
        lastModified: 2000,
      } as any

      // Add circular reference to cause error
      localData.recipes = [{ ...recipe1, circular: localData }]
      remoteData.recipes = [recipe1]

      const result = merge(baseData, localData, remoteData)

      // Should catch error and return failed result
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
