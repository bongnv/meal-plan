import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { CloudSyncSettings } from './CloudSyncSettings'
import { SyncProvider } from '../../contexts/SyncContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'
import type { FileInfo } from '../../contexts/SyncContext'

// Mock SyncContext
const mockConnectProvider = vi.fn()
const mockDisconnectProvider = vi.fn()
const mockReset = vi.fn()

vi.mock('../../contexts/SyncContext', async () => {
  const actual = await vi.importActual('../../contexts/SyncContext')
  return {
    ...actual,
    useSyncContext: () => ({
      connectedProvider: null,
      accountInfo: null,
      syncStatus: 'idle' as const,
      lastSyncTime: null,
      selectedFile: null,
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      reset: mockReset,
    }),
  }
})

describe('CloudSyncSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render connect button when not connected', () => {
    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByRole('button', { name: /connect to onedrive/i })).toBeInTheDocument()
  })

  it('should not show disconnect button when not connected', () => {
    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
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
    
    // Mock connected state
    vi.mocked(vi.importActual('../../contexts/SyncContext')).then((actual: any) => {
      actual.useSyncContext = () => ({
        connectedProvider: CloudProvider.ONEDRIVE,
        accountInfo: { name: 'John Doe', email: 'john@example.com' },
        syncStatus: 'idle' as const,
        lastSyncTime: Date.now() - 60000, // 1 minute ago
        selectedFile: mockFileInfo,
        connectProvider: mockConnectProvider,
        disconnectProvider: mockDisconnectProvider,
        reset: mockReset,
      })
    })
  })

  it('should display account information when connected', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example\.com/i)).toBeInTheDocument()
  })

  it('should display file information when connected', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByText(/meal-plan-data\.json\.gz/i)).toBeInTheDocument()
  })

  it('should display folder path when connected', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByText(/\/MealPlanner/i)).toBeInTheDocument()
  })

  it('should show disconnect button when connected', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
  })

  it('should call disconnectProvider when disconnect button clicked', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    const user = userEvent.setup()
    
    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
    await user.click(disconnectButton)

    await waitFor(() => {
      expect(mockDisconnectProvider).toHaveBeenCalledTimes(1)
    })
  })

  it('should show change file button when connected', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByRole('button', { name: /change file/i })).toBeInTheDocument()
  })

  it('should call disconnectProvider when change file button clicked', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    const user = userEvent.setup()
    
    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    const changeFileButton = screen.getByRole('button', { name: /change file/i })
    await user.click(changeFileButton)

    await waitFor(() => {
      expect(mockDisconnectProvider).toHaveBeenCalledTimes(1)
    })
  })

  it('should show reset button', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'idle' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('should disable controls when syncing', async () => {
    const { useSyncContext } = await import('../../contexts/SyncContext')
    vi.mocked(useSyncContext).mockReturnValue({
      connectedProvider: CloudProvider.ONEDRIVE,
      accountInfo: { name: 'John Doe', email: 'john@example.com' },
      syncStatus: 'syncing' as const,
      lastSyncTime: Date.now() - 60000,
      selectedFile: mockFileInfo,
      conflicts: [],
      connectProvider: mockConnectProvider,
      disconnectProvider: mockDisconnectProvider,
      syncNow: vi.fn(),
      resolveConflict: vi.fn(),
      reset: mockReset,
    })

    render(
      <SyncProvider>
        <CloudSyncSettings />
      </SyncProvider>
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /change file/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
  })
})
