import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CalendarView } from './CalendarView'

import type { MealPlan } from '../../types/mealPlan'

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
        totalTime: 30,
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
    return render(
      <MantineProvider>
        <CalendarView {...defaultProps} {...props} />
      </MantineProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render calendar with current month by default', () => {
      renderCalendarView()
      
      // Should show some form of calendar (days of the week, dates, etc.)
      expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument()
    })

    it('should display month view by default', () => {
      renderCalendarView()
      
      // Month view should show ~30 days
      expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument()
    })

    it('should highlight today\'s date', () => {
      renderCalendarView()
      
      const today = new Date().getDate()
      const todayElement = screen.getByText(new RegExp(`^${today}$`))
      expect(todayElement).toHaveAttribute('data-today', 'true')
    })
  })

  describe('View Modes', () => {
    it('should support week view mode', async () => {
      const user = userEvent.setup()
      renderCalendarView()
      
      const weekOption = screen.getByLabelText('Week')
      await user.click(weekOption)
      
      // Should show 7 days in week view
      const calendarDays = screen.getAllByRole('gridcell')
      expect(calendarDays.length).toBe(7)
    })

    it('should support month view mode', async () => {
      renderCalendarView()
      
      const monthOption = screen.getByLabelText('Month')
      
      // Month view is active (default)
      expect(monthOption).toBeChecked()
    })
  })

  describe('Navigation', () => {
    it('should have previous period button', () => {
      renderCalendarView()
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
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
      
      const currentMonth = screen.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i).textContent
      
      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)
      
      const newMonth = screen.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i).textContent
      expect(newMonth).not.toBe(currentMonth)
    })

    it('should navigate to next month', async () => {
      const user = userEvent.setup()
      renderCalendarView()
      
      const currentMonth = screen.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i).textContent
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const newMonth = screen.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i).textContent
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
      
      // Should have meal slots (lunch/dinner labels or slots)
      const mealSlots = screen.getAllByText(/lunch|dinner/i)
      expect(mealSlots.length).toBeGreaterThan(0)
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
          mealType: expect.stringMatching(/lunch|dinner/),
        })
      )
    })

    it('should call onEditMeal when clicking on existing meal', async () => {
      const user = userEvent.setup()
      const onEditMeal = vi.fn()
      renderCalendarView({ onEditMeal })
      
      const mealElement = screen.getByText(/spaghetti carbonara/i)
      await user.click(mealElement)
      
      expect(onEditMeal).toHaveBeenCalledTimes(1)
      expect(onEditMeal).toHaveBeenCalledWith(mockMealPlans[0])
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
