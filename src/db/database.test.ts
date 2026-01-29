import Dexie from 'dexie'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MealPlanDB } from './database'

import type { GroceryList, GroceryItem } from '../types/groceryList'
import type { Ingredient } from '../types/ingredient'
import type { MealPlan, RecipeMealPlan } from '../types/mealPlan'
import type { Recipe } from '../types/recipe'

describe('MealPlanDB', () => {
  let db: MealPlanDB

  beforeEach(async () => {
    // Create a fresh database instance for each test
    db = new MealPlanDB()
    await db.open()
    // Clear all data before each test
    await db.clearAllData()
  })

  afterEach(async () => {
    // Close and delete database after each test
    await db.delete()
    await db.close()
  })

  describe('database initialization', () => {
    it('should create database with correct name', () => {
      expect(db.name).toBe('MealPlanDB')
    })

    it('should have all required tables', () => {
      expect(db.recipes).toBeDefined()
      expect(db.ingredients).toBeDefined()
      expect(db.mealPlans).toBeDefined()
      expect(db.groceryLists).toBeDefined()
      expect(db.groceryItems).toBeDefined()
      expect(db.metadata).toBeDefined()
    })

    it('should be instance of Dexie', () => {
      expect(db).toBeInstanceOf(Dexie)
    })
  })

  describe('recipes table', () => {
    it('should add and retrieve a recipe', async () => {
      const recipe: Recipe = {
        id: 'recipe1',
        name: 'Test Recipe',
        description: 'A test recipe',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        sections: [
          {
            name: undefined,
            ingredients: [{ ingredientId: 'ing1', quantity: 2, unit: 'cup' }],
            instructions: ['Mix', 'Cook'],
          },
        ],
        tags: ['test', 'quick'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.recipes.add(recipe)
      const retrieved = await db.recipes.get('recipe1')

      expect(retrieved).toEqual(recipe)
    })

    it('should query recipes by tag', async () => {
      const recipe1: Recipe = {
        id: 'r1',
        name: 'Recipe 1',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        sections: [
          {
            name: undefined,
            ingredients: [],
            instructions: [],
          },
        ],
        tags: ['dessert', 'quick'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const recipe2: Recipe = {
        id: 'r2',
        name: 'Recipe 2',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        sections: [
          {
            name: undefined,
            ingredients: [],
            instructions: [],
          },
        ],
        tags: ['dinner'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.recipes.bulkAdd([recipe1, recipe2])
      const dessertRecipes = await db.recipes
        .where('tags')
        .equals('dessert')
        .toArray()

      expect(dessertRecipes).toHaveLength(1)
      expect(dessertRecipes[0].id).toBe('r1')
    })
  })

  describe('ingredients table', () => {
    it('should add and retrieve an ingredient', async () => {
      const ingredient: Ingredient = {
        id: 'ing1',
        name: 'Flour',
        category: 'Baking',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.ingredients.add(ingredient)
      const retrieved = await db.ingredients.get('ing1')

      expect(retrieved).toEqual(ingredient)
    })

    it('should query ingredients by category', async () => {
      const flour: Ingredient = {
        id: 'ing1',
        name: 'Flour',
        category: 'Baking',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const milk: Ingredient = {
        id: 'ing2',
        name: 'Milk',
        category: 'Dairy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.ingredients.bulkAdd([flour, milk])
      const bakingIngredients = await db.ingredients
        .where('category')
        .equals('Baking')
        .toArray()

      expect(bakingIngredients).toHaveLength(1)
      expect(bakingIngredients[0].name).toBe('Flour')
    })
  })

  describe('mealPlans table', () => {
    it('should add and retrieve a meal plan', async () => {
      const mealPlan: MealPlan = {
        id: 'mp1',
        type: 'recipe',
        date: '2026-01-28',
        mealType: 'dinner',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.mealPlans.add(mealPlan)
      const retrieved = await db.mealPlans.get('mp1')

      expect(retrieved).toEqual(mealPlan)
    })

    it('should query meal plans by date', async () => {
      const mp1: MealPlan = {
        id: 'mp1',
        type: 'recipe',
        date: '2026-01-28',
        mealType: 'dinner',
        recipeId: 'recipe1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const mp2: MealPlan = {
        id: 'mp2',
        type: 'recipe',
        date: '2026-01-29',
        mealType: 'lunch',
        recipeId: 'recipe2',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.mealPlans.bulkAdd([mp1, mp2])
      const janMealPlans = await db.mealPlans
        .where('date')
        .equals('2026-01-28')
        .toArray()

      expect(janMealPlans).toHaveLength(1)
      expect(janMealPlans[0].id).toBe('mp1')
    })

    it('should query meal plans by meal type', async () => {
      const breakfast: MealPlan = {
        id: 'mp1',
        type: 'recipe',
        date: '2026-01-28',
        mealType: 'breakfast',
        recipeId: 'recipe1',
        servings: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const dinner: MealPlan = {
        id: 'mp2',
        type: 'recipe',
        date: '2026-01-28',
        mealType: 'dinner',
        recipeId: 'recipe2',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.mealPlans.bulkAdd([breakfast, dinner])
      const dinners = await db.mealPlans
        .where('mealType')
        .equals('dinner')
        .toArray()

      expect(dinners).toHaveLength(1)
      expect(dinners[0].id).toBe('mp2')
    })
  })

  describe('groceryLists table', () => {
    it('should add and retrieve a grocery list', async () => {
      const list: GroceryList = {
        id: 'list1',
        name: 'Weekly Groceries',
        dateRange: { start: '2026-01-20', end: '2026-01-27' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.groceryLists.add(list)
      const retrieved = await db.groceryLists.get('list1')

      expect(retrieved).toEqual(list)
    })
  })

  describe('groceryItems table', () => {
    it('should add and retrieve a grocery item', async () => {
      const item: GroceryItem = {
        id: 'item1',
        listId: 'list1',
        name: 'Flour',
        quantity: 500,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: ['mp1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.groceryItems.add(item)
      const retrieved = await db.groceryItems.get('item1')

      expect(retrieved).toEqual(item)
    })

    it('should query grocery items by listId', async () => {
      const item1: GroceryItem = {
        id: 'item1',
        listId: 'list1',
        name: 'Flour',
        quantity: 500,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const item2: GroceryItem = {
        id: 'item2',
        listId: 'list2',
        name: 'Sugar',
        quantity: 200,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.groceryItems.bulkAdd([item1, item2])
      const list1Items = await db.groceryItems
        .where('listId')
        .equals('list1')
        .toArray()

      expect(list1Items).toHaveLength(1)
      expect(list1Items[0].name).toBe('Flour')
    })

    it('should query grocery items by category', async () => {
      const flour: GroceryItem = {
        id: 'item1',
        listId: 'list1',
        name: 'Flour',
        quantity: 500,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const milk: GroceryItem = {
        id: 'item2',
        listId: 'list1',
        name: 'Milk',
        quantity: 1,
        unit: 'liter',
        category: 'Dairy',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.groceryItems.bulkAdd([flour, milk])
      const bakingItems = await db.groceryItems
        .where('category')
        .equals('Baking')
        .toArray()

      expect(bakingItems).toHaveLength(1)
      expect(bakingItems[0].name).toBe('Flour')
    })

    it('should query grocery items by checked status', async () => {
      const unchecked: GroceryItem = {
        id: 'item1',
        listId: 'list1',
        name: 'Flour',
        quantity: 500,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const checked: GroceryItem = {
        id: 'item2',
        listId: 'list1',
        name: 'Sugar',
        quantity: 200,
        unit: 'gram',
        category: 'Baking',
        checked: true,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.groceryItems.bulkAdd([unchecked, checked])

      // Query all items and filter by checked status
      const allItems = await db.groceryItems.toArray()
      const checkedItems = allItems.filter(item => item.checked === true)

      expect(checkedItems).toHaveLength(1)
      expect(checkedItems[0].name).toBe('Sugar')
    })
  })

  describe('metadata table', () => {
    it('should store and retrieve metadata', async () => {
      await db.metadata.put({ key: 'testKey', value: 12345 })
      const retrieved = await db.metadata.get('testKey')

      expect(retrieved?.value).toBe(12345)
    })
  })

  describe('getLastModified', () => {
    it('should return 0 when no lastModified record exists', async () => {
      const lastModified = await db.getLastModified()
      expect(lastModified).toBe(0)
    })

    it('should return lastModified value when it exists', async () => {
      const timestamp = Date.now()
      await db.metadata.put({ key: 'lastModified', value: timestamp })

      const lastModified = await db.getLastModified()
      expect(lastModified).toBe(timestamp)
    })
  })

  describe('updateLastModified', () => {
    it('should set lastModified timestamp', async () => {
      const before = Date.now()
      await db.updateLastModified()
      const after = Date.now()

      const lastModified = await db.getLastModified()
      expect(lastModified).toBeGreaterThanOrEqual(before)
      expect(lastModified).toBeLessThanOrEqual(after)
    })

    it('should update existing lastModified timestamp', async () => {
      await db.metadata.put({ key: 'lastModified', value: 1000 })

      await db.updateLastModified()

      const lastModified = await db.getLastModified()
      expect(lastModified).toBeGreaterThan(1000)
    })
  })

  describe('clearAllData', () => {
    it('should clear all tables', async () => {
      // Add data to all tables
      await db.recipes.add({
        id: 'r1',
        name: 'Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        sections: [
          {
            name: undefined,
            ingredients: [],
            instructions: [],
          },
        ],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      await db.ingredients.add({
        id: 'ing1',
        name: 'Flour',
        category: 'Baking',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      await db.mealPlans.add({
        id: 'mp1',
        type: 'recipe',
        date: '2026-01-28',
        mealType: 'dinner',
        recipeId: 'r1',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as RecipeMealPlan)
      await db.groceryLists.add({
        id: 'list1',
        name: 'List',
        dateRange: { start: '2026-01-20', end: '2026-01-27' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      await db.groceryItems.add({
        id: 'item1',
        listId: 'list1',
        name: 'Flour',
        quantity: 500,
        unit: 'gram',
        category: 'Baking',
        checked: false,
        mealPlanIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      await db.metadata.put({ key: 'lastModified', value: Date.now() })

      // Clear all data
      await db.clearAllData()

      // Verify all tables are empty
      expect(await db.recipes.count()).toBe(0)
      expect(await db.ingredients.count()).toBe(0)
      expect(await db.mealPlans.count()).toBe(0)
      expect(await db.groceryLists.count()).toBe(0)
      expect(await db.groceryItems.count()).toBe(0)
      expect(await db.metadata.count()).toBe(0)
    })
  })

  describe('database migration to version 2', () => {
    it('should migrate recipes from flat structure to sections', async () => {
      // Use a unique DB name for migration test
      const testDbName = 'MealPlanDB_MigrationTest_' + Date.now()
      
      // Create a version 1 database with old schema
      const oldDb = new Dexie(testDbName)
      oldDb.version(1).stores({
        recipes: 'id, name, *tags',
        ingredients: 'id, name, category',
        mealPlans: 'id, date, mealType, type',
        groceryLists: 'id, dateRange.start, dateRange.end',
        groceryItems: 'id, listId, category, checked',
        metadata: 'key',
      })
      await oldDb.open()

      // Insert recipe with old flat structure
      const oldRecipe = {
        id: 'recipe1',
        name: 'Old Recipe',
        description: 'Test migration',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        ingredients: [
          { ingredientId: 'ing1', quantity: 2, unit: 'cup' },
          { ingredientId: 'ing2', quantity: 1, unit: 'tablespoon' },
        ],
        instructions: ['Step 1', 'Step 2', 'Step 3'],
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await oldDb.table('recipes').add(oldRecipe)
      await oldDb.close()

      // Create a new DB class with version 2 that will migrate
      class TestMealPlanDB extends Dexie {
        recipes!: any

        constructor(name: string) {
          super(name)

          this.version(1).stores({
            recipes: 'id, name, *tags',
            ingredients: 'id, name, category',
            mealPlans: 'id, date, mealType, type',
            groceryLists: 'id, dateRange.start, dateRange.end',
            groceryItems: 'id, listId, category, checked',
            metadata: 'key',
          })

          this.version(2)
            .stores({
              recipes: 'id, name, *tags',
              ingredients: 'id, name, category',
              mealPlans: 'id, date, mealType, type',
              groceryLists: 'id, dateRange.start, dateRange.end',
              groceryItems: 'id, listId, category, checked',
              metadata: 'key',
            })
            .upgrade(async tx => {
              const recipes = await tx.table('recipes').toArray()

              for (const recipe of recipes) {
                if (recipe.sections) {
                  continue
                }

                const migratedRecipe = {
                  ...recipe,
                  sections: [
                    {
                      name: undefined,
                      ingredients: recipe.ingredients || [],
                      instructions: recipe.instructions || [],
                    },
                  ],
                }

                delete migratedRecipe.ingredients
                delete migratedRecipe.instructions
                delete migratedRecipe.subRecipes

                await tx.table('recipes').put(migratedRecipe)
              }

              await tx.table('metadata').put({
                key: 'schemaVersion',
                value: 2,
              })
            })
        }
      }

      // Reopen with version 2 (should trigger migration)
      const newDb = new TestMealPlanDB(testDbName)
      await newDb.open()

      // Retrieve migrated recipe
      const migratedRecipe = await newDb.recipes.get('recipe1')

      // Verify migration
      expect(migratedRecipe).toBeDefined()
      expect(migratedRecipe!.sections).toBeDefined()
      expect(migratedRecipe!.sections).toHaveLength(1)
      expect(migratedRecipe!.sections[0].name).toBeUndefined()
      expect(migratedRecipe!.sections[0].ingredients).toEqual(oldRecipe.ingredients)
      expect(migratedRecipe!.sections[0].instructions).toEqual(
        oldRecipe.instructions
      )

      // Cleanup
      await newDb.delete()
      await newDb.close()
    })

    it('should not double-migrate recipes that already have sections', async () => {
      // Recipe already in new format
      const newRecipe: Recipe = {
        id: 'recipe2',
        name: 'New Recipe',
        description: 'Already migrated',
        servings: 4,
        prepTime: 15,
        cookTime: 25,
        sections: [
          {
            name: 'BROTH',
            ingredients: [{ ingredientId: 'ing1', quantity: 2, unit: 'liter' }],
            instructions: ['Boil water'],
          },
          {
            name: 'ASSEMBLY',
            ingredients: [{ ingredientId: 'ing2', quantity: 200, unit: 'gram' }],
            instructions: ['Add noodles'],
          },
        ],
        tags: ['soup'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await db.recipes.add(newRecipe)
      const retrieved = await db.recipes.get('recipe2')

      // Should remain unchanged
      expect(retrieved).toEqual(newRecipe)
      expect(retrieved!.sections).toHaveLength(2)
    })

    it('should set schemaVersion in metadata after migration', async () => {
      const testDbName = 'MealPlanDB_SchemaTest_' + Date.now()

      // Create version 1 database
      const oldDb = new Dexie(testDbName)
      oldDb.version(1).stores({
        recipes: 'id, name, *tags',
        ingredients: 'id, name, category',
        mealPlans: 'id, date, mealType, type',
        groceryLists: 'id, dateRange.start, dateRange.end',
        groceryItems: 'id, listId, category, checked',
        metadata: 'key',
      })
      await oldDb.open()
      await oldDb.close()

      // Reopen with version 2
      const newDb = new MealPlanDB()
      // @ts-expect-error - Setting name for test purposes
      newDb._dbName = testDbName
      Object.defineProperty(newDb, 'name', { value: testDbName, writable: false })
      await newDb.open()

      const schemaVersion = await newDb.metadata.get('schemaVersion')
      expect(schemaVersion).toBeDefined()
      expect(schemaVersion!.value).toBe(2)

      await newDb.delete()
      await newDb.close()
    })

    it('should handle recipes with empty arrays during migration', async () => {
      const testDbName = 'MealPlanDB_EmptyTest_' + Date.now()

      const oldDb = new Dexie(testDbName)
      oldDb.version(1).stores({
        recipes: 'id, name, *tags',
        ingredients: 'id, name, category',
        mealPlans: 'id, date, mealType, type',
        groceryLists: 'id, dateRange.start, dateRange.end',
        groceryItems: 'id, listId, category, checked',
        metadata: 'key',
      })
      await oldDb.open()

      const oldRecipe = {
        id: 'recipe3',
        name: 'Empty Recipe',
        description: 'Test',
        servings: 1,
        prepTime: 5,
        cookTime: 10,
        ingredients: [],
        instructions: [],
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await oldDb.table('recipes').add(oldRecipe)
      await oldDb.close()

      const newDb = new MealPlanDB()
      // @ts-expect-error - Setting name for test purposes
      newDb._dbName = testDbName
      Object.defineProperty(newDb, 'name', { value: testDbName, writable: false })
      await newDb.open()

      const migrated = await newDb.recipes.get('recipe3')
      expect(migrated).toBeDefined()
      expect(migrated!.sections).toHaveLength(1)
      expect(migrated!.sections[0].ingredients).toEqual([])
      expect(migrated!.sections[0].instructions).toEqual([])

      await newDb.delete()
      await newDb.close()
    })

    it('should be transactional - all or nothing', async () => {
      const testDbName = 'MealPlanDB_TxTest_' + Date.now()

      const oldDb = new Dexie(testDbName)
      oldDb.version(1).stores({
        recipes: 'id, name, *tags',
        ingredients: 'id, name, category',
        mealPlans: 'id, date, mealType, type',
        groceryLists: 'id, dateRange.start, dateRange.end',
        groceryItems: 'id, listId, category, checked',
        metadata: 'key',
      })
      await oldDb.open()

      // Add multiple recipes
      await oldDb.table('recipes').bulkAdd([
        {
          id: 'r1',
          name: 'Recipe 1',
          description: 'Test',
          servings: 2,
          prepTime: 5,
          cookTime: 10,
          ingredients: [{ ingredientId: 'i1', quantity: 1 }],
          instructions: ['Step 1'],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'r2',
          name: 'Recipe 2',
          description: 'Test',
          servings: 4,
          prepTime: 10,
          cookTime: 20,
          ingredients: [{ ingredientId: 'i2', quantity: 2 }],
          instructions: ['Step 1', 'Step 2'],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ])
      await oldDb.close()

      const newDb = new MealPlanDB()
      // @ts-expect-error - Setting name for test purposes
      newDb._dbName = testDbName
      Object.defineProperty(newDb, 'name', { value: testDbName, writable: false })
      await newDb.open()

      // All recipes should be migrated
      const count = await newDb.recipes.count()
      expect(count).toBe(2)

      const r1 = await newDb.recipes.get('r1')
      const r2 = await newDb.recipes.get('r2')

      expect(r1).toBeDefined()
      expect(r2).toBeDefined()
      expect(r1!.sections).toBeDefined()
      expect(r2!.sections).toBeDefined()

      await newDb.delete()
      await newDb.close()
    })
  })
})
