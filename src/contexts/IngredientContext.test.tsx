import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IngredientProvider, useIngredients } from './IngredientContext'
import {
  IngredientCategory,
  StandardUnit,
  type IngredientItem,
} from '../types/recipe'
import { IngredientStorageService } from '../utils/storage/IngredientStorage'

// Mock the storage service
vi.mock('../utils/storage/IngredientStorage')

describe('IngredientContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  describe('IngredientProvider', () => {
    it('should load ingredients from storage on mount', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      expect(IngredientStorageService.loadIngredients).toHaveBeenCalledOnce()
    })

    it('should handle empty ingredients list on mount', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue([])

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual([])
      })
    })
  })

  describe('getIngredientById', () => {
    it('should return ingredient by id', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      const ingredient = contextValue!.getIngredientById('1')
      expect(ingredient).toEqual(mockIngredients[0])
    })

    it('should return undefined for non-existent id', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      const ingredient = contextValue!.getIngredientById('non-existent')
      expect(ingredient).toBeUndefined()
    })
  })

  describe('addIngredient', () => {
    it('should add new ingredient and persist to storage', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue([])
      vi.mocked(IngredientStorageService.generateId).mockReturnValue('new-id')

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual([])
      })

      const newIngredient = {
        name: 'Onion',
        category: IngredientCategory.Produce,
        standardUnit: StandardUnit.Gram,
      }

      contextValue!.addIngredient(newIngredient)

      await waitFor(() => {
        expect(contextValue?.ingredients).toHaveLength(1)
        expect(contextValue?.ingredients[0]).toEqual({
          id: 'new-id',
          ...newIngredient,
        })
      })

      expect(IngredientStorageService.saveIngredients).toHaveBeenCalledWith([
        { id: 'new-id', ...newIngredient },
      ])
    })
  })

  describe('updateIngredient', () => {
    it('should update existing ingredient and persist to storage', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      const updatedIngredient: IngredientItem = {
        id: '1',
        name: 'Updated Carrot',
        category: IngredientCategory.Produce,
        standardUnit: StandardUnit.Kilogram,
      }

      contextValue!.updateIngredient(updatedIngredient)

      await waitFor(() => {
        const ingredient = contextValue!.getIngredientById('1')
        expect(ingredient).toEqual(updatedIngredient)
      })

      expect(IngredientStorageService.saveIngredients).toHaveBeenCalledWith([
        updatedIngredient,
        mockIngredients[1],
      ])
    })

    it('should not modify state if ingredient does not exist', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      const nonExistentIngredient: IngredientItem = {
        id: 'non-existent',
        name: 'Ghost Ingredient',
        category: IngredientCategory.Other,
        standardUnit: StandardUnit.Gram,
      }

      contextValue!.updateIngredient(nonExistentIngredient)

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      // Should not have called saveIngredients since update failed
      expect(IngredientStorageService.saveIngredients).not.toHaveBeenCalled()
    })
  })

  describe('deleteIngredient', () => {
    it('should delete ingredient and persist to storage', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      contextValue!.deleteIngredient('1')

      await waitFor(() => {
        expect(contextValue?.ingredients).toHaveLength(1)
        expect(contextValue!.getIngredientById('1')).toBeUndefined()
      })

      expect(IngredientStorageService.saveIngredients).toHaveBeenCalledWith([
        mockIngredients[1],
      ])
    })

    it('should not modify state if ingredient does not exist', async () => {
      vi.mocked(IngredientStorageService.loadIngredients).mockReturnValue(
        mockIngredients
      )

      let contextValue: ReturnType<typeof useIngredients> | null = null
      const TestComponent = () => {
        contextValue = useIngredients()
        return null
      }

      render(
        <IngredientProvider>
          <TestComponent />
        </IngredientProvider>
      )

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      contextValue!.deleteIngredient('non-existent')

      await waitFor(() => {
        expect(contextValue?.ingredients).toEqual(mockIngredients)
      })

      // Should not have called saveIngredients since delete failed
      expect(IngredientStorageService.saveIngredients).not.toHaveBeenCalled()
    })
  })

  describe('useIngredients hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useIngredients()
        return null
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useIngredients must be used within an IngredientProvider'
      )
    })
  })
})
