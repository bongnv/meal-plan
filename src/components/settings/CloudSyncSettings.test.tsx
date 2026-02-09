import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { SyncProvider } from '@/contexts/SyncContext'
import { createMockMsalInstance } from '@/test/mockMsal'

import { CloudSyncSettings } from './CloudSyncSettings'

import type { FileInfo } from '@/utils/storage/ICloudStorageProvider'
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
const mockGetAccountInfo = vi
  .fn()
  .mockReturnValue({ name: 'John Doe', email: 'john@example.com' })

const mockSyncContextValue = {
  provider: null as any,
  currentFile: null as FileInfo | null,
  status: 'idle' as 'offline' | 'idle' | 'syncing' | 'synced' | 'error',
  connect: mockConnect,
  getAccountInfo: mockGetAccountInfo,
  selectFile: mockSelectFile,
  disconnectAndReset: mockDisconnectAndReset,
  syncNow: mockSyncNow,
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
    mockSyncContextValue.provider = null
    mockSyncContextValue.status = 'idle'
    mockSyncContextValue.currentFile = null
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
    mockSyncContextValue.provider = {
      isAuthenticated: () => true,
      authenticate: vi.fn(),
      getAccountInfo: () => ({ name: 'John Doe', email: 'john@example.com' }),
      listFoldersAndFiles: vi.fn(),
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
    } as any
    mockSyncContextValue.status = 'idle'
    mockSyncContextValue.currentFile = mockFileInfo
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
    mockSyncContextValue.status = 'syncing'

    render(
      <AllProviders>
        <CloudSyncSettings />
      </AllProviders>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDisabled()
  })
})
