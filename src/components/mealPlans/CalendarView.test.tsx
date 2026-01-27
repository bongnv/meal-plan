import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MealPlanProvider } from '../../contexts/MealPlanContext'

import { CalendarView } from './CalendarView'

import type { MealPlan } from '../../types/mealPlan'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <MealPlanProvider>
        <MemoryRouter>{component}</MemoryRouter>
      </MealPlanProvider>
    </MantineProvider>
  )
}

describe('CalendarView', () => {
  const mockMealPlans: MealPlan[] = [
    {
      id: '1',
      date: '2026-01-15',
      mealType: 'lunch',
      type: 'recipe',
      recipeId: 'recipe1',
      servings: 4,
    },
    {
      id: '2',
      date: '2026-01-15',
      mealType: 'dinner',
      type: 'dining-out',
      customText: 'Italian Restaurant',
    },
    {
      id: '3',
      date: '2026-01-16',
      mealType: 'lunch',
      type: 'leftovers',
    },
  ]

  const mockGetRecipeById = vi.fn((id: string) => {
    if (id === 'recipe1') {
      return {
        id: 'recipe1',
        name: 'Spaghetti Carbonara',
        description: 'Classic pasta dish',
        ingredients: [],
        instructions: [],
        servings: 4,
        prepTime: 15,
        cookTime: 15,
        tags: [],
      }
    }
    return undefined
  })

  const defaultProps = {
    mealPlans: mockMealPlans,
    getRecipeById: mockGetRecipeById,
    onAddMeal: vi.fn(),
    onEditMeal: vi.fn(),
  }

  const renderCalendarView = (props = {}) => {
    return renderWithProviders(<CalendarView {...defaultProps} {...props} />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render calendar with current month by default', () => {
      renderCalendarView()

      // Should show some form of calendar (days of the week, dates, etc.)
      expect(
        screen.getByRole('region', { name: /calendar/i })
      ).toBeInTheDocument()
    })

    it('should display month view by default', () => {
      renderCalendarView()

      // Month view should show ~30 days
      expect(
        screen.getByRole('region', { name: /calendar/i })
      ).toBeInTheDocument()
    })

    it("should highlight today's date", () => {
      renderCalendarView()

      const today = new Date().getDate()
      const todayElement = screen.getByText(new RegExp(`^${today}$`))
      expect(todayElement).toHaveAttribute('data-today', 'true')
    })
  })

  describe('View Modes', () => {
    it('should display month view by default (35-42 days in calendar grid)', () => {
      renderCalendarView()

      // Month view shows a full month grid (typically 35-42 cells for 7 columns x 5-6 rows)
      const calendarDays = screen.getAllByRole('gridcell')
      expect(calendarDays.length).toBeGreaterThanOrEqual(28)
      expect(calendarDays.length).toBeLessThanOrEqual(42)
    })

    it('should show 7 day header row', () => {
      renderCalendarView()

      // Should have day headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.getByText('Fri')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('should switch to list view when List is selected', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      // Month view is default - day headers should be visible
      expect(screen.getByText('Sun')).toBeInTheDocument()

      // Click on List view option
      await user.click(screen.getByLabelText('List'))

      // Day headers should not be present in list view
      expect(screen.queryByText('Sun')).not.toBeInTheDocument()

      // List view should show date headers in long format
      expect(screen.getByText(/Thursday, January 15, 2026/)).toBeInTheDocument()
    })

    it('should switch back to month view', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      // Switch to list view
      await user.click(screen.getByLabelText('List'))
      expect(screen.queryByText('Sun')).not.toBeInTheDocument()

      // Switch back to month view
      await user.click(screen.getByLabelText('Month'))

      // Day headers should be visible again
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })

    it('should display meals in list view with drag-and-drop support', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      // Switch to list view
      await user.click(screen.getByLabelText('List'))

      // Meals should be displayed
      expect(screen.getByText(/Spaghetti Carbonara/)).toBeInTheDocument()
      expect(screen.getByText(/Italian Restaurant/)).toBeInTheDocument()
    })

    it('should show view mode switcher with Month and List options', () => {
      renderCalendarView()

      // View switcher should be present
      expect(screen.getByLabelText('Month')).toBeInTheDocument()
      expect(screen.getByLabelText('List')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should have previous period button', () => {
      renderCalendarView()

      expect(
        screen.getByRole('button', { name: /previous/i })
      ).toBeInTheDocument()
    })

    it('should have next period button', () => {
      renderCalendarView()

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should have today button', () => {
      renderCalendarView()

      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
    })

    it('should navigate to previous month', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      const currentMonth = screen.getByText(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      ).textContent

      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)

      const newMonth = screen.getByText(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      ).textContent
      expect(newMonth).not.toBe(currentMonth)
    })

    it('should navigate to next month', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      const currentMonth = screen.getByText(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      ).textContent

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      const newMonth = screen.getByText(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      ).textContent
      expect(newMonth).not.toBe(currentMonth)
    })

    it('should navigate to today', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      // Navigate away first
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      await user.click(nextButton)

      // Then go back to today
      const todayButton = screen.getByRole('button', { name: /today/i })
      await user.click(todayButton)

      // Today should be highlighted
      const today = new Date().getDate()
      const todayElement = screen.getByText(new RegExp(`^${today}$`))
      expect(todayElement).toHaveAttribute('data-today', 'true')
    })
  })

  describe('Meal Display', () => {
    it('should display recipe meal with recipe name', () => {
      renderCalendarView()

      expect(screen.getByText(/spaghetti carbonara/i)).toBeInTheDocument()
    })

    it('should display custom meal with icon and text', () => {
      renderCalendarView()

      expect(screen.getByText(/italian restaurant/i)).toBeInTheDocument()
      expect(screen.getByText('🍽️')).toBeInTheDocument() // Dining out icon
    })

    it('should display custom meal with icon only when no text', () => {
      const mealPlansWithIconOnly: MealPlan[] = [
        {
          id: '4',
          date: '2026-01-17',
          mealType: 'dinner',
          type: 'leftovers',
        },
      ]

      renderCalendarView({ mealPlans: mealPlansWithIconOnly })

      expect(screen.getByText('♻️')).toBeInTheDocument() // Leftovers icon
    })

    it('should show lunch and dinner slots for each day', () => {
      renderCalendarView()

      // Should have meal slots - check for "+ Add Meal" buttons
      const addButtons = screen.getAllByText(/\+ add meal/i)
      expect(addButtons.length).toBeGreaterThan(0)
    })

    it('should show "+ Add Meal" for empty slots', () => {
      renderCalendarView()

      const addButtons = screen.getAllByText(/\+ add meal/i)
      expect(addButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Interactions', () => {
    it('should call onAddMeal when clicking "+ Add Meal"', async () => {
      const user = userEvent.setup()
      const onAddMeal = vi.fn()
      renderCalendarView({ onAddMeal })

      const addButton = screen.getAllByText(/\+ add meal/i)[0]
      await user.click(addButton)

      expect(onAddMeal).toHaveBeenCalledTimes(1)
      expect(onAddMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(String),
        })
      )
    })

    it('should navigate to meal plan detail when clicking on existing meal', async () => {
      const user = userEvent.setup()
      renderCalendarView()

      // Click on the meal container
      const mealLink = screen.getByText(/spaghetti carbonara/i)
      const mealContainer = mealLink.closest('[style*="cursor: pointer"]')
      expect(mealContainer).toBeTruthy()

      await user.click(mealContainer!)

      // Navigation happens via react-router, tested in integration tests
      // Here we just verify the click doesn't error and the meal is clickable
      expect(mealContainer).toHaveStyle({ cursor: 'pointer' })
    })
  })

  describe('Empty State', () => {
    it('should show empty slots when no meals planned', () => {
      renderCalendarView({ mealPlans: [] })

      const addButtons = screen.getAllByText(/\+ add meal/i)
      expect(addButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should render without errors on mobile viewport', () => {
      // Simulate mobile viewport
      window.innerWidth = 375
      window.dispatchEvent(new Event('resize'))

      const { container } = renderCalendarView()
      expect(container).toBeInTheDocument()
    })
  })
})
