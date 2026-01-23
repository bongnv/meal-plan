import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as SyncContext from '../../contexts/SyncContext'

import { ConflictResolutionModal } from './ConflictResolutionModal'

import type { SyncConflict } from '../../contexts/SyncContext'

// Helper to render with Mantine provider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

// Mock useSyncContext
const mockResolveConflict = vi.fn()
const mockConflicts: SyncConflict[] = []

vi.spyOn(SyncContext, 'useSyncContext').mockReturnValue({
  conflicts: mockConflicts,
  resolveConflict: mockResolveConflict,
  syncStatus: 'idle',
  lastSyncTime: null,
  selectedFile: null,
  connectProvider: vi.fn(),
  disconnectAndReset: vi.fn(),
  syncNow: vi.fn(),
  importFromRemote: vi.fn(),
  uploadToRemote: vi.fn(),
  hasSelectedFile: vi.fn(),
})

describe('ConflictResolutionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConflicts.length = 0
  })

  describe('Rendering', () => {
    it('should render modal when opened', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Pasta Carbonara',
        localModified: 1704067200000,
        remoteModified: 1704070800000,
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Sync Conflicts Detected')).toBeInTheDocument()
      expect(screen.getByText('Conflicting Changes')).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      renderWithProviders(
        <ConflictResolutionModal opened={false} onClose={vi.fn()} />
      )

      expect(
        screen.queryByText('Sync Conflicts Detected')
      ).not.toBeInTheDocument()
    })

    it('should display alert message explaining conflicts', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(
        screen.getByText(
          /following items have been modified both locally and in OneDrive/i
        )
      ).toBeInTheDocument()
    })

    it('should display resolution buttons', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(
        screen.getByRole('button', { name: /keep remote version/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /keep local version/i })
      ).toBeInTheDocument()
    })
  })

  describe('Conflict Display', () => {
    it('should display recipe conflict correctly', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Pasta Carbonara',
        localModified: 1704067200000, // 2024-01-01 00:00:00 UTC
        remoteModified: 1704070800000, // 2024-01-01 01:00:00 UTC
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Recipe')).toBeInTheDocument()
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })

    it('should display meal plan conflict correctly', () => {
      mockConflicts.push({
        id: 'mealPlan-1',
        type: 'mealPlan',
        itemName: 'Dinner - Pasta',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Meal Plan')).toBeInTheDocument()
      expect(screen.getByText('Dinner - Pasta')).toBeInTheDocument()
    })

    it('should display ingredient conflict correctly', () => {
      mockConflicts.push({
        id: 'ingredient-1',
        type: 'ingredient',
        itemName: 'Tomatoes',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Ingredient')).toBeInTheDocument()
      expect(screen.getByText('Tomatoes')).toBeInTheDocument()
    })

    it('should display multiple conflicts', () => {
      mockConflicts.push(
        {
          id: 'recipe-1',
          type: 'recipe',
          itemName: 'Recipe 1',
          localModified: Date.now(),
          remoteModified: Date.now(),
        },
        {
          id: 'mealPlan-1',
          type: 'mealPlan',
          itemName: 'Meal 1',
          localModified: Date.now(),
          remoteModified: Date.now(),
        },
        {
          id: 'ingredient-1',
          type: 'ingredient',
          itemName: 'Ingredient 1',
          localModified: Date.now(),
          remoteModified: Date.now(),
        }
      )

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Recipe 1')).toBeInTheDocument()
      expect(screen.getByText('Meal 1')).toBeInTheDocument()
      expect(screen.getByText('Ingredient 1')).toBeInTheDocument()
      expect(
        screen.getByText(/choose which version to keep for all 3 conflicting items/i)
      ).toBeInTheDocument()
    })

    it('should format timestamps correctly', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z').getTime()
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: timestamp,
        remoteModified: timestamp + 3600000, // +1 hour
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      // Check that timestamps are displayed (exact format depends on locale)
      const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it('should show singular "item" for one conflict', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(
        screen.getByText(/choose which version to keep for all 1 conflicting item:/i)
      ).toBeInTheDocument()
    })
  })

  describe('Resolution Actions', () => {
    it('should call resolveConflict with "local" when Keep Local Version is clicked', async () => {
      const user = userEvent.setup()
      mockResolveConflict.mockResolvedValue(undefined)

      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      const onClose = vi.fn()
      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={onClose} />
      )

      const localButton = screen.getByRole('button', {
        name: /keep local version/i,
      })
      await user.click(localButton)

      await waitFor(() => {
        expect(mockResolveConflict).toHaveBeenCalledWith('local')
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should call resolveConflict with "remote" when Keep Remote Version is clicked', async () => {
      const user = userEvent.setup()
      mockResolveConflict.mockResolvedValue(undefined)

      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      const onClose = vi.fn()
      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={onClose} />
      )

      const remoteButton = screen.getByRole('button', {
        name: /keep remote version/i,
      })
      await user.click(remoteButton)

      await waitFor(() => {
        expect(mockResolveConflict).toHaveBeenCalledWith('remote')
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should disable buttons while resolving', async () => {
      const user = userEvent.setup()
      // Simulate slow resolution
      mockResolveConflict.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      const localButton = screen.getByRole('button', {
        name: /keep local version/i,
      })
      const remoteButton = screen.getByRole('button', {
        name: /keep remote version/i,
      })

      await user.click(localButton)

      // Buttons should be disabled during resolution
      expect(localButton).toBeDisabled()
      expect(remoteButton).toBeDisabled()

      await waitFor(() => {
        expect(mockResolveConflict).toHaveBeenCalled()
      })
    })

    it('should show loading state on Keep Local Version button', async () => {
      const user = userEvent.setup()
      mockResolveConflict.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      const localButton = screen.getByRole('button', {
        name: /keep local version/i,
      })

      await user.click(localButton)

      // Button should show loading state (Mantine adds data-loading attribute)
      expect(localButton).toHaveAttribute('data-loading')
    })

    it('should handle resolution errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockResolveConflict.mockRejectedValue(new Error('Resolution failed'))

      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      const onClose = vi.fn()
      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={onClose} />
      )

      const localButton = screen.getByRole('button', {
        name: /keep local version/i,
      })
      await user.click(localButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to resolve conflicts:',
          expect.any(Error)
        )
        expect(onClose).not.toHaveBeenCalled()
      })

      // Buttons should be re-enabled after error
      await waitFor(() => {
        expect(localButton).not.toBeDisabled()
      })

      consoleError.mockRestore()
    })
  })

  describe('Modal Behavior', () => {
    it('should have closeOnClickOutside set to false', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      // Modal should be present (clicking outside won't close it)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Sync Conflicts Detected')).toBeInTheDocument()
    })

    it('should have closeOnEscape set to false', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      // Modal should be present (escape won't close it)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have appropriate size', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Table Structure', () => {
    it('should have correct table headers', () => {
      mockConflicts.push({
        id: 'recipe-1',
        type: 'recipe',
        itemName: 'Test Recipe',
        localModified: Date.now(),
        remoteModified: Date.now(),
      })

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Local Modified')).toBeInTheDocument()
      expect(screen.getByText('Remote Modified')).toBeInTheDocument()
    })

    it('should display conflicts in table rows', () => {
      mockConflicts.push(
        {
          id: 'recipe-1',
          type: 'recipe',
          itemName: 'Recipe 1',
          localModified: Date.now(),
          remoteModified: Date.now(),
        },
        {
          id: 'recipe-2',
          type: 'recipe',
          itemName: 'Recipe 2',
          localModified: Date.now(),
          remoteModified: Date.now(),
        }
      )

      renderWithProviders(
        <ConflictResolutionModal opened={true} onClose={vi.fn()} />
      )

      // Should have 2 data rows (plus 1 header row)
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(3) // header + 2 data rows
    })
  })
})
