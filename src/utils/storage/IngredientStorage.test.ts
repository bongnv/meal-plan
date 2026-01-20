import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IngredientStorageService } from './IngredientStorage'
import { generateId } from '../idGenerator'

import type { Ingredient } from '../../types/ingredient'

describe('IngredientStorageService', () => {
  let service: IngredientStorageService

  beforeEach(() => {
    localStorage.clear()
    service = new IngredientStorageService()
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('loadIngredients', () => {
    it('should return empty array if no ingredients in localStorage', () => {
      const ingredients = service.loadIngredients()

      expect(ingredients).toEqual([])
    })

    it('should return ingredients from localStorage', () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
        { id: '2', name: 'Onion', category: 'Vegetables', unit: 'piece' },
      ]

      localStorage.setItem('ingredients', JSON.stringify(mockIngredients))

      const ingredients = service.loadIngredients()

      expect(ingredients).toEqual(mockIngredients)
    })

    it('should return empty array if localStorage data is corrupted', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorage.setItem('ingredients', 'invalid json')

      const ingredients = service.loadIngredients()

      expect(ingredients).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading ingredients from localStorage:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('localStorage error')
        })

      const ingredients = service.loadIngredients()

      expect(ingredients).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
      getItemSpy.mockRestore()
    })

    it('should validate ingredients with Zod schema', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const invalidIngredients = [
        { id: '1', name: '', category: 'Vegetables', unit: 'piece' }, // Invalid: empty name
      ]

      localStorage.setItem('ingredients', JSON.stringify(invalidIngredients))

      const ingredients = service.loadIngredients()

      expect(ingredients).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('saveIngredients', () => {
    it('should save valid ingredients to localStorage', () => {
      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]

      service.saveIngredients(mockIngredients)

      const saved = localStorage.getItem('ingredients')
      expect(saved).toBe(JSON.stringify(mockIngredients))
    })

    it('should overwrite existing ingredients', () => {
      const initial: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]
      const updated: Ingredient[] = [
        { id: '2', name: 'Onion', category: 'Vegetables', unit: 'piece' },
      ]

      service.saveIngredients(initial)
      service.saveIngredients(updated)

      const saved = localStorage.getItem('ingredients')
      expect(saved).toBe(JSON.stringify(updated))
    })

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage error')
        })

      const mockIngredients: Ingredient[] = [
        { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
      ]

      expect(() => service.saveIngredients(mockIngredients)).toThrow(
        'localStorage error'
      )

      setItemSpy.mockRestore()
    })

    it('should save empty array', () => {
      service.saveIngredients([])

      const saved = localStorage.getItem('ingredients')
      expect(saved).toBe('[]')
    })

    it('should validate ingredients before saving', () => {
      const invalidIngredients = [
        { id: '1', name: '', category: 'Vegetables', unit: 'piece' }, // Invalid: empty name
      ] as Ingredient[]

      expect(() => service.saveIngredients(invalidIngredients)).toThrow()
    })
  })
})
