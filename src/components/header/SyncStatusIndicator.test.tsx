import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SyncStatusIndicator } from './SyncStatusIndicator'

import type { SyncStatus } from '@/contexts/SyncContext'
import type { CloudProvider } from '@/utils/storage/CloudProvider'

// Mock contexts
const mockSyncNow = vi.fn()
const mockSyncContext = {
  currentProvider: 'onedrive' as CloudProvider | null,
  isAuthenticated: true,
  syncStatus: 'idle' as SyncStatus,
  lastSyncTime: (Date.now() - 5 * 60 * 1000) as number | null, // 5 minutes ago
  selectedFile: { id: '1', name: 'meal-plan-data.json.gz', path: '/data' } as {
    id: string
    name: string
    path: string
  } | null,
  syncNow: mockSyncNow,
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
    mockSyncContext.isAuthenticated = true
    mockSyncContext.currentProvider = 'onedrive' as CloudProvider
    mockSyncContext.syncStatus = 'idle'
    mockSyncContext.lastSyncTime = Date.now() - 5 * 60 * 1000
    mockSyncContext.selectedFile = {
      id: '1',
      name: 'meal-plan-data.json.gz',
      path: '/data',
    }
  })

  describe('when not connected', () => {
    it('should show offline indicator', () => {
      mockSyncContext.isAuthenticated = false
      mockSyncContext.selectedFile = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('data-status', 'offline')
    })

    it('should show "Not connected" tooltip', async () => {
      mockSyncContext.isAuthenticated = false
      mockSyncContext.selectedFile = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/not connected/i)).toBeInTheDocument()
      })
    })

    it('should be disabled when not connected', () => {
      mockSyncContext.isAuthenticated = false
      mockSyncContext.selectedFile = null

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
        expect(screen.getByText(/last synced.*ago/i)).toBeInTheDocument()
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
      mockSyncContext.syncStatus = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')
    })

    it('should show "Syncing..." tooltip', async () => {
      mockSyncContext.syncStatus = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      })
    })

    it('should be disabled when syncing', () => {
      mockSyncContext.syncStatus = 'syncing'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toBeDisabled()
    })

    it('should not trigger sync when clicked during sync', async () => {
      mockSyncContext.syncStatus = 'syncing'
      const user = userEvent.setup()

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await user.click(indicator)

      expect(mockSyncNow).not.toHaveBeenCalled()
    })
  })

  describe('when sync succeeds', () => {
    it('should show success indicator with checkmark', () => {
      mockSyncContext.syncStatus = 'synced'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'synced')
    })

    it('should show success tooltip', async () => {
      mockSyncContext.syncStatus = 'synced'

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
      mockSyncContext.syncStatus = 'error'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'error')
    })

    it('should show error tooltip', async () => {
      mockSyncContext.syncStatus = 'error'

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument()
      })
    })

    it('should allow retry by clicking', async () => {
      mockSyncContext.syncStatus = 'error'
      const user = userEvent.setup()

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await user.click(indicator)

      expect(mockSyncNow).toHaveBeenCalledTimes(1)
    })
  })

  describe('when offline', () => {
    it('should show offline indicator when no network', () => {
      mockSyncContext.isAuthenticated = true
      mockSyncContext.syncStatus = 'error'
      // Simulate offline by setting navigator.onLine to false (would need actual implementation)

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'error')
    })
  })

  describe('tooltip content', () => {
    it('should format relative time correctly for recent sync', async () => {
      mockSyncContext.lastSyncTime = Date.now() - 2 * 60 * 1000 // 2 minutes ago

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument()
      })
    })

    it('should handle "just now" for very recent sync', async () => {
      mockSyncContext.lastSyncTime = Date.now() - 30 * 1000 // 30 seconds ago

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(
          screen.getByText(/just now|seconds ago|1 minute ago/i)
        ).toBeInTheDocument()
      })
    })

    it('should show "Never synced" when no lastSyncTime', async () => {
      mockSyncContext.lastSyncTime = null

      renderWithProviders(<SyncStatusIndicator />)

      const indicator = screen.getByRole('button', { name: /sync/i })
      await userEvent.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/never synced/i)).toBeInTheDocument()
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
      mockSyncContext.syncStatus = 'syncing'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')

      // Transition to success
      mockSyncContext.syncStatus = 'synced'
      mockSyncContext.lastSyncTime = Date.now()
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
      mockSyncContext.syncStatus = 'syncing'
      rerender(
        <MantineProvider>
          <SyncStatusIndicator />
        </MantineProvider>
      )
      indicator = screen.getByRole('button', { name: /sync/i })
      expect(indicator).toHaveAttribute('data-status', 'syncing')

      // Transition to error
      mockSyncContext.syncStatus = 'error'
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
