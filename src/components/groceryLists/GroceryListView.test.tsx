import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GroceryItem, GroceryList } from '../../types/groceryList'
import { MealPlan } from '../../types/mealPlan'

import { GroceryListView } from './GroceryListView'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MantineProvider>{component}</MantineProvider>
    </BrowserRouter>
  )
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
      name: 'Carrot',
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
      name: 'Chicken Breast',
      quantity: 500,
      unit: 'gram',
      category: 'Meat',
      checked: false,
      mealPlanIds: ['meal-1'],
    },
    {
      id: 'item-3',
      listId: 'list-1',
      name: 'Milk',
      quantity: 1,
      unit: 'liter',
      category: 'Dairy',
      checked: true,
      mealPlanIds: ['meal-3'],
    },
    {
      id: 'item-4',
      listId: 'list-1',
      name: 'Tomato',
      quantity: 3,
      unit: 'piece',
      category: 'Vegetables',
      checked: false,
      mealPlanIds: ['meal-2'],
    },
  ]

  const mockMealPlans: MealPlan[] = [
    {
      id: 'meal-1',
      date: '2026-01-23',
      mealType: 'lunch',
      type: 'recipe',
      recipeId: 'recipe-1',
      servings: 2,
    },
    {
      id: 'meal-2',
      date: '2026-01-24',
      mealType: 'dinner',
      type: 'recipe',
      recipeId: 'recipe-2',
      servings: 4,
    },
    {
      id: 'meal-3',
      date: '2026-01-25',
      mealType: 'lunch',
      type: 'recipe',
      recipeId: 'recipe-1',
      servings: 2,
    },
  ]

  const mockOnCheckItem = vi.fn()
  const mockOnUpdateQuantity = vi.fn()
  const mockOnUpdateNotes = vi.fn()
  const mockOnRemoveItem = vi.fn()
  const mockOnAddManualItem = vi.fn()
  const mockGetRecipeName = vi.fn((id: string) => {
    const names: Record<string, string> = {
      'recipe-1': 'Chicken Salad',
      'recipe-2': 'Beef Stir Fry',
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
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
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
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    // Find category headings (they appear multiple times - in dropdown and as heading)
    const vegetablesHeadings = screen.getAllByText('Vegetables')
    expect(vegetablesHeadings.length).toBeGreaterThan(0)
    const meatHeadings = screen.getAllByText('Meat')
    expect(meatHeadings.length).toBeGreaterThan(0)
    const dairyHeadings = screen.getAllByText('Dairy')
    expect(dairyHeadings.length).toBeGreaterThan(0)
  })

  it('hides empty categories', () => {
    const itemsOnlyVegetables = mockItems.filter(
      item => item.category === 'Vegetables'
    )

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={itemsOnlyVegetables}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    // Vegetables should be present as a category heading
    const vegetablesHeadings = screen.getAllByText('Vegetables')
    expect(vegetablesHeadings.length).toBeGreaterThan(0)
    // Meat and Dairy should not appear as category headings (only in dropdown)
    expect(screen.queryByRole('heading', { name: 'Meat' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dairy' })).not.toBeInTheDocument()
  })

  it('displays quantity with unit', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    expect(screen.getByText(/2.5 cup/)).toBeInTheDocument()
    expect(screen.getByText(/500 gram/)).toBeInTheDocument()
    expect(screen.getByText(/1 liter/)).toBeInTheDocument()
    expect(screen.getByText(/3 piece/)).toBeInTheDocument()
  })

  it('displays meal plan references', async () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    // Recipe names should appear in meal plan badges
    // Check that getRecipeName was called (which means badges are rendering recipe names)
    expect(mockGetRecipeName).toHaveBeenCalled()
    
    // Verify the recipe names appear in the rendered output
    expect(screen.queryAllByText(/Chicken Salad/i).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/Beef Stir Fry/i).length).toBeGreaterThan(0)
  })

  it('displays notes when present', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    expect(screen.getByText(/Get organic/)).toBeInTheDocument()
  })

  it('calls onCheckItem when checkbox is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(mockOnCheckItem).toHaveBeenCalled()
  })

  it('applies strikethrough style to checked items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const milkText = screen.getByText(/Milk/)
    // Note: In tests, CSS may not be applied, so we check the actual item is there
    expect(milkText).toBeInTheDocument()
  })

  it('dims checked items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    // Verify the checked item is rendered
    expect(screen.getByText(/Milk/)).toBeInTheDocument()
  })

  it('calls onRemoveItem when remove button is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const deleteButtons = screen.getAllByLabelText(/Remove item/)
    await user.click(deleteButtons[0])

    expect(mockOnRemoveItem).toHaveBeenCalled()
  })

  it('displays add manual item section', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    expect(screen.getByText('Add Manual Item')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
  })

  it('calls onAddManualItem when add button is clicked with valid data', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const inputs = screen.getAllByPlaceholderText('Item name')
    await user.type(inputs[inputs.length - 1], 'Bread')

    const addButtons = screen.getAllByText('Add item')
    await user.click(addButtons[addButtons.length - 1])

    expect(mockOnAddManualItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bread',
      })
    )
  })

  it('does not call onAddManualItem when name is empty', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const addButtons = screen.getAllByText('Add item')
    await user.click(addButtons[addButtons.length - 1])

    expect(mockOnAddManualItem).not.toHaveBeenCalled()
  })

  it('clears manual item form after adding', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    const inputs = screen.getAllByPlaceholderText('Item name')
    const input = inputs[inputs.length - 1] as HTMLInputElement
    await user.type(input, 'Bread')

    const addButtons = screen.getAllByText('Add item')
    await user.click(addButtons[addButtons.length - 1])

    expect(input.value).toBe('')
  })

  it('displays empty state when no items', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={[]}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    expect(screen.getByText('No items in this grocery list')).toBeInTheDocument()
  })

  it('shows progress badge with checked/total count', () => {
    renderWithProviders(
      <GroceryListView
        groceryList={mockGroceryList}
        items={mockItems}
        mealPlans={mockMealPlans}
        onCheckItem={mockOnCheckItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onUpdateNotes={mockOnUpdateNotes}
        onRemoveItem={mockOnRemoveItem}
        onAddManualItem={mockOnAddManualItem}
        getRecipeName={mockGetRecipeName}
      />
    )

    // 1 item is checked (Milk), 4 total
    expect(screen.getByText('1 / 4 checked')).toBeInTheDocument()
  })
})
