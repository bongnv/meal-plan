import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GroceryListProvider } from '../../contexts/GroceryListContext'
import { IngredientProvider } from '../../contexts/IngredientContext'
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
    unit: 'piece',
  },
  {
    id: 'chicken-id',
    name: 'Chicken Breast',
    category: 'Meat',
    unit: 'gram',
  },
  {
    id: 'milk-id',
    name: 'Milk',
    category: 'Dairy',
    unit: 'liter',
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
    ingredientId: 'banana-id',
    quantity: 2,
    unit: 'cup',
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

const renderWithProviders = (
  component: React.ReactElement,
  route = '/grocery-lists/1'
) => {
  return render(
    <MantineProvider>
      <IngredientProvider>
        <GroceryListProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/grocery-lists/:id" element={component} />
            </Routes>
          </MemoryRouter>
        </GroceryListProvider>
      </IngredientProvider>
    </MantineProvider>
  )
}

describe('GroceryListDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render the page with stub data', () => {
      renderWithProviders(<GroceryListDetailPage />)

      // Should display list name
      expect(screen.getByText(/week of/i)).toBeInTheDocument()
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

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
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
})
