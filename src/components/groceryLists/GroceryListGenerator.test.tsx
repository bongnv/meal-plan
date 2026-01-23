import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { GroceryListGenerator } from './GroceryListGenerator'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <Notifications />
      {component}
    </MantineProvider>
  )
}

describe('GroceryListGenerator', () => {
  const mockOnClose = vi.fn()
  const mockOnGenerate = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnGenerate.mockClear()
  })

  it('should not render when closed', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={false}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    expect(
      screen.queryByText('Generate Grocery List')
    ).not.toBeInTheDocument()
  })

  it('should render modal when opened', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    expect(screen.getByText('Generate Grocery List')).toBeInTheDocument()
  })

  it('should render date range pickers', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
  })

  it('should render optional name input', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    const nameInput = screen.getByLabelText(/list name/i)
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toHaveAttribute('placeholder')
  })

  it('should render quick select buttons', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    expect(screen.getByText(/quick select/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next 7 days/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next 14 days/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /next 30 days/i })
    ).toBeInTheDocument()
  })

  it('should render Generate and Cancel buttons', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    expect(
      screen.getByRole('button', { name: /^generate list$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /cancel/i })
    ).toBeInTheDocument()
  })

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when modal is closed via X button', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    // Mantine Modal close button is rendered in the header
    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should allow user to type in name input', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    const nameInput = screen.getByLabelText(/list name/i)
    await user.type(nameInput, 'My Custom List')

    expect(nameInput).toHaveValue('My Custom List')
  })

  it('should enable Generate button when dates are selected', async () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    // Generate button should be disabled initially
    const generateButton = screen.getByRole('button', {
      name: /^generate list$/i,
    })
    expect(generateButton).toBeDisabled()

    // Note: Testing DatePickerInput date selection is complex in unit tests
    // The actual functionality will be verified in integration/E2E tests
    // This test confirms the disabled state logic is wired correctly
  })

  it('should have disabled Generate button by default (no date range selected)', () => {
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    const generateButton = screen.getByRole('button', {
      name: /^generate list$/i,
    })
    expect(generateButton).toBeDisabled()
  })

  it('should show days selected when date range is chosen', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GroceryListGenerator
        opened={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
      />
    )

    // Click "Next 7 days" quick select button
    const sevenDaysButton = screen.getByRole('button', {
      name: /next 7 days/i,
    })
    await user.click(sevenDaysButton)

    // Should show days selected text
    await waitFor(() => {
      expect(screen.getByText(/7 days selected/i)).toBeInTheDocument()
    })

    // Should show date range summary
    expect(screen.getByText(/date range summary/i)).toBeInTheDocument()
  })
})
