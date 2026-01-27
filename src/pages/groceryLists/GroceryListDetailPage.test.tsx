import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GroceryListProvider } from '../../contexts/GroceryListContext'
import { IngredientProvider } from '../../contexts/IngredientContext'
import { MealPlanProvider } from '../../contexts/MealPlanContext'
import { RecipeProvider } from '../../contexts/RecipeContext'
import { Ingredient } from '../../types/ingredient'

import { GroceryListDetailPage } from './GroceryListDetailPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockIngredients: Ingredient[] = [
  {
    id: 'banana-id',
    name: 'Banana',
    category: 'Fruits',
  },
  {
    id: 'chicken-id',
    name: 'Chicken Breast',
    category: 'Meat',
  },
  {
    id: 'milk-id',
    name: 'Milk',
    category: 'Dairy',
  },
]

// Mock grocery list data
const mockGroceryList = {
  id: '1',
  name: 'Week of Jan 23',
  dateRange: {
    start: '2026-01-23',
    end: '2026-01-30',
  },
  createdAt: Date.now(),
}

const mockGroceryItems = [
  {
    id: 'item-1',
    listId: '1',
    name: 'Banana',
    quantity: 2,
    checked: false,
    category: 'Fruits',
    mealPlanIds: ['meal-1'],
  },
]

// Mock the storage services
vi.mock('../../utils/storage/IngredientStorage', () => ({
  IngredientStorageService: class {
    loadIngredients() {
      return mockIngredients
    }
    saveIngredients() {
      // mock save
    }
  },
}))

vi.mock('../../utils/storage/groceryListStorage', () => ({
  GroceryListStorageService: class {
    loadGroceryLists() {
      return [mockGroceryList]
    }
    saveGroceryLists() {
      // mock save
    }
    loadGroceryItems() {
      return mockGroceryItems
    }
    saveGroceryItems() {
      // mock save
    }
  },
}))

vi.mock('../../utils/storage/recipeStorage', () => ({
  RecipeStorageService: class {
    loadRecipes() {
      return []
    }
    saveRecipes() {
      // mock save
    }
  },
}))

vi.mock('../../utils/storage/mealPlanStorage', () => ({
  MealPlanStorageService: class {
    loadMealPlans() {
      return []
    }
    saveMealPlans() {
      // mock save
    }
  },
}))

const renderWithProviders = (
  component: React.ReactElement,
  route = '/grocery-lists/1'
) => {
  const user = userEvent.setup()
  return {
    user,
    ...render(
      <MantineProvider>
        <IngredientProvider>
          <RecipeProvider>
            <MealPlanProvider>
              <GroceryListProvider>
                <MemoryRouter initialEntries={[route]}>
                  <Routes>
                    <Route path="/grocery-lists/:id" element={component} />
                  </Routes>
                </MemoryRouter>
              </GroceryListProvider>
            </MealPlanProvider>
          </RecipeProvider>
        </IngredientProvider>
      </MantineProvider>
    ),
  }
}

describe('GroceryListDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render the page with stub data', () => {
      const { user: _user, ...result } = renderWithProviders(
        <GroceryListDetailPage />
      )
      const { container } = result

      // Should display list name
      expect(screen.getByText(/week of/i)).toBeInTheDocument()
      expect(container).toBeTruthy()
    })

    it('should display the list name', () => {
      renderWithProviders(<GroceryListDetailPage />)

      expect(
        screen.getByRole('heading', { name: /week of/i })
      ).toBeInTheDocument()
    })

    it('should display the date range', () => {
      renderWithProviders(<GroceryListDetailPage />)

      expect(screen.getByText(/2026-01-23/)).toBeInTheDocument()
      expect(screen.getByText(/2026-01-30/)).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render edit button', () => {
      renderWithProviders(<GroceryListDetailPage />)

      // There may be multiple edit buttons (item edit buttons), so we look for the one with leftSection
      const buttons = screen.getAllByRole('button', { name: /edit/i })
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should render delete button', () => {
      renderWithProviders(<GroceryListDetailPage />)

      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument()
    })

    it('should render back button', () => {
      renderWithProviders(<GroceryListDetailPage />)

      expect(
        screen.getByRole('button', { name: /back to lists/i })
      ).toBeInTheDocument()
    })
  })

  describe('Stub Items Display', () => {
    it('should display stub grocery items', () => {
      renderWithProviders(<GroceryListDetailPage />)

      // Should show at least some item text
      expect(screen.getByText(/banana/i)).toBeInTheDocument()
    })

    it('should display item quantities', () => {
      renderWithProviders(<GroceryListDetailPage />)

      // Should show quantities with units
      expect(screen.getByText(/2 cup/i)).toBeInTheDocument()
    })

    it('should display checkboxes for items', () => {
      renderWithProviders(<GroceryListDetailPage />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('URL Parameter', () => {
    it('should read id from URL params', () => {
      renderWithProviders(<GroceryListDetailPage />, '/grocery-lists/1')

      // Page should render successfully with the valid id
      expect(
        screen.getByRole('heading', { name: /week of/i })
      ).toBeInTheDocument()
    })
  })

  describe('Edit List Name', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const { user } = renderWithProviders(<GroceryListDetailPage />)

      const editButton = screen.getByTestId('edit-list-button')
      await user.click(editButton)

      // Wait for modal to appear
      expect(await screen.findByText('Edit Grocery List')).toBeInTheDocument()
    })

    it('should update list name when save is clicked', async () => {
      const { user } = renderWithProviders(<GroceryListDetailPage />)

      const editButton = screen.getByTestId('edit-list-button')
      await user.click(editButton)

      // Wait for modal to open
      await screen.findByText('Edit Grocery List')

      const nameInput = await screen.findByLabelText(/list name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'New List Name')

      const saveButton = screen.getByRole('button', { name: /^save$/i })
      await user.click(saveButton)

      // Wait for the new name to appear
      expect(await screen.findByText('New List Name')).toBeInTheDocument()
    })

    it('should close modal when cancel is clicked', async () => {
      const { user } = renderWithProviders(<GroceryListDetailPage />)

      const editButton = screen.getByTestId('edit-list-button')
      await user.click(editButton)

      // Wait for modal to open
      await screen.findByText('Edit Grocery List')

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
      // Click the first cancel button (from the modal)
      await user.click(cancelButtons[0])

      // Wait for modal to close (state update is async even without animation)
      await waitFor(() => {
        expect(screen.queryByText('Edit Grocery List')).not.toBeInTheDocument()
      })
    })
  })

  describe('Delete List', () => {
    it('should open confirmation modal when delete button is clicked', async () => {
      const { user } = renderWithProviders(<GroceryListDetailPage />)

      const deleteButton = screen.getByTestId('delete-list-button')
      await user.click(deleteButton)

      // Wait for modal to appear
      expect(await screen.findByText('Confirm Delete')).toBeInTheDocument()
    })

    it('should close modal when cancel is clicked', async () => {
      const { user } = renderWithProviders(<GroceryListDetailPage />)

      const deleteButton = screen.getByTestId('delete-list-button')
      await user.click(deleteButton)

      // Wait for modal to open
      await screen.findByText('Confirm Delete')

      const cancelButtons = await screen.findAllByRole('button', {
        name: /cancel/i,
      })
      // Click the cancel button from the modal
      await user.click(cancelButtons[0])

      // Wait for modal to close (state update is async)
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument()
      })
    })
  })
})
