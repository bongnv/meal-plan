import { describe, it, expect, beforeEach, vi } from 'vitest'

import { createRecipeService } from './recipeService'

import type { MealPlanDB } from '@/db/database'
import type { Recipe } from '@/types/recipe'

describe('recipeService', () => {
  let mockDb: MealPlanDB
  let service: ReturnType<typeof createRecipeService>

  beforeEach(() => {
    mockDb = {
      recipes: {
        toArray: vi.fn(),
        get: vi.fn(),
        add: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        filter: vi.fn(),
        where: vi.fn(),
      },
      updateLastModified: vi.fn(),
      getLastModified: vi.fn(),
      transaction: vi.fn(async (_mode, _tables, callback) => await callback()),
    } as any

    service = createRecipeService(mockDb)
  })

  const createMockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
    id: '1',
    name: 'Test Recipe',
    description: 'A test recipe',
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    sections: [
      {
        name: undefined,
        ingredients: [{ ingredientId: 'ing1', quantity: 2, unit: 'cup' }],
        instructions: ['Mix ingredients', 'Cook'],
      },
    ],
    tags: ['test'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  })

  describe('getAll', () => {
    it('should return all non-deleted recipes', async () => {
      const mockRecipes = [createMockRecipe(), createMockRecipe({ id: '2' })]
      mockDb.recipes.filter = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockRecipes),
      })

      const result = await service.getAll()

      expect(result).toEqual(mockRecipes)
      expect(mockDb.recipes.filter).toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return recipe by id', async () => {
      const mockRecipe = createMockRecipe()
      mockDb.recipes.get = vi.fn().mockResolvedValue(mockRecipe)

      const result = await service.getById('1')

      expect(result).toEqual(mockRecipe)
      expect(mockDb.recipes.get).toHaveBeenCalledWith('1')
    })

    it('should return undefined for non-existent id', async () => {
      mockDb.recipes.get = vi.fn().mockResolvedValue(undefined)

      const result = await service.getById('999')

      expect(result).toBeUndefined()
    })
  })

  describe('add', () => {
    it('should add a new recipe', async () => {
      const recipeData = {
        name: 'New Recipe',
        description: 'A new recipe',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        sections: [
          {
            name: undefined,
            ingredients: [],
            instructions: ['Cook'],
          },
        ],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      mockDb.recipes.add = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      const id = await service.add(recipeData)

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(mockDb.recipes.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...recipeData,
          id: expect.any(String),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('update', () => {
    it('should update a recipe', async () => {
      const recipe = createMockRecipe()
      mockDb.recipes.put = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.update(recipe)

      expect(mockDb.recipes.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...recipe,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('delete', () => {
    it('should soft delete a recipe', async () => {
      mockDb.recipes.update = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.delete('1')

      expect(mockDb.recipes.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(Number),
        })
      )
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('replaceAll', () => {
    it('should replace all recipes', async () => {
      const newRecipes = [createMockRecipe()]

      mockDb.transaction = vi.fn(async (_mode, _tables, callback) => {
        return await callback()
      }) as any
      mockDb.recipes.clear = vi.fn().mockResolvedValue(undefined)
      mockDb.recipes.bulkAdd = vi.fn().mockResolvedValue(undefined)
      mockDb.updateLastModified = vi.fn().mockResolvedValue(undefined)

      await service.replaceAll(newRecipes)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.recipes.clear).toHaveBeenCalledOnce()
      expect(mockDb.recipes.bulkAdd).toHaveBeenCalledWith(newRecipes)
      expect(mockDb.updateLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('searchByName', () => {
    it('should search recipes by name case-insensitively', async () => {
      const mockRecipes = [
        createMockRecipe({ id: '1', name: 'Chocolate Cake' }),
        createMockRecipe({ id: '2', name: 'Vanilla Cake' }),
      ]

      const mockFilter = {
        toArray: vi.fn().mockResolvedValue([mockRecipes[0]]),
      }

      mockDb.recipes.filter = vi.fn().mockReturnValue(mockFilter)

      const result = await service.searchByName('chocolate')

      expect(mockDb.recipes.filter).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chocolate Cake')
    })

    it('should return empty array when no matches', async () => {
      const mockFilter = {
        toArray: vi.fn().mockResolvedValue([]),
      }

      mockDb.recipes.filter = vi.fn().mockReturnValue(mockFilter)

      const result = await service.searchByName('nonexistent')

      expect(result).toEqual([])
    })
  })

  describe('filterByTag', () => {
    it('should filter recipes by tag', async () => {
      const mockRecipes = [createMockRecipe({ tags: ['dessert'] })]

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockRecipes),
        }),
      }

      mockDb.recipes.where = vi.fn().mockReturnValue(mockWhere)

      const result = await service.filterByTag('dessert')

      expect(mockDb.recipes.where).toHaveBeenCalledWith('tags')
      expect(mockWhere.equals).toHaveBeenCalledWith('dessert')
      expect(result).toEqual(mockRecipes)
    })
  })

  describe('getAllTags', () => {
    it('should return unique sorted tags', async () => {
      const mockRecipes = [
        createMockRecipe({ id: '1', tags: ['dessert', 'quick'] }),
        createMockRecipe({ id: '2', tags: ['dinner', 'quick'] }),
        createMockRecipe({ id: '3', tags: ['breakfast'] }),
      ]

      mockDb.recipes.filter = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockRecipes),
      })

      const result = await service.getAllTags()

      expect(result).toEqual(['breakfast', 'dessert', 'dinner', 'quick'])
    })

    it('should handle recipes with no tags', async () => {
      const mockRecipes = [
        createMockRecipe({ id: '1', tags: ['dessert'] }),
        createMockRecipe({ id: '2', tags: [] }),
        createMockRecipe({ id: '3', tags: undefined }),
      ]

      mockDb.recipes.filter = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockRecipes),
      })

      const result = await service.getAllTags()

      expect(result).toEqual(['dessert'])
    })

    it('should return empty array when no recipes', async () => {
      mockDb.recipes.filter = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      })

      const result = await service.getAllTags()

      expect(result).toEqual([])
    })
  })

  describe('getLastModified', () => {
    it('should return last modified timestamp', async () => {
      const timestamp = Date.now()
      mockDb.getLastModified = vi.fn().mockResolvedValue(timestamp)

      const result = await service.getLastModified()

      expect(result).toBe(timestamp)
      expect(mockDb.getLastModified).toHaveBeenCalledOnce()
    })
  })

  describe('extractUniqueTags', () => {
    it('should extract unique tags from recipes', () => {
      const recipes = [
        createMockRecipe({ id: '1', tags: ['dessert', 'quick'] }),
        createMockRecipe({ id: '2', tags: ['dinner', 'quick'] }),
        createMockRecipe({ id: '3', tags: ['breakfast'] }),
      ]

      const result = service.extractUniqueTags(recipes)

      expect(result).toEqual(['breakfast', 'dessert', 'dinner', 'quick'])
    })

    it('should handle recipes with no tags', () => {
      const recipes = [
        createMockRecipe({ id: '1', tags: ['dessert'] }),
        createMockRecipe({ id: '2', tags: [] }),
        createMockRecipe({ id: '3', tags: undefined }),
      ]

      const result = service.extractUniqueTags(recipes)

      expect(result).toEqual(['dessert'])
    })

    it('should return empty array for empty recipe list', () => {
      const result = service.extractUniqueTags([])

      expect(result).toEqual([])
    })
  })

  describe('filterRecipesAdvanced', () => {
    const recipes = [
      createMockRecipe({
        id: '1',
        name: 'Chocolate Cake',
        tags: ['dessert', 'sweet'],
        prepTime: 15,
        cookTime: 30,
        sections: [
          {
            name: undefined,
            ingredients: [{ ingredientId: 'flour', quantity: 2, unit: 'cup' }],
            instructions: ['Mix'],
          },
        ],
      }),
      createMockRecipe({
        id: '2',
        name: 'Quick Salad',
        tags: ['lunch', 'healthy'],
        prepTime: 10,
        cookTime: 0,
        sections: [
          {
            name: undefined,
            ingredients: [
              { ingredientId: 'lettuce', quantity: 1, unit: 'piece' },
            ],
            instructions: ['Toss'],
          },
        ],
      }),
      createMockRecipe({
        id: '3',
        name: 'Pasta Dinner',
        tags: ['dinner', 'italian'],
        prepTime: 20,
        cookTime: 45,
        sections: [
          {
            name: undefined,
            ingredients: [
              { ingredientId: 'pasta', quantity: 1, unit: 'kilogram' },
            ],
            instructions: ['Boil'],
          },
        ],
      }),
    ]

    it('should filter by search text', () => {
      const filters = { searchText: 'cake' }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chocolate Cake')
    })

    it('should filter by search text case-insensitively', () => {
      const filters = { searchText: 'SALAD' }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Quick Salad')
    })

    it('should filter by tags', () => {
      const filters = { selectedTags: ['dessert'] }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chocolate Cake')
    })

    it('should filter by multiple tags (OR logic)', () => {
      const filters = { selectedTags: ['dessert', 'lunch'] }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(2)
      expect(result.map(r => r.name)).toContain('Chocolate Cake')
      expect(result.map(r => r.name)).toContain('Quick Salad')
    })

    it('should filter by ingredients', () => {
      const filters = { selectedIngredients: ['pasta'] }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Pasta Dinner')
    })

    it('should filter by multiple ingredients (OR logic)', () => {
      const filters = { selectedIngredients: ['flour', 'lettuce'] }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(2)
    })

    it('should filter by time range under-30', () => {
      const filters = { timeRange: 'under-30' as const }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Quick Salad')
    })

    it('should filter by time range 30-60', () => {
      const filters = { timeRange: '30-60' as const }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chocolate Cake')
    })

    it('should filter by time range over-60', () => {
      const filters = { timeRange: 'over-60' as const }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Pasta Dinner')
    })

    it('should combine multiple filters', () => {
      const filters = {
        searchText: 'pasta',
        selectedTags: ['dinner'],
        timeRange: 'over-60' as const,
      }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Pasta Dinner')
    })

    it('should return empty array when no recipes match', () => {
      const filters = { searchText: 'nonexistent' }
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(0)
    })

    it('should return all recipes when no filters applied', () => {
      const filters = {}
      const result = service.filterRecipesAdvanced(recipes, filters)

      expect(result).toHaveLength(3)
    })
  })

  describe('findRecipeById', () => {
    it('should find recipe by id', () => {
      const recipes = [
        createMockRecipe({ id: '1', name: 'Recipe 1' }),
        createMockRecipe({ id: '2', name: 'Recipe 2' }),
      ]

      const result = service.findRecipeById(recipes, '2')

      expect(result).toBeDefined()
      expect(result?.name).toBe('Recipe 2')
    })

    it('should return undefined for non-existent id', () => {
      const recipes = [createMockRecipe({ id: '1', name: 'Recipe 1' })]

      const result = service.findRecipeById(recipes, '999')

      expect(result).toBeUndefined()
    })

    it('should return undefined for empty recipe list', () => {
      const result = service.findRecipeById([], '1')

      expect(result).toBeUndefined()
    })
  })
})
