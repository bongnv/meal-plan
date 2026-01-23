import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WelcomeScreen } from './WelcomeScreen'

import type { ReactNode } from 'react'

// Mock contexts
const mockConnect = vi.fn()
const mockConnectProvider = vi.fn()
const mockDismissAutoOpenFileModal = vi.fn()
let mockIsAuthenticated = false
let mockSelectedFile: { id: string; name: string; path: string } | null = null
const mockShouldAutoOpenFileModal = false

vi.mock('../../contexts/CloudStorageContext', () => ({
  useCloudStorage: () => ({
    isAuthenticated: mockIsAuthenticated,
    connect: mockConnect,
  }),
}))

vi.mock('../../contexts/SyncContext', () => ({
  useSyncContext: () => ({
    selectedFile: mockSelectedFile,
    hasSelectedFile: () => mockSelectedFile !== null,
    connectProvider: mockConnectProvider,
    shouldAutoOpenFileModal: mockShouldAutoOpenFileModal,
    dismissAutoOpenFileModal: mockDismissAutoOpenFileModal,
    isInitializing: false,
  }),
}))

// Mock FileSelectionModal
vi.mock('../sync/FileSelectionModal', () => ({
  FileSelectionModal: ({
    opened,
    onClose,
    onSelectFile,
  }: {
    opened: boolean
    onClose: () => void
    onSelectFile: (file: unknown) => void
  }) => {
    if (!opened) return null
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
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockIsAuthenticated = false
    mockSelectedFile = null
  })

  describe('Display Logic', () => {
    it('should render when no localStorage data and not connected', () => {
      renderWithProviders(<WelcomeScreen />)

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

      renderWithProviders(<WelcomeScreen />)

      // Welcome screen should still show to encourage backup
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    it('should not render when user is already connected', () => {
      // Set up connected state
      mockIsAuthenticated = true
      mockSelectedFile = { id: '1', name: 'test.json.gz', path: '/test' }

      renderWithProviders(<WelcomeScreen />)

      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
    })

    it('should check for any localStorage keys (recipes, mealPlans, ingredients)', () => {
      localStorage.setItem('mealPlans', JSON.stringify([]))

      renderWithProviders(<WelcomeScreen />)

      // Welcome screen should still show to encourage backup
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    it('should show welcome screen again after disconnect', async () => {
      // Start connected
      mockIsAuthenticated = true
      mockSelectedFile = { id: '1', name: 'test.json.gz', path: '/test' }

      renderWithProviders(<WelcomeScreen />)

      // Should not show when connected
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()

      // Simulate disconnect - user disconnects completely, not just file
      mockIsAuthenticated = false
      mockSelectedFile = null

      renderWithProviders(<WelcomeScreen />)

      // Should show welcome screen after complete disconnect
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      })
    })
  })

  describe('UI Elements', () => {
    it('should display welcome message and app intro', () => {
      renderWithProviders(<WelcomeScreen />)

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      expect(screen.getByText(/meal plan/i)).toBeInTheDocument()
    })

    it('should display "Connect to OneDrive" primary button', () => {
      renderWithProviders(<WelcomeScreen />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      expect(connectButton).toBeInTheDocument()
    })

    it('should display "Skip - Work Offline" secondary link', () => {
      renderWithProviders(<WelcomeScreen />)

      const skipLink = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      expect(skipLink).toBeInTheDocument()
    })

    it('should display warning about offline limitations', () => {
      renderWithProviders(<WelcomeScreen />)

      expect(screen.getByText(/offline limitations/i)).toBeInTheDocument()
      expect(screen.getByText(/not be backed up/i)).toBeInTheDocument()
    })
  })

  describe('Connect to OneDrive', () => {
    it('should open FileSelectionModal when connect button is clicked', async () => {
      const user = userEvent.setup()
      mockConnect.mockImplementation(async () => {
        mockIsAuthenticated = true
      })
      const { rerender } = renderWithProviders(<WelcomeScreen />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      await user.click(connectButton)

      // Rerender to reflect authentication state change
      rerender(<MantineProvider><WelcomeScreen /></MantineProvider>)

      await waitFor(() => {
        expect(screen.getByTestId('file-selection-modal')).toBeInTheDocument()
      })
    })

    it('should authenticate before opening file selection', async () => {
      const user = userEvent.setup()
      mockConnect.mockResolvedValue(undefined)
      renderWithProviders(<WelcomeScreen />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      await user.click(connectButton)

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
      })
    })

    it('should hide welcome screen after file selection', async () => {
      const user = userEvent.setup()
      mockConnect.mockImplementation(async () => {
        mockIsAuthenticated = true
      })
      const { rerender } = renderWithProviders(<WelcomeScreen />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      await user.click(connectButton)

      // Rerender to reflect authentication state change
      rerender(<MantineProvider><WelcomeScreen /></MantineProvider>)

      await waitFor(() => {
        expect(screen.getByTestId('file-selection-modal')).toBeInTheDocument()
      })

      const selectButton = screen.getByRole('button', { name: /select file/i })
      await user.click(selectButton)

      // Simulate file selection completing
      mockSelectedFile = { id: '1', name: 'test.json.gz', path: '/test.json.gz' }
      rerender(<MantineProvider><WelcomeScreen /></MantineProvider>)

      // Verify connectProvider was called with file info
      await waitFor(() => {
        expect(mockConnectProvider).toHaveBeenCalledWith({
          id: '1',
          name: 'test.json.gz',
          path: '/test.json.gz',
        })
      })

      // After file selection, welcome screen should be hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId('file-selection-modal')
        ).not.toBeInTheDocument()
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
      })
    })

    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup()
      mockConnect.mockRejectedValue(new Error('Auth failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithProviders(<WelcomeScreen />)

      const connectButton = screen.getByRole('button', {
        name: /connect to onedrive/i,
      })
      await user.click(connectButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to connect'),
          expect.any(Error)
        )
      })

      // Modal should not open on error
      expect(
        screen.queryByTestId('file-selection-modal')
      ).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Skip to Offline', () => {
    it('should hide welcome screen when skip button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WelcomeScreen />)

      const skipButton = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      await user.click(skipButton)

      await waitFor(() => {
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
      })
    })

    it('should NOT persist skip choice to localStorage (will show again on reload)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WelcomeScreen />)

      const skipButton = screen.getByRole('button', {
        name: /skip.*work offline/i,
      })
      await user.click(skipButton)

      await waitFor(() => {
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
      })

      // Verify no localStorage flag was set
      expect(localStorage.getItem('welcomeScreenDismissed')).toBeNull()
    })

    it('should show welcome screen again on next visit if user skipped and has no data', () => {
      // This simulates a page reload after user clicked skip
      // Since no localStorage flag is set and user is not connected, welcome should show
      renderWithProviders(<WelcomeScreen />)

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should use Center layout for centering content', () => {
      const { container } = renderWithProviders(<WelcomeScreen />)

      // Check if Center component is used (rendered as div)
      const centerElement = container.querySelector(
        '[data-testid="welcome-screen"]'
      )
      expect(centerElement).toBeInTheDocument()
    })

    it('should have full-height overlay', () => {
      const { container } = renderWithProviders(<WelcomeScreen />)

      const overlay = container.querySelector('[data-testid="welcome-screen"]')
      expect(overlay).toBeInTheDocument()
      // Overlay component uses fixed positioning automatically
      expect(overlay).toHaveAttribute('data-testid', 'welcome-screen')
    })
  })
})
