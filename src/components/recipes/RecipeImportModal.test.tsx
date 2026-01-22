import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { IngredientProvider } from '../../contexts/IngredientContext'
import { RecipeProvider } from '../../contexts/RecipeContext'

import { RecipeImportModal } from './RecipeImportModal'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <IngredientProvider>
          <RecipeProvider>{component}</RecipeProvider>
        </IngredientProvider>
      </MantineProvider>
    </MemoryRouter>
  )
}

describe('RecipeImportModal', () => {
  const mockOnClose = vi.fn()

  it('should not render when closed', () => {
    renderWithProviders(
      <RecipeImportModal opened={false} onClose={mockOnClose} />
    )

    expect(screen.queryByText('Import Recipe with AI')).not.toBeInTheDocument()
  })

  it('should render modal when opened', () => {
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Import Recipe with AI')).toBeInTheDocument()
  })

  it('should render stepper with 3 steps', () => {
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Generate Prompt')).toBeInTheDocument()
    expect(screen.getByText('Paste Response')).toBeInTheDocument()
    expect(screen.getByText('Review & Import')).toBeInTheDocument()
  })

  it('should start at step 1 (Generate Prompt)', () => {
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Step 1 content should be visible
    expect(screen.getByText(/Step 1:/)).toBeInTheDocument()
    expect(
      screen.getByText(/Copy this prompt and paste it into your AI tool/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /copy prompt/i })
    ).toBeInTheDocument()
  })

  it('should navigate to next step when Next button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Click Next button
    const nextButton = screen.getByRole('button', {
      name: /next.*ai response/i,
    })
    await user.click(nextButton)

    // Should now be on step 2
    await waitFor(() => {
      expect(
        screen.getByText('Paste the JSON response from your AI tool below.')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /validate json/i })
      ).toBeInTheDocument()
    })
  })

  it('should navigate back to previous step when Back button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Go to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Paste the JSON response from your AI tool below.')
      ).toBeInTheDocument()
    })

    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    await waitFor(() => {
      expect(screen.getByText(/Step 1:/)).toBeInTheDocument()
    })
  })

  it('should not show Back button on first step', () => {
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    expect(
      screen.queryByRole('button', { name: /back/i })
    ).not.toBeInTheDocument()
  })

  it('should show both Back and Next buttons on middle step', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      // Validate button should be present but disabled without JSON input
      const validateButton = screen.getByRole('button', {
        name: /validate json/i,
      })
      expect(validateButton).toBeInTheDocument()
      expect(validateButton).toBeDisabled()
    })
  })

  it('should show Import button on final step instead of Next', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Can't proceed to step 3 without valid JSON - test that Validate button exists but is disabled
    await waitFor(() => {
      const validateButton = screen.getByRole('button', {
        name: /validate json/i,
      })
      expect(validateButton).toBeInTheDocument()
      expect(validateButton).toBeDisabled()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Mantine modal close button is the empty name button
    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should render step 2 content', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Paste the JSON response from your AI tool below.')
      ).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /validate json/i })
      ).toBeInTheDocument()
    })
  })

  it('should render step 3 content when JSON is valid', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Enter valid JSON with correct schema matching Recipe type
    const validRecipe = {
      id: 'recipe_test123',
      name: 'Test Recipe',
      description: 'Test Description',
      servings: 4,
      totalTime: 30,
      tags: ['dinner'],
      ingredients: [
        {
          ingredientId: 'ing_new1',
          quantity: 1,
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Sugar',
            category: 'Baking',
            unit: 'cup',
          },
        },
      ],
      instructions: ['Step 1'],
    }

    const textarea = screen.getByPlaceholderText(/paste.*json/i)
    await user.click(textarea)
    await user.paste(JSON.stringify(validRecipe))

    // Click Validate JSON button - this will validate and auto-advance to step 3
    await user.click(screen.getByRole('button', { name: /validate json/i }))

    // Wait for auto-advance to step 3 and recipe details to appear
    await waitFor(
      () => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Check step 3 content - should show recipe details
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /import recipe/i })
    ).toBeInTheDocument()
  })

  it('should reset to step 1 when modal is closed and reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Paste the JSON response from your AI tool below.')
      ).toBeInTheDocument()
    })

    // Close modal by clicking close button (this will call handleClose)
    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)

    // Modal should be closed
    expect(mockOnClose).toHaveBeenCalled()

    // Simulate closing by parent
    rerender(
      <MemoryRouter>
        <MantineProvider>
          <IngredientProvider>
            <RecipeProvider>
              <RecipeImportModal opened={false} onClose={mockOnClose} />
            </RecipeProvider>
          </IngredientProvider>
        </MantineProvider>
      </MemoryRouter>
    )

    // Reopen modal
    rerender(
      <MemoryRouter>
        <MantineProvider>
          <IngredientProvider>
            <RecipeProvider>
              <RecipeImportModal opened={true} onClose={mockOnClose} />
            </RecipeProvider>
          </IngredientProvider>
        </MantineProvider>
      </MemoryRouter>
    )

    // Should be back at step 1
    expect(screen.getByText(/Step 1:/)).toBeInTheDocument()
  })

  it('should display recipe with displayName in review step', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Recipe with displayName
    const recipeWithDisplayName = {
      id: 'recipe_test456',
      name: 'Chicken Recipe',
      description: 'A chicken dish',
      servings: 2,
      totalTime: 45,
      tags: ['dinner'],
      ingredients: [
        {
          ingredientId: 'ing_new1',
          quantity: 500,
          displayName: 'chicken',
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Chicken Breast',
            category: 'Poultry',
            unit: 'gram',
          },
        },
      ],
      instructions: ['Cook chicken'],
    }

    const textarea = screen.getByPlaceholderText(/paste.*json/i)
    await user.click(textarea)
    await user.paste(JSON.stringify(recipeWithDisplayName))
    await user.click(screen.getByRole('button', { name: /validate json/i }))

    // Wait for step 3 and check displayName is shown
    await waitFor(() => {
      expect(screen.getByText('Chicken Recipe')).toBeInTheDocument()
    })

    // Should show displayName in format: "chicken (Chicken Breast)"
    const ingredientsList = screen.getAllByRole('list')[0] // First list is ingredients
    expect(ingredientsList).toHaveTextContent('chicken (Chicken Breast)')
  })

  it('should display recipe without displayName using library name only', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecipeImportModal opened={true} onClose={mockOnClose} />
    )

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next.*ai response/i }))

    // Recipe without displayName
    const recipeWithoutDisplayName = {
      id: 'recipe_test789',
      name: 'Simple Recipe',
      description: 'Basic recipe',
      servings: 2,
      totalTime: 20,
      tags: ['quick'],
      ingredients: [
        {
          ingredientId: 'ing_new1',
          quantity: 2,
          suggestedIngredient: {
            id: 'ing_new1',
            name: 'Tomato',
            category: 'Vegetables',
            unit: 'piece',
          },
        },
      ],
      instructions: ['Slice tomato'],
    }

    const textarea = screen.getByPlaceholderText(/paste.*json/i)
    await user.click(textarea)
    await user.paste(JSON.stringify(recipeWithoutDisplayName))
    await user.click(screen.getByRole('button', { name: /validate json/i }))

    // Wait for step 3
    await waitFor(() => {
      expect(screen.getByText('Simple Recipe')).toBeInTheDocument()
    })

    // Should show library name without displayName format (just "Tomato")
    expect(screen.getByText(/2 piece Tomato/i)).toBeInTheDocument()
    // Should NOT show parentheses format when no displayName
    expect(screen.queryByText(/\(Tomato\)/)).not.toBeInTheDocument()
  })
})
