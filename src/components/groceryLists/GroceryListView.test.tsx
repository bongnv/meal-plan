import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GroceryItem, GroceryList } from '../../types/groceryList'

import { GroceryListView } from './GroceryListView'

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('GroceryListView', () => {
  const mockGroceryList: GroceryList = {
    id: 'list-1',
    name: 'Week of Jan 23',
    dateRange: {
      start: '2026-01-23',
      end: '2026-01-30',
    },
    createdAt: 1737000000000,
  }

  const mockItems: GroceryItem[] = [
    {
      id: 'item-1',
      listId: 'list-1',
      ingredientId: 'ing-1',
      quantity: 2.5,
      unit: 'cup',
      category: 'Vegetables',
      checked: false,
      mealPlanIds: ['meal-1', 'meal-2'],
      notes: 'Get organic',
    },
    {
      id: 'item-2',
      listId: 'list-1',
      ingredientId: 'ing-2',
      quantity: 500,
      unit: 'gram',
      category: 'Meat',
      checked: false,
      mealPlanIds: ['meal-1'],
    },
    {
      id: 'item-3',
      listId: 'list-1',
      ingredientId: 'ing-3',
      quantity: 1,
      unit: 'liter',
      category: 'Dairy',
      checked: true,
      mealPlanIds: ['meal-3'],
    },
    {
      id: 'item-4',
      listId: 'list-1',
      ingredientId: 'ing-4',
      quantity: 3,
      unit: 'piece',
      category: 'Vegetables',
      checked: false,
      mealPlanIds: ['meal-2'],
    },
  ]

  const mockOnCheckItem = vi.fn()
  const mockOnUpdateQuantity = vi.fn()
  const mockOnUpdateNotes = vi.fn()
  const mockOnRemoveItem = vi.fn()
  const mockOnAddManualItem = vi.fn()
  const mockGetIngredientName = vi.fn((id: string) => {
    const names: Record<string, string> = {
      'ing-1': 'Carrot',
      'ing-2': 'Chicken Breast',
      'ing-3': 'Milk',
      'ing-4': 'Tomato',
    }
    return names[id] || 'Unknown'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders grocery list items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    expect(screen.getByText(/Carrot/)).toBeInTheDocument()
    expect(screen.getByText(/Chicken Breast/)).toBeInTheDocument()
    expect(screen.getByText(/Milk/)).toBeInTheDocument()
    expect(screen.getByText(/Tomato/)).toBeInTheDocument()
  })

  it('groups items by category', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Check category headers exist (using getAllByText because category appears in badges too)
    const vegetablesElements = screen.getAllByText(/Vegetables/)
    expect(vegetablesElements.length).toBeGreaterThan(0)

    const meatElements = screen.getAllByText(/Meat/)
    expect(meatElements.length).toBeGreaterThan(0)

    const dairyElements = screen.getAllByText(/Dairy/)
    expect(dairyElements.length).toBeGreaterThan(0)
  })

  it('hides empty categories', () => {
    const fewItems: GroceryItem[] = [
      {
        id: 'item-1',
        listId: 'list-1',
        ingredientId: 'ing-1',
        quantity: 2,
        unit: 'cup',
        category: 'Vegetables' as const,
        checked: false,
        mealPlanIds: ['meal-1'],
      },
    ]

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={fewItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Vegetables should be present (check for h4 heading)
    expect(
      screen.getByRole('heading', { name: /Vegetables/, level: 4 })
    ).toBeInTheDocument()

    // Meat and Dairy should not be present (no h4 headings with those names)
    expect(
      screen.queryByRole('heading', { name: /Meat/, level: 4 })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Dairy/, level: 4 })
    ).not.toBeInTheDocument()
  })

  it('displays quantity with unit', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    expect(screen.getByText(/2\.5 cup/)).toBeInTheDocument()
    expect(screen.getByText(/500 gram/)).toBeInTheDocument()
    expect(screen.getByText(/1 liter/)).toBeInTheDocument()
  })

  it('displays meal plan references', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Item 1 has 2 meal plans
    expect(screen.getByText(/2 meals/)).toBeInTheDocument()
    // Items 2, 3, 4 each have 1 meal plan
    const oneMealElements = screen.getAllByText(/1 meal/)
    expect(oneMealElements).toHaveLength(3)
  })

  it('displays notes when present', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // In compact format: "Carrot • 2.5 cup • 2 meals • Get organic"
    expect(screen.getByText(/Get organic/)).toBeInTheDocument()
  })

  it('calls onCheckItem when checkbox is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(mockOnCheckItem).toHaveBeenCalledWith('item-1')
  })

  it('applies strikethrough style to checked items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const milkText = screen.getByText(/Milk/)
    expect(milkText).toHaveStyle({ textDecoration: 'line-through' })
  })

  it('dims checked items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Find the card containing the checked item (Milk)
    const milkText = screen.getByText(/Milk/)
    const card = milkText.closest('[class*="mantine-Card"]')

    expect(card).toHaveStyle({ opacity: '0.6' })
  })

  it('calls onRemoveItem when remove button is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const removeButtons = screen.getAllByLabelText(/Remove item/i)
    await user.click(removeButtons[0])

    expect(mockOnRemoveItem).toHaveBeenCalledWith('item-1')
  })

  it('displays add manual item section', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    expect(screen.getByText('Add Manual Item')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Quantity')).toBeInTheDocument()
  })

  it('calls onAddManualItem when add button is clicked with valid data', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const nameInput = screen.getByPlaceholderText('Item name')
    const quantityInput = screen.getByPlaceholderText('Quantity')

    await user.type(nameInput, 'Extra Bananas')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')

    const addButton = screen.getByRole('button', { name: /Add item/i })
    await user.click(addButton)

    expect(mockOnAddManualItem).toHaveBeenCalledWith({
      name: 'Extra Bananas',
      quantity: 5,
      unit: 'piece',
      category: 'Other',
    })
  })

  it('does not call onAddManualItem when name is empty', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const addButton = screen.getByRole('button', { name: /Add item/i })
    await user.click(addButton)

    expect(mockOnAddManualItem).not.toHaveBeenCalled()
  })

  it('clears manual item form after adding', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    const nameInput = screen.getByPlaceholderText('Item name')
    const quantityInput = screen.getByPlaceholderText('Quantity')

    await user.type(nameInput, 'Extra Bananas')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')

    const addButton = screen.getByRole('button', { name: /Add item/i })
    await user.click(addButton)

    expect(nameInput).toHaveValue('')
    expect(quantityInput).toHaveValue('1')
  })

  it('displays empty state when no items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={[]}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    expect(
      screen.getByText(/No items in this grocery list/i)
    ).toBeInTheDocument()
  })

  it('shows progress badge with checked/total count', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Should show "1 / 4 checked" (1 item checked out of 4 total)
    expect(screen.getByText('1 / 4 checked')).toBeInTheDocument()
  })

  it('displays ingredient name from getIngredientName', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    expect(mockGetIngredientName).toHaveBeenCalledWith('ing-1')
    expect(mockGetIngredientName).toHaveBeenCalledWith('ing-2')
    expect(mockGetIngredientName).toHaveBeenCalledWith('ing-3')
    expect(mockGetIngredientName).toHaveBeenCalledWith('ing-4')
  })

  it('displays manually added items without ingredientId', () => {
    const manualItems: GroceryItem[] = [
      {
        id: 'manual-1',
        listId: 'list-1',
        ingredientId: null,
        name: 'Extra Bananas',
        quantity: 3,
        unit: 'piece',
        category: 'Other' as const,
        checked: false,
        mealPlanIds: [],
        notes: 'Manual item',
      },
    ]

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={manualItems}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getIngredientName={mockGetIngredientName}
      />
    )

    // Should display the manual item name
    expect(screen.getByText(/Extra Bananas/)).toBeInTheDocument()

    // getIngredientName should not be called for manual items
    expect(mockGetIngredientName).not.toHaveBeenCalled()
  })
})
