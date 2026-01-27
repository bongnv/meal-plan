import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

// Mock groceryListService - will be configured in beforeEach
const mockUpdateList = vi.fn()
const mockDeleteList = vi.fn()
const mockAddItem = vi.fn()
const mockUpdateItem = vi.fn()
const mockRemoveItem = vi.fn()

vi.mock('../../services/groceryListService', () => ({
  groceryListService: {
    updateList: (...args: any[]) => mockUpdateList(...args),
    deleteList: (...args: any[]) => mockDeleteList(...args),
    addItem: (...args: any[]) => mockAddItem(...args),
    updateItem: (...args: any[]) => mockUpdateItem(...args),
    removeItem: (...args: any[]) => mockRemoveItem(...args),
  },
}))

const mockIngredients: Ingredient[] = [
  {
    id: 'banana-id',
    name: 'Banana',
    category: 'Fruits',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'chicken-id',
    name: 'Chicken Breast',
    category: 'Meat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'milk-id',
    name: 'Milk',
    category: 'Dairy',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

// Mock grocery list data (mutable for tests that update it)
let mockGroceryList = {
  id: '1',
  name: 'Week of Jan 23',
  dateRange: {
    start: '2026-01-23',
    end: '2026-01-30',
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockGroceryItems = [
  {
    id: 'item-1',
    listId: '1',
    name: 'Banana',
    quantity: 2,
    unit: 'cup',
    checked: false,
    category: 'Fruits',
    mealPlanIds: ['meal-1'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/grocery-lists/:id" element={component} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    ),
  }
}

describe('GroceryListDetailPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset mockGroceryList to default
    mockGroceryList = {
      id: '1',
      name: 'Week of Jan 23',
      dateRange: {
        start: '2026-01-23',
        end: '2026-01-30',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Configure updateList mock to update mockGroceryList
    mockUpdateList.mockImplementation(async list => {
      mockGroceryList = list
    })

    const { useLiveQuery } = await import('dexie-react-hooks')
    vi.mocked(useLiveQuery).mockImplementation(queryFn => {
      const query = queryFn?.toString() || ''
      if (query.includes('groceryLists.get')) return mockGroceryList
      if (query.includes('groceryItems.where')) return mockGroceryItems
      if (query.includes('recipes')) return []
      if (query.includes('mealPlans')) return []
      return undefined
    })
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

      // Verify the service was called with updated data
      await waitFor(() => {
        expect(mockUpdateList).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'New List Name',
          })
        )
      })
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
