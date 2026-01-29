import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RecipeDetail } from './RecipeDetail'

import type { Recipe } from '../../types/recipe'

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks')

// Wrapper with MantineProvider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <MantineProvider>{children}</MantineProvider>
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    // Mock useLiveQuery to return empty arrays (no database data needed for basic render)
    vi.mocked(useLiveQuery).mockReturnValue([])
  })

  describe('Simple recipe (single unnamed section)', () => {
    it('should display ingredients without section header', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Simple Recipe',
        description: 'A simple recipe',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: undefined,
            ingredients: [
              { ingredientId: 'ing1', quantity: 2, unit: 'cups', displayName: 'flour' },
              { ingredientId: 'ing2', quantity: 7, unit: 'whole', displayName: 'eggs' },
            ],
            instructions: ['Mix well', 'Add liquid', 'Bake'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should display ingredients section header (main header, not section name)
      expect(screen.getByText('Ingredients')).toBeInTheDocument()

      // Should NOT have a section name header (since name is undefined)
      expect(screen.queryByRole('heading', { name: /section/i })).not.toBeInTheDocument()

      // Should display ingredients with quantities
      expect(screen.getByText(/2 cups/i)).toBeInTheDocument()
      expect(screen.getByText(/7/i)).toBeInTheDocument() // unique number
      // Just verify labels are there
      const labels = screen.getAllByRole('checkbox')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should display instructions without section header', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Simple Recipe',
        description: 'A simple recipe',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: undefined,
            ingredients: [],
            instructions: ['Mix flour', 'Add eggs', 'Bake'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should display instructions section header (main header)
      expect(screen.getByText('Instructions')).toBeInTheDocument()

      // Should display instructions
      expect(screen.getByText('Mix flour')).toBeInTheDocument()
      expect(screen.getByText('Add eggs')).toBeInTheDocument()
      expect(screen.getByText('Bake')).toBeInTheDocument()
    })
  })

  describe('Complex recipe (multiple named sections)', () => {
    it('should display section headers for named sections', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Complex Recipe',
        description: 'A complex recipe with sections',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Dough',
            ingredients: [
              { ingredientId: 'ing1', quantity: 2, unit: 'cups', displayName: 'all-purpose-flour' },
            ],
            instructions: ['Mix well with water'],
          },
          {
            name: 'Sauce',
            ingredients: [
              { ingredientId: 'ing2', quantity: 1, unit: 'can', displayName: 'tomatoes' },
            ],
            instructions: ['Heat sauce'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should display section headers (appears twice - once in ingredients, once in instructions)
      const doughHeaders = screen.getAllByText('Dough')
      const sauceHeaders = screen.getAllByText('Sauce')
      expect(doughHeaders).toHaveLength(2) // One for ingredients section, one for instructions
      expect(sauceHeaders).toHaveLength(2)

      // Should display ingredients
      expect(screen.getByText(/all-purpose-flour/i)).toBeInTheDocument()
      expect(screen.getByText(/tomatoes/i)).toBeInTheDocument()

      // Should display instructions
      expect(screen.getByText('Mix well with water')).toBeInTheDocument()
      expect(screen.getByText('Heat sauce')).toBeInTheDocument()
    })

    it('should display ingredients grouped by sections', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Complex Recipe',
        description: '',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Part 1',
            ingredients: [
              { ingredientId: 'ing1', quantity: 2, unit: 'cups', displayName: 'sugar' },
            ],
            instructions: [],
          },
          {
            name: 'Part 2',
            ingredients: [
              { ingredientId: 'ing2', quantity: 3, unit: 'cups', displayName: 'flour' },
            ],
            instructions: [],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Main ingredients header should still exist
      expect(screen.getByText('Ingredients')).toBeInTheDocument()

      // Section headers should be visible
      const part1Headers = screen.getAllByText('Part 1')
      const part2Headers = screen.getAllByText('Part 2')
      expect(part1Headers.length).toBeGreaterThan(0)
      expect(part2Headers.length).toBeGreaterThan(0)
    })

    it('should display instructions grouped by sections', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Complex Recipe',
        description: '',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Part 1',
            ingredients: [],
            instructions: ['Step for part 1'],
          },
          {
            name: 'Part 2',
            ingredients: [],
            instructions: ['Step for part 2'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Main instructions header should still exist
      expect(screen.getByText('Instructions')).toBeInTheDocument()

      // Instructions should be visible with section context
      expect(screen.getByText('Step for part 1')).toBeInTheDocument()
      expect(screen.getByText('Step for part 2')).toBeInTheDocument()
    })
  })

  describe('Mixed sections (named and unnamed)', () => {
    it('should handle mix of named and unnamed sections', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Mixed Recipe',
        description: '',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: undefined,
            ingredients: [
              { ingredientId: 'ing1', quantity: 1, unit: 'cup', displayName: 'filtered-water' },
            ],
            instructions: ['Boil it'],
          },
          {
            name: 'Special Sauce',
            ingredients: [
              { ingredientId: 'ing2', quantity: 2, unit: 'tbsp', displayName: 'hot-sauce' },
            ],
            instructions: ['Mix thoroughly'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should show section header only for named section (appears twice)
      const sauceHeaders = screen.getAllByText('Special Sauce')
      expect(sauceHeaders).toHaveLength(2)

      // Should display all ingredients
      expect(screen.getByText(/filtered-water/i)).toBeInTheDocument()
      expect(screen.getByText(/hot-sauce/i)).toBeInTheDocument()

      // Should display all instructions
      expect(screen.getByText('Boil it')).toBeInTheDocument()
      expect(screen.getByText('Mix thoroughly')).toBeInTheDocument()
    })
  })

  describe('Empty sections', () => {
    it('should handle section with no ingredients', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Recipe',
        description: '',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Empty Section',
            ingredients: [],
            instructions: ['Just do this'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should display section even if no ingredients (appears twice)
      const headers = screen.getAllByText('Empty Section')
      expect(headers).toHaveLength(2)
      expect(screen.getByText('Just do this')).toBeInTheDocument()
    })

    it('should handle section with no instructions', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Recipe',
        description: '',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Ingredients Only',
            ingredients: [
              { ingredientId: 'ing1', quantity: 1, unit: 'cup', displayName: 'flour' },
            ],
            instructions: [],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(<RecipeDetail recipe={recipe} />, { wrapper })

      // Should display section even if no instructions (appears twice)
      const headers = screen.getAllByText('Ingredients Only')
      expect(headers).toHaveLength(2)
      expect(screen.getByText(/flour/i)).toBeInTheDocument()
    })
  })
})
