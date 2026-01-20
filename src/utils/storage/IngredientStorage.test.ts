import { beforeEach, describe, expect, it } from 'vitest'

import { IngredientStorageService } from './IngredientStorage'
import {
  IngredientCategory,
  StandardUnit,
  type IngredientItem,
} from '../../types/recipe'

describe('IngredientStorageService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadIngredients', () => {
    it('should return empty array when no ingredients in storage', () => {
      const ingredients = IngredientStorageService.loadIngredients()
      expect(ingredients).toEqual([])
    })

    it('should load ingredients from localStorage', () => {
      const mockIngredients: IngredientItem[] = [
        {
          id: '1',
          name: 'Carrot',
          category: IngredientCategory.Produce,
          standardUnit: StandardUnit.Gram,
        },
        {
          id: '2',
          name: 'Milk',
          category: IngredientCategory.Dairy,
          standardUnit: StandardUnit.Milliliter,
        },
      ]
      localStorage.setItem('ingredients', JSON.stringify(mockIngredients))

      const ingredients = IngredientStorageService.loadIngredients()
      expect(ingredients).toEqual(mockIngredients)
    })

    it('should return empty array when localStorage data is invalid', () => {
      localStorage.setItem('ingredients', 'invalid json')
      const ingredients = IngredientStorageService.loadIngredients()
      expect(ingredients).toEqual([])
    })

    it('should return empty array when localStorage data fails validation', () => {
      const invalidData = [{ id: '1', name: '' }] // missing required fields
      localStorage.setItem('ingredients', JSON.stringify(invalidData))
      const ingredients = IngredientStorageService.loadIngredients()
      expect(ingredients).toEqual([])
    })
  })

  describe('saveIngredients', () => {
    it('should save ingredients to localStorage', () => {
      const ingredients: IngredientItem[] = [
        {
          id: '1',
          name: 'Onion',
          category: IngredientCategory.Produce,
          standardUnit: StandardUnit.Gram,
        },
      ]

      IngredientStorageService.saveIngredients(ingredients)

      const stored = localStorage.getItem('ingredients')
      expect(stored).toBe(JSON.stringify(ingredients))
    })

    it('should overwrite existing ingredients in localStorage', () => {
      const oldIngredients: IngredientItem[] = [
        {
          id: '1',
          name: 'Old Ingredient',
          category: IngredientCategory.Other,
          standardUnit: StandardUnit.Gram,
        },
      ]
      localStorage.setItem('ingredients', JSON.stringify(oldIngredients))

      const newIngredients: IngredientItem[] = [
        {
          id: '2',
          name: 'New Ingredient',
          category: IngredientCategory.Pantry,
          standardUnit: StandardUnit.Gram,
        },
      ]
      IngredientStorageService.saveIngredients(newIngredients)

      const stored = localStorage.getItem('ingredients')
      expect(stored).toBe(JSON.stringify(newIngredients))
    })
  })

  describe('generateId', () => {
    it('should generate a unique id', () => {
      const id1 = IngredientStorageService.generateId()
      const id2 = IngredientStorageService.generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate a valid UUID format', () => {
      const id = IngredientStorageService.generateId()
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })
  })
})
