import { ActionIcon, Loader, Tooltip } from '@mantine/core'
import {
  IconCloud,
  IconCloudCheck,
  IconCloudOff,
  IconCloudX,
} from '@tabler/icons-react'

import { useSyncContext } from '@/contexts/SyncContext'

import type { SyncStatus } from '@/contexts/SyncContext'

/**
 * Format relative time string (e.g., "5 minutes ago")
 */
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never synced'

  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

/**
 * Get tooltip label based on sync status
 */
function getTooltipLabel(
  status: SyncStatus,
  lastSyncTime: number | null,
  isConnected: boolean
): string {
  if (!isConnected) return 'Not connected to cloud storage'

  switch (status) {
    case 'syncing':
      return 'Syncing...'
    case 'synced':
      return `Synced successfully\n${formatRelativeTime(lastSyncTime)}`
    case 'error':
      return 'Sync failed - Click to retry'
    case 'idle':
    default:
      return `Last synced ${formatRelativeTime(lastSyncTime)}\nClick to sync now`
  }
}

/**
 * Get icon component based on sync status
 */
function getStatusIcon(status: SyncStatus, isConnected: boolean) {
  if (!isConnected) return <IconCloudOff size={20} />

  switch (status) {
    case 'syncing':
      return <Loader size={20} />
    case 'synced':
      return <IconCloudCheck size={20} />
    case 'error':
      return <IconCloudX size={20} />
    case 'idle':
    default:
      return <IconCloud size={20} />
  }
}

/**
 * Get color based on sync status
 */
function getStatusColor(status: SyncStatus, isConnected: boolean): string {
  if (!isConnected) return 'gray'

  switch (status) {
    case 'syncing':
      return 'blue'
    case 'synced':
      return 'green'
    case 'error':
      return 'red'
    case 'idle':
    default:
      return 'gray'
  }
}

/**
 * Sync status indicator component for the app header
 * Shows current sync state and allows manual sync trigger
 */
export function SyncStatusIndicator() {
  const { syncStatus, lastSyncTime, selectedFile, syncNow, isAuthenticated } =
    useSyncContext()

  const isConnected = isAuthenticated && selectedFile !== null

  const handleClick = async () => {
    if (!isConnected || syncStatus === 'syncing') return

    try {
      await syncNow()
    } catch (error) {
      // Error is already handled in SyncContext
      console.error('Manual sync failed:', error)
    }
  }

  const isDisabled = !isConnected || syncStatus === 'syncing'
  const tooltipLabel = getTooltipLabel(syncStatus, lastSyncTime, isConnected)
  const statusColor = getStatusColor(syncStatus, isConnected)

  return (
    <Tooltip label={tooltipLabel} withArrow multiline w={200}>
      <ActionIcon
        variant="subtle"
        color={statusColor}
        size="lg"
        disabled={isDisabled}
        onClick={handleClick}
        aria-label="Sync status indicator"
        data-status={!isConnected ? 'offline' : syncStatus}
        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      >
        {getStatusIcon(syncStatus, isConnected)}
      </ActionIcon>
    </Tooltip>
  )
}
