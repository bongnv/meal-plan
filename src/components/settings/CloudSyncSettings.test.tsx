import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GroceryListProvider } from '../../contexts/GroceryListContext'
import { IngredientProvider } from '../../contexts/IngredientContext'
import { MealPlanProvider } from '../../contexts/MealPlanContext'
import { RecipeProvider } from '../../contexts/RecipeContext'
import { SyncProvider } from '../../contexts/SyncContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'

import { CloudSyncSettings } from './CloudSyncSettings'

import type { FileInfo } from '../../utils/storage/ICloudStorageProvider'
import type { ReactNode } from 'react'

// Mock MSAL React
vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => children,
  useMsal: () => ({
    instance: {
      getAllAccounts: vi.fn(() => []),
      loginPopup: vi.fn(),
      logoutPopup: vi.fn(),
      acquireTokenSilent: vi.fn(),
    },
    inProgress: 'none',
  }),
}))

// Mock CloudStorageContext - now provides methods directly
const mockCloudStorage = {
  currentProvider: null as CloudProvider | null,
  isAuthenticated: false,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  getAccountInfo: vi
    .fn()
    .mockReturnValue({ name: 'John Doe', email: 'john@example.com' }),
  uploadFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn().mockResolvedValue('{}'),
  listFoldersAndFiles: vi.fn().mockResolvedValue({ folders: [], files: [] }),
}

vi.mock('../../contexts/CloudStorageContext', () => ({
  CloudStorageProvider: ({ children }: { children: ReactNode }) => children,
  useCloudStorage: () => mockCloudStorage,
}))

// Mock FileSelectionModal
vi.mock('../sync/FileSelectionModal', () => ({
  FileSelectionModal: vi.fn(() => null),
}))

// Create AllProviders wrapper
const AllProviders = ({ children }: { children: ReactNode }) => (
  <MantineProvider>
    <MemoryRouter>
      <RecipeProvider>
        <MealPlanProvider>
          <IngredientProvider>
            <GroceryListProvider>
              <SyncProvider>{children}</SyncProvider>
            </GroceryListProvider>
          </IngredientProvider>
        </MealPlanProvider>
      </RecipeProvider>
    </MemoryRouter>
  </MantineProvider>
)

// Mock SyncContext
const mockConnectProvider = vi.fn()
const mockDisconnectAndReset = vi.fn()
const mockSyncNow = vi.fn()
const mockImportFromRemote = vi.fn()
const mockUploadToRemote = vi.fn()
const mockResolveConflict = vi.fn()
const mockHasSelectedFile = vi.fn(() => false)

let mockSyncContextValue = {
  syncStatus: 'idle' as 'idle' | 'syncing' | 'success' | 'error',
  lastSyncTime: null as number | null,
  selectedFile: null as FileInfo | null,
  conflicts: [],
  connectProvider: mockConnectProvider,
  disconnectAndReset: mockDisconnectAndReset,
  syncNow: mockSyncNow,
  importFromRemote: mockImportFromRemote,
  uploadToRemote: mockUploadToRemote,
  resolveConflict: mockResolveConflict,
  hasSelectedFile: mockHasSelectedFile,
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
    mockCloudStorage.isAuthenticated = false
    mockCloudStorage.currentProvider = null
    mockSyncContextValue = {
      syncStatus: 'idle' as const,
      lastSyncTime: null,
      selectedFile: null,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectAndReset: mockDisconnectAndReset,
      syncNow: mockSyncNow,
      importFromRemote: mockImportFromRemote,
      uploadToRemote: mockUploadToRemote,
      resolveConflict: mockResolveConflict,
      hasSelectedFile: mockHasSelectedFile,
    }
  })

  it('should render connect button when not connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(
      screen.getByRole('button', { name: /connect to onedrive/i })
    ).toBeInTheDocument()
  })

  it('should not show disconnect button when not connected', () => {
    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    // Disconnect button only shows when connected
    expect(
      screen.queryByRole('button', { name: /disconnect/i })
    ).not.toBeInTheDocument()
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
    mockCloudStorage.isAuthenticated = true
    mockCloudStorage.currentProvider = CloudProvider.ONEDRIVE
    mockSyncContextValue = {
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectAndReset: mockDisconnectAndReset,
      syncNow: mockSyncNow,
      importFromRemote: mockImportFromRemote,
      uploadToRemote: mockUploadToRemote,
      resolveConflict: mockResolveConflict,
      hasSelectedFile: mockHasSelectedFile,
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

    expect(
      screen.getByRole('button', { name: /disconnect/i })
    ).toBeInTheDocument()
  })

  it('should disconnect and reset state when disconnect button clicked', async () => {
    const user = userEvent.setup()

    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    const disconnectButton = screen.getByRole('button', {
      name: /disconnect/i,
    })

    await user.click(disconnectButton)

    // Verify disconnectAndReset was called (which handles both disconnect and reset)
    await waitFor(() => {
      expect(mockDisconnectAndReset).toHaveBeenCalledTimes(1)
    })
  })

  it('should disable controls when syncing', () => {
    mockSyncContextValue.syncStatus = 'syncing'

    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDisabled()
  })
})
