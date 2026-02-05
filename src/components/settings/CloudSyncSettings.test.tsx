import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { SyncProvider } from '../../contexts/SyncContext'
import { createMockMsalInstance } from '../../test/mockMsal'
import { CloudProvider } from '../../utils/storage/CloudProvider'

import { CloudSyncSettings } from './CloudSyncSettings'

import type { FileInfo } from '../../utils/storage/ICloudStorageProvider'
import type { ReactNode } from 'react'

// Mock MSAL React
vi.mock('@azure/msal-react', () => ({
  MsalProvider: async ({ children }: { children: ReactNode }) => children,
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

// Mock FileSelectionModal
vi.mock('../sync/FileSelectionModal', () => ({
  FileSelectionModal: vi.fn(() => null),
}))

// Mock AppContext
vi.mock('../../contexts/AppContext', () => ({
  useAppContext: () => ({
    showWelcome: false,
    showFileSelection: false,
    showReconnectModal: false,
    setShowWelcome: vi.fn(),
    setShowFileSelection: vi.fn(),
    setShowReconnectModal: vi.fn(),
  }),
}))

// Create AllProviders wrapper
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const mockMsalInstance = createMockMsalInstance()

  return (
    <MantineProvider>
      <MemoryRouter>
        <SyncProvider msalInstance={mockMsalInstance}>{children}</SyncProvider>
      </MemoryRouter>
    </MantineProvider>
  )
}

// Mock SyncContext
const mockSelectFile = vi.fn()
const mockDisconnectAndReset = vi.fn()
const mockSyncNow = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockGetAccountInfo = vi
  .fn()
  .mockReturnValue({ name: 'John Doe', email: 'john@example.com' })

const mockSyncContextValue = {
  currentProvider: null as CloudProvider | null,
  isAuthenticated: false,
  syncStatus: 'idle' as 'idle' | 'syncing' | 'success' | 'error',
  lastSyncTime: null as number | null,
  selectedFile: null as FileInfo | null,
  isInitializing: false,
  needsReconnect: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  getAccountInfo: mockGetAccountInfo,
  uploadFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn().mockResolvedValue('{}'),
  listFoldersAndFiles: vi.fn().mockResolvedValue({ folders: [], files: [] }),
  selectFile: mockSelectFile,
  disconnectAndReset: mockDisconnectAndReset,
  syncNow: mockSyncNow,
  clearReconnectFlag: vi.fn(),
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
    mockSyncContextValue.isAuthenticated = false
    mockSyncContextValue.currentProvider = null
    mockSyncContextValue.syncStatus = 'idle'
    mockSyncContextValue.lastSyncTime = null
    mockSyncContextValue.selectedFile = null
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
    mockSyncContextValue.isAuthenticated = true
    mockSyncContextValue.currentProvider = CloudProvider.ONEDRIVE
    mockSyncContextValue.syncStatus = 'idle'
    mockSyncContextValue.lastSyncTime = Date.now() - 60000
    mockSyncContextValue.selectedFile = mockFileInfo
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
