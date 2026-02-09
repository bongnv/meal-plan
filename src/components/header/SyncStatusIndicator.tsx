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
 * Get tooltip label based on sync status
 */
function getTooltipLabel(status: SyncStatus, isConnected: boolean): string {
  if (!isConnected) return 'Not connected to cloud storage'

  switch (status) {
    case 'offline':
      return 'Not connected to cloud storage'
    case 'syncing':
      return 'Syncing...'
    case 'synced':
      return 'Synced successfully'
    case 'error':
      return 'Sync failed - Click to retry'
    case 'idle':
    default:
      return 'Click to sync now'
  }
}

/**
 * Get icon component based on sync status
 */
function getStatusIcon(status: SyncStatus, isConnected: boolean) {
  if (!isConnected) return <IconCloudOff size={20} />

  switch (status) {
    case 'offline':
      return <IconCloudOff size={20} />
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
    case 'offline':
      return 'gray'
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
  const { status, currentFile, syncNow, provider } = useSyncContext()

  const isConnected = provider !== null && currentFile !== null

  const handleClick = async () => {
    if (!isConnected || status === 'syncing') return

    try {
      await syncNow()
    } catch (error) {
      // Error is already handled in SyncContext
      console.error('Manual sync failed:', error)
    }
  }

  const isDisabled = !isConnected || status === 'syncing'
  const tooltipLabel = getTooltipLabel(status, isConnected)
  const statusColor = getStatusColor(status, isConnected)

  return (
    <Tooltip label={tooltipLabel} withArrow multiline w={200}>
      <ActionIcon
        variant="subtle"
        color={statusColor}
        size="lg"
        disabled={isDisabled}
        onClick={handleClick}
        aria-label="Sync status indicator"
        data-status={!isConnected ? 'offline' : status}
        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      >
        {getStatusIcon(status, isConnected)}
      </ActionIcon>
    </Tooltip>
  )
}
