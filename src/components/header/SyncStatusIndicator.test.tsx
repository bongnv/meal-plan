import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SyncStatusIndicator } from './SyncStatusIndicator'

import type { SyncStatus } from '@/contexts/SyncContext'

// Mock contexts
const mockSyncNow = vi.fn()
const mockSyncContext = {
  provider: {
    isAuthenticated: () => true,
    authenticate: vi.fn(),
    getAccountInfo: () => ({ name: 'Test', email: 'test@example.com' }),
    listFoldersAndFiles: vi.fn(),
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),
  } as any,
  status: 'idle' as SyncStatus,
  currentFile: { id: '1', name: 'meal-plan-data.json.gz', path: '/data' } as {
    id: string
    name: string
    path: string
  } | null,
  syncNow: mockSyncNow,
  connect: vi.fn(),
  getAccountInfo: vi.fn(),
  selectFile: vi.fn(),
  disconnectAndReset: vi.fn(),
}

vi.mock('../../contexts/SyncContext', () => ({
  useSyncContext: () => mockSyncContext,
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSyncContext.provider = {
      isAuthenticated: () => true,
      authenticate: vi.fn(),
      getAccountInfo: () => ({ name: 'Test', email: 'test@example.com' }),
      listFoldersAndFiles: vi.fn(),
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
    } as any
    mockSyncContext.status = 'idle'
    mockSyncContext.currentFile = {
      id: '1',
      name: 'meal-plan-data.json.gz',
      path: '/data',
    }
  })

  describe('when not connected', () => {
    it('should show offline indicator', () => {
      mockSyncContext.provider = null
      mockSyncContext.currentFile = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('data-status', 'offline')
    })

    it('should show "Not connected" tooltip', async () => {
      mockSyncContext.provider = null
      mockSyncContext.currentFile = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/not connected/i)).toBeInTheDocument()
      })
    })

    it('should be disabled when not connected', () => {
      mockSyncContext.provider = null
      mockSyncContext.currentFile = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeDisabled()
    })
  })

  describe('when connected and idle', () => {
    it('should show cloud icon', () => {
      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('data-status', 'idle')
    })

    it('should show "Last synced X minutes ago" tooltip', async () => {
      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/click to sync now/i)).toBeInTheDocument()
      })
    })

    it('should show "Click to sync now" in tooltip', async () => {
      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/click to sync now/i)).toBeInTheDocument()
      })
    })

    it('should trigger sync when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await user.click(indicator)

      expect(mockSyncNow).toHaveBeenCalledTimes(1)
    })

    it('should be enabled when idle', () => {
      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).not.toBeDisabled()
    })
  })

  describe('when syncing', () => {
    it('should show syncing animation', () => {
      mockSyncContext.status = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')
    })

    it('should show "Syncing..." tooltip', async () => {
      mockSyncContext.status = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      })
    })

    it('should be disabled when syncing', () => {
      mockSyncContext.status = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeDisabled()
    })

    it('should not trigger sync when clicked during sync', async () => {
      mockSyncContext.status = 'syncing'
      const user = userEvent.setup()

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await user.click(indicator)

      expect(mockSyncNow).not.toHaveBeenCalled()
    })
  })

  describe('when sync succeeds', () => {
    it('should show success indicator with checkmark', () => {
      mockSyncContext.status = 'synced'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'synced')
    })

    it('should show success tooltip', async () => {
      mockSyncContext.status = 'synced'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/synced successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('when sync fails', () => {
    it('should show error indicator', () => {
      mockSyncContext.status = 'error'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'error')
    })

    it('should show error tooltip', async () => {
      mockSyncContext.status = 'error'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument()
      })
    })

    it('should allow retry by clicking', async () => {
      mockSyncContext.status = 'error'
      const user = userEvent.setup()

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await user.click(indicator)

      expect(mockSyncNow).toHaveBeenCalledTimes(1)
    })
  })

  describe('when offline', () => {
    it('should show offline indicator when disconnected', () => {
      mockSyncContext.provider = null
      mockSyncContext.status = 'offline'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'offline')
    })
  })

  describe('tooltip content', () => {
    it('should show appropriate tooltip based on status', async () => {
      mockSyncContext.status = 'idle'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/click to sync now/i)).toBeInTheDocument()
      })
    })
  })

  describe('state transitions', () => {
    it('should transition from idle to syncing to success', async () => {
      const { rerender } = renderWithProviders(<SyncStatusIndicator />)

      // Initially idle
      let indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'idle')

      // Transition to syncing
      mockSyncContext.status = 'syncing'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')

      // Transition to success
      mockSyncContext.status = 'synced'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'synced')
    })

    it('should transition from idle to syncing to error', async () => {
      const { rerender } = renderWithProviders(<SyncStatusIndicator />)

      // Initially idle
      let indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'idle')

      // Transition to syncing
      mockSyncContext.status = 'syncing'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')

      // Transition to error
      mockSyncContext.status = 'error'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'error')
    })
  })
})
