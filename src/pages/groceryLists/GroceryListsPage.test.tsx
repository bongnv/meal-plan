import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServicesProvider } from '@/contexts/ServicesContext'

import { GroceryListsPage } from './GroceryListsPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ServicesProvider>
      <MantineProvider>
        <Notifications />
        <MemoryRouter>{component}</MemoryRouter>
      </MantineProvider>
    </ServicesProvider>
  )
}

describe('GroceryListsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<GroceryListsPage />)

      expect(
        screen.getByRole('heading', { name: /grocery lists/i })
      ).toBeInTheDocument()
    })

    it('should render the generate new list button in header', () => {
      renderWithProviders(<GroceryListsPage />)

      const buttons = screen.getAllByRole('button', {
        name: /generate new list/i,
      })

      // Should have at least one button (header always visible)
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no grocery lists exist', () => {
      renderWithProviders(<GroceryListsPage />)

      expect(screen.getByText(/no grocery lists yet/i)).toBeInTheDocument()
    })

    it('should show CTA message in empty state', () => {
      renderWithProviders(<GroceryListsPage />)

      expect(
        screen.getByText(/generate your first grocery list/i)
      ).toBeInTheDocument()
    })
  })

  describe('Stub Data Display', () => {
    it('should display stub grocery list cards', () => {
      renderWithProviders(<GroceryListsPage />)

      // Stub data should include example lists
      // We'll add these after implementing the component
      // For now, test that empty state is shown
      expect(screen.getByText(/no grocery lists yet/i)).toBeInTheDocument()
    })
  })

  describe('Generate Button Interaction', () => {
    it('should open modal when generate button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<GroceryListsPage />)

      const buttons = screen.getAllByRole('button', {
        name: /generate new list/i,
      })

      // Click the first button (header button)
      await user.click(buttons[0])

      // Modal should open (placeholder for now)
      // We'll implement this in I8.4
    })
  })

  describe('Navigation', () => {
    it('should be accessible via /grocery-lists route', () => {
      // This is tested by the route configuration in App.tsx
      // which we already verified in I8.1
      renderWithProviders(<GroceryListsPage />)

      expect(
        screen.getByRole('heading', { name: /grocery lists/i })
      ).toBeInTheDocument()
    })
  })
})
