import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLiveQuery } from 'dexie-react-hooks'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RecipeForm } from './RecipeForm'

import type { Recipe } from '../../types/recipe'

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks')

// Wrapper with MantineProvider
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <MantineProvider>{children}</MantineProvider>
}

describe('RecipeForm - Sections Structure', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock useLiveQuery to return empty arrays
    vi.mocked(useLiveQuery).mockReturnValue([])
  })

  describe('Initial state', () => {
    it('should initialize with one unnamed section by default (new recipe)', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Should have "Add Section" button
      expect(screen.getByText('Add Section')).toBeInTheDocument()

      // Should NOT show section name input when only 1 section
      expect(
        screen.queryByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).not.toBeInTheDocument()

      // Should have ingredient controls
      expect(screen.getByText('Add Ingredient')).toBeInTheDocument()

      // Should have instruction controls
      expect(screen.getByText('Add Instruction')).toBeInTheDocument()
    })

    it('should load existing recipe with sections correctly', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test description',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Dough',
            ingredients: [
              {
                ingredientId: 'ing1',
                quantity: 2,
                unit: 'cup',
                displayName: 'flour',
              },
            ],
            instructions: ['Mix flour'],
          },
          {
            name: 'Sauce',
            ingredients: [
              {
                ingredientId: 'ing2',
                quantity: 1,
                unit: 'can',
                displayName: 'tomatoes',
              },
            ],
            instructions: ['Heat tomatoes'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(
        <RecipeForm
          recipe={recipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { wrapper }
      )

      // Should show section name inputs (2+ sections)
      const sectionNameInputs = screen.getAllByPlaceholderText(
        /e.g., BROTH, ASSEMBLY/
      )
      expect(sectionNameInputs).toHaveLength(2)

      // Should show section names
      expect(screen.getByDisplayValue('Dough')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Sauce')).toBeInTheDocument()
    })

    it('should load existing simple recipe (1 unnamed section) correctly', () => {
      const recipe: Recipe = {
        id: '1',
        name: 'Simple Recipe',
        description: 'Simple description',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: undefined,
            ingredients: [
              {
                ingredientId: 'ing1',
                quantity: 2,
                unit: 'cup',
                displayName: 'flour',
              },
            ],
            instructions: ['Mix and bake'],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(
        <RecipeForm
          recipe={recipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { wrapper }
      )

      // Should NOT show section name input (only 1 section)
      expect(
        screen.queryByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).not.toBeInTheDocument()

      // Should show Add Section button
      expect(screen.getByText('Add Section')).toBeInTheDocument()
    })
  })

  describe('Section management', () => {
    it('should add a new section when "Add Section" is clicked', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Initially 1 section (no section name input visible)
      expect(
        screen.queryByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).not.toBeInTheDocument()

      // Click "Add Section"
      const addSectionButton = screen.getByText('Add Section')
      await user.click(addSectionButton)

      // Now should have 2 sections, so section name inputs should appear
      await waitFor(() => {
        const sectionNameInputs = screen.getAllByPlaceholderText(
          /e.g., BROTH, ASSEMBLY/
        )
        expect(sectionNameInputs).toHaveLength(2)
      })
    })

    it('should remove a section when "Remove Section" is clicked', async () => {
      const user = userEvent.setup()
      const recipe: Recipe = {
        id: '1',
        name: 'Test Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          {
            name: 'Section 1',
            ingredients: [],
            instructions: [],
          },
          {
            name: 'Section 2',
            ingredients: [],
            instructions: [],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(
        <RecipeForm
          recipe={recipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { wrapper }
      )

      // Should have 2 section name inputs initially
      expect(
        screen.getAllByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).toHaveLength(2)

      // Should have "Remove Section" buttons
      const removeButtons = screen.getAllByText('Remove Section')
      expect(removeButtons.length).toBeGreaterThan(0)

      // Remove one section
      await user.click(removeButtons[0])

      // Should now have only 1 section name input visible (or none if only 1 section remains)
      await waitFor(() => {
        const inputs = screen.queryAllByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
        // After removing, if we have only 1 section, the name input should be hidden
        expect(inputs.length).toBeLessThanOrEqual(1)
      })
    })

    it('should not allow removing the last section', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Should NOT have "Remove Section" button when only 1 section
      expect(screen.queryByText('Remove Section')).not.toBeInTheDocument()

      // Add a section
      await user.click(screen.getByText('Add Section'))

      // Now should have Remove Section buttons
      await waitFor(() => {
        expect(screen.getAllByText('Remove Section').length).toBeGreaterThan(0)
      })
    })

    it('should update section name when typing', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Add a section to make section names visible
      await user.click(screen.getByText('Add Section'))

      // Wait for section name inputs to appear
      await waitFor(() => {
        expect(
          screen.getAllByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
        ).toHaveLength(2)
      })

      // Type in the first section name
      const sectionNameInputs = screen.getAllByPlaceholderText(
        /e.g., BROTH, ASSEMBLY/
      )
      await user.type(sectionNameInputs[0], 'DOUGH')

      // Should display the typed value
      expect(sectionNameInputs[0]).toHaveValue('DOUGH')
    })
  })

  describe('Section visibility rules', () => {
    it('should hide section name input when only 1 section exists', () => {
      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Should NOT show section name input
      expect(
        screen.queryByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).not.toBeInTheDocument()
    })

    it('should show section name inputs when 2+ sections exist', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Add a section
      await user.click(screen.getByText('Add Section'))

      // Should now show section name inputs
      await waitFor(() => {
        expect(
          screen.getAllByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
        ).toHaveLength(2)
      })
    })

    it('should hide section name inputs again when reduced to 1 section', async () => {
      const user = userEvent.setup()
      const recipe: Recipe = {
        id: '1',
        name: 'Test',
        description: 'Test',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        tags: [],
        sections: [
          { name: 'Section 1', ingredients: [], instructions: [] },
          { name: 'Section 2', ingredients: [], instructions: [] },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(
        <RecipeForm
          recipe={recipe}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { wrapper }
      )

      // Should have section name inputs (2 sections)
      expect(
        screen.getAllByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
      ).toHaveLength(2)

      // Remove one section
      const removeButtons = screen.getAllByText('Remove Section')
      await user.click(removeButtons[0])

      // Should hide section name inputs (now only 1 section)
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/e.g., BROTH, ASSEMBLY/)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Ingredients and instructions within sections', () => {
    it('should allow adding ingredients to a section', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Click "Add Ingredient"
      const addIngredientButton = screen.getByText('Add Ingredient')
      await user.click(addIngredientButton)

      // Should show ingredient fields
      await waitFor(() => {
        expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
        expect(screen.getAllByLabelText('Unit').length).toBeGreaterThan(0)
      })
    })

    it('should allow adding instructions to a section', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Click "Add Instruction"
      const addInstructionButton = screen.getByText('Add Instruction')
      await user.click(addInstructionButton)

      // Should show instruction field
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Step 1')).toBeInTheDocument()
      })
    })
  })

  describe('Form submission with sections', () => {
    it('should submit simple recipe (1 unnamed section)', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Fill in basic fields
      await user.type(
        screen.getByPlaceholderText('Enter recipe name'),
        'Chocolate Chip Cookies'
      )
      await user.type(
        screen.getByPlaceholderText('Describe your recipe'),
        'Classic cookies'
      )
      await user.clear(screen.getByPlaceholderText('Number of servings'))
      await user.type(screen.getByPlaceholderText('Number of servings'), '24')
      await user.clear(screen.getByPlaceholderText('Preparation time'))
      await user.type(screen.getByPlaceholderText('Preparation time'), '15')
      await user.clear(screen.getByPlaceholderText('Cooking time'))
      await user.type(screen.getByPlaceholderText('Cooking time'), '12')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should submit with sections array (1 unnamed section)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Chocolate Chip Cookies',
            description: 'Classic cookies',
            servings: 24,
            prepTime: 15,
            cookTime: 12,
            sections: [
              {
                name: undefined,
                ingredients: [],
                instructions: [],
              },
            ],
          })
        )
      })
    })

    it('should submit complex recipe (multiple named sections)', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Fill in basic fields
      await user.type(
        screen.getByPlaceholderText('Enter recipe name'),
        'Chicken Pho'
      )
      await user.type(
        screen.getByPlaceholderText('Describe your recipe'),
        'Vietnamese soup'
      )
      await user.clear(screen.getByPlaceholderText('Number of servings'))
      await user.type(screen.getByPlaceholderText('Number of servings'), '4')
      await user.clear(screen.getByPlaceholderText('Preparation time'))
      await user.type(screen.getByPlaceholderText('Preparation time'), '30')
      await user.clear(screen.getByPlaceholderText('Cooking time'))
      await user.type(screen.getByPlaceholderText('Cooking time'), '120')

      // Add a second section
      const addSectionButton = screen.getByText('Add Section')
      await user.click(addSectionButton)

      // Name the sections
      const sectionNameInputs = screen.getAllByLabelText(
        'Section Name (optional)'
      )
      await user.type(sectionNameInputs[0], 'BROTH')
      await user.type(sectionNameInputs[1], 'ASSEMBLY')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should submit with multiple named sections
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Chicken Pho',
            sections: expect.arrayContaining([
              expect.objectContaining({ name: 'BROTH' }),
              expect.objectContaining({ name: 'ASSEMBLY' }),
            ]),
          })
        )
      })
    })

    it('should trim section names and convert empty to undefined', async () => {
      const user = userEvent.setup()

      render(<RecipeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />, {
        wrapper,
      })

      // Fill in basic fields
      await user.type(
        screen.getByPlaceholderText('Enter recipe name'),
        'Test Recipe'
      )
      await user.type(
        screen.getByPlaceholderText('Describe your recipe'),
        'Test'
      )
      await user.clear(screen.getByPlaceholderText('Number of servings'))
      await user.type(screen.getByPlaceholderText('Number of servings'), '2')
      await user.clear(screen.getByPlaceholderText('Preparation time'))
      await user.type(screen.getByPlaceholderText('Preparation time'), '10')
      await user.clear(screen.getByPlaceholderText('Cooking time'))
      await user.type(screen.getByPlaceholderText('Cooking time'), '20')

      // Add a second section
      const addSectionButton = screen.getByText('Add Section')
      await user.click(addSectionButton)

      // Name first section with whitespace, leave second empty
      const sectionNameInputs = screen.getAllByLabelText(
        'Section Name (optional)'
      )
      await user.type(sectionNameInputs[0], '  SAUCE  ')
      // Leave sectionNameInputs[1] empty

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should trim first section name and convert empty to undefined
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: [
              expect.objectContaining({ name: 'SAUCE' }), // Trimmed
              expect.objectContaining({ name: undefined }), // Empty -> undefined
            ],
          })
        )
      })
    })
  })
})
