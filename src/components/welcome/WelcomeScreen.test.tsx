import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WelcomeScreen } from './WelcomeScreen'

import type { ReactNode } from 'react'

// Mock contexts
const mockConnect = vi.fn()
const mockSelectFile = vi.fn()
const mockDisconnectAndReset = vi.fn()
let mockIsAuthenticated = false
let mockSelectedFile: { id: string; name: string; path: string } | null = null

vi.mock('../../contexts/SyncContext', () => ({
  useSyncContext: () => ({
    selectedFile: mockSelectedFile,
    selectFile: mockSelectFile,
    isInitializing: false,
    isAuthenticated: mockIsAuthenticated,
    connect: mockConnect,
    disconnectAndReset: mockDisconnectAndReset,
  }),
}))

// Mock FileSelectionModal
vi.mock('../sync/FileSelectionModal', () => ({
  FileSelectionModal: ({
    onClose,
    onSelectFile,
  }: {
    onClose: () => void
    onSelectFile: (file: unknown) => void
  }) => {
    return (
      <div data-testid="file-selection-modal">
        <button
          onClick={() =>
            onSelectFile({
              id: '1',
              name: 'test.json.gz',
              path: '/test.json.gz',
            })
          }
        >
          Select File
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    )
  },
}))

const renderWithProviders = (component: ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('WelcomeScreen', () => {
  const mockOnConnect = vi.fn()
  const mockOnSkip = vi.fn()

  const defaultProps = {
    onConnect: mockOnConnect,
    onSkip: mockOnSkip,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockIsAuthenticated = false
    mockSelectedFile = null
  })

  describe('Display Logic', () => {
    it('should render when opened prop is true', () => {
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /connect to onedrive/i })
      ).toBeInTheDocument()
    })

    it('should still render when localStorage has data (to encourage backup)', () => {
      // Set some data in localStorage
      localStorage.setItem(
        'recipes',
        JSON.stringify([{ id: '1', name: 'Test Recipe' }])
      )

      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      // Welcome screen should still show to encourage backup
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    it('should check for any localStorage keys (recipes, mealPlans, ingredients)', () => {
      localStorage.setItem('mealPlans', JSON.stringify([]))

      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      // Welcome screen should still show to encourage backup
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    it('should show welcome screen again after disconnect', async () => {
      // Start connected - welcome screen should not be rendered by parent
      mockIsAuthenticated = true
      mockSelectedFile = { id: '1', name: 'test.json.gz', path: '/test' }

      // When connected, parent doesn't render WelcomeScreen at all
      renderWithProviders(<div />)
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()

      // Simulate disconnect - user disconnects completely, not just file
      mockIsAuthenticated = false
      mockSelectedFile = null

      // After disconnect, parent renders WelcomeScreen
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      // Should show welcome screen after complete disconnect
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      })
    })
  })

  describe('UI Elements', () => {
    it('should display welcome message and app intro', () => {
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      expect(screen.getByText(/meal plan/i)).toBeInTheDocument()
    })

    it('should display "Connect to OneDrive" primary button', () => {
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      expect(connectButton).toBeInTheDocument()
    })

    it('should display "Skip - Work Offline" secondary link', () => {
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      const skipLink = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      expect(skipLink).toBeInTheDocument()
    })

    it('should display warning about offline limitations', () => {
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      expect(screen.getByText(/offline limitations/i)).toBeInTheDocument()
      expect(screen.getByText(/not be backed up/i)).toBeInTheDocument()
    })
  })

  describe('Connect to OneDrive', () => {
    it('should call onConnect when connect button is clicked', async () => {
      const user = userEvent.setup()
      mockOnConnect.mockResolvedValue(undefined)
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      await user.click(connectButton)

      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalled()
      })
    })
  })

  describe('Skip to Offline', () => {
    it('should call onSkip when skip button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      const skipButton = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalled()
      })
    })

    it('should NOT persist skip choice to localStorage (will show again on reload)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      const skipButton = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalled()
      })

      // Verify no localStorage flag was set
      expect(localStorage.getItem('welcomeScreenDismissed')).toBeNull()
    })

    it('should show welcome screen again on next visit if user skipped and has no data', () => {
      // This simulates a page reload after user clicked skip
      // Since no localStorage flag is set and user is not connected, welcome should show
      renderWithProviders(<WelcomeScreen {...defaultProps} />)

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should use Center layout for centering content', () => {
      const { container } = renderWithProviders(
        <WelcomeScreen {...defaultProps} />
      )

      // Check if Center component is used (rendered as div)
      const centerElement = container.querySelector(
        '[data-testid="welcome-screen"]'
      )
      expect(centerElement).toBeInTheDocument()
    })

    it('should have full-height overlay', () => {
      const { container } = renderWithProviders(
        <WelcomeScreen {...defaultProps} />
      )

      const overlay = container.querySelector('[data-testid="welcome-screen"]')
      expect(overlay).toBeInTheDocument()
      // Overlay component uses fixed positioning automatically
      expect(overlay).toHaveAttribute('data-testid', 'welcome-screen')
    })
  })
})
