import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { CloudSyncSettings } from './CloudSyncSettings'
import { SyncProvider } from '../../contexts/SyncContext'
import { RecipeProvider } from '../../contexts/RecipeContext'
import { MealPlanProvider } from '../../contexts/MealPlanContext'
import { IngredientProvider } from '../../contexts/IngredientContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'
import type { FileInfo } from '../../utils/storage/ICloudStorageProvider'

// Create AllProviders wrapper
const AllProviders = ({ children }: { children: ReactNode }) => (
  <MantineProvider>
    <RecipeProvider>
      <MealPlanProvider>
        <IngredientProvider>
          <SyncProvider>{children}</SyncProvider>
        </IngredientProvider>
      </MealPlanProvider>
    </RecipeProvider>
  </MantineProvider>
)

// Mock SyncContext
const mockConnectProvider = vi.fn()
const mockDisconnectProvider = vi.fn()
const mockSyncNow = vi.fn()
const mockImportFromRemote = vi.fn()
const mockUploadToRemote = vi.fn()
const mockResolveConflict = vi.fn()
const mockReset = vi.fn()

let mockSyncContextValue = {
  connectedProvider: null as CloudProvider | null,
  accountInfo: null as { name: string; email: string } | null,
  syncStatus: 'idle' as const,
  lastSyncTime: null as number | null,
  selectedFile: null as FileInfo | null,
  conflicts: [],
  connectProvider: mockConnectProvider,
  disconnectProvider: mockDisconnectProvider,
  syncNow: mockSyncNow,
  importFromRemote: mockImportFromRemote,
  uploadToRemote: mockUploadToRemote,
  resolveConflict: mockResolveConflict,
  reset: mockReset,
}

vi.mock('../../contexts/SyncContext', async () => {
  const actual = await vi.importActual('../../contexts/SyncContext')
  return {
    ...actual,
    useSyncContext: () => mockSyncContextValue,
  }
})

describe('CloudSyncSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to disconnected state
    mockSyncContextValue = {
      connectedProvider: null,
      accountInfo: null,
      syncStatus: 'idle' as const,
      lastSyncTime: null,
      selectedFile: null,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: mockSyncNow,
      importFromRemote: mockImportFromRemote,
      uploadToRemote: mockUploadToRemote,
      resolveConflict: mockResolveConflict,
      reset: mockReset,
    }
  })

  it('should render connect button when not connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /connect to onedrive/i })).toBeInTheDocument()
  })

  it('should not show disconnect button when not connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument()
  })
})

describe('CloudSyncSettings - Connected State', () => {
  const mockFileInfo: FileInfo = {
    id: 'file-123',
    name: 'meal-plan-data.json.gz',
    path: '/MealPlanner/meal-plan-data.json.gz',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set to connected state
    mockSyncContextValue = {
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: mockSyncNow,
      importFromRemote: mockImportFromRemote,
      uploadToRemote: mockUploadToRemote,
      resolveConflict: mockResolveConflict,
      reset: mockReset,
    }
  })

  it('should display account information when connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example\.com/i)).toBeInTheDocument()
  })

  it('should display file information when connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByText(/meal-plan-data\.json\.gz/i)).toBeInTheDocument()
  })

  it('should display folder path when connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByText(/\/MealPlanner/i)).toBeInTheDocument()
  })

  it('should show disconnect button when connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
  })

  it('should call disconnectProvider when disconnect button clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
    await user.click(disconnectButton)

    await waitFor(() => {
      expect(mockDisconnectProvider).toHaveBeenCalledTimes(1)
    })
  })

  it('should show change file button when connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /change file/i })).toBeInTheDocument()
  })

  it('should call disconnectProvider when change file button clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    const changeFileButton = screen.getByRole('button', { name: /change file/i })
    await user.click(changeFileButton)

    await waitFor(() => {
      expect(mockDisconnectProvider).toHaveBeenCalledTimes(1)
    })
  })

  it('should show reset button', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('should disable controls when syncing', () => {
    mockSyncContextValue.syncStatus = 'syncing'
    
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /change file/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
  })
})

