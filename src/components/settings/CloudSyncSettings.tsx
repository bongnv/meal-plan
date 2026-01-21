import { Button, Stack, Text, Group, Badge, Paper, Title, Alert, Container } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconCloud, IconCloudOff, IconAlertCircle } from '@tabler/icons-react'
import { useSyncContext } from '../../contexts/SyncContext'

/**
 * Cloud Storage Sync Settings component
 * 
 * Displays cloud storage connection status and allows user to:
 * - Connect to cloud storage providers
 * - View connected account and file information
 * - Disconnect from provider
 * - Change selected file
 * - Reset all data
 */
export function CloudSyncSettings() {
  const {
    connectedProvider,
    accountInfo,
    selectedFile,
    lastSyncTime,
    syncStatus,
    disconnectProvider,
    reset,
  } = useSyncContext()

  const isConnected = connectedProvider !== null
  const isSyncing = syncStatus === 'syncing'

  /**
   * Handle connect to OneDrive
   * Opens FileSelectionModal (to be implemented in I3.4.1)
   */
  const handleConnect = () => {
    // TODO: Open FileSelectionModal for authentication and file selection
    // This will be implemented in I3.4.1
    console.log('Connect to OneDrive - FileSelectionModal to be implemented')
  }

  /**
   * Handle disconnect from provider
   */
  const handleDisconnect = async () => {
    await disconnectProvider()
  }

  /**
   * Handle change file
   * Disconnects then reopens FileSelectionModal
   */
  const handleChangeFile = async () => {
    await disconnectProvider()
    // TODO: Open FileSelectionModal
    // This will be implemented in I3.4.1
    console.log('Change file - FileSelectionModal to be implemented')
  }

  /**
   * Handle reset all data with confirmation
   */
  const handleReset = () => {
    modals.openConfirmModal({
      title: 'Reset All Data',
      children: (
        <Text size="sm">
          This will disconnect from cloud storage and clear all local data including recipes, meal
          plans, and ingredients. This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await reset()
      },
    })
  }

  /**
   * Format last sync time
   */
  const formatLastSyncTime = (timestamp: number | null): string => {
    if (!timestamp) {
      return 'Never'
    }

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) {
      return 'Just now'
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  /**
   * Extract folder path from file path
   */
  const getFolderPath = (filePath: string): string => {
    const lastSlash = filePath.lastIndexOf('/')
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : '/'
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={2}>Cloud Storage Sync</Title>

      {!isConnected && (
        <Alert icon={<IconCloudOff size={16} />} title="Not Connected" color="gray">
          Connect to OneDrive to automatically sync your data across devices.
        </Alert>
      )}

      {!isConnected ? (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Choose a cloud storage provider to sync your recipes, meal plans, and ingredients.
            </Text>
            <Button
              leftSection={<IconCloud size={16} />}
              onClick={handleConnect}
              disabled={isSyncing}
            >
              Connect to OneDrive
            </Button>
            <Text size="xs" c="dimmed">
              Google Drive and Dropbox support coming soon
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="apart">
                <Text fw={500}>Connected to {connectedProvider}</Text>
                <Badge color="green" variant="light">
                  Active
                </Badge>
              </Group>

              {accountInfo && (
                <Stack gap={4}>
                  <Text size="sm" fw={500}>
                    {accountInfo.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {accountInfo.email}
                  </Text>
                </Stack>
              )}

              <Group gap="xs">
                <Button
                  variant="light"
                  onClick={handleDisconnect}
                  disabled={isSyncing}
                  size="xs"
                >
                  Disconnect
                </Button>
              </Group>
            </Stack>
          </Paper>

          {selectedFile && (
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <Text fw={500} size="sm">
                  Sync File
                </Text>

                <Stack gap={4}>
                  <Group gap="xs">
                    <Text size="sm">{selectedFile.name}</Text>
                  </Group>

                  <Text size="xs" c="dimmed">
                    Folder: {getFolderPath(selectedFile.path)}
                  </Text>

                  <Text size="xs" c="dimmed">
                    Last synced: {formatLastSyncTime(lastSyncTime)}
                  </Text>
                </Stack>

                <Group gap="xs">
                  <Button variant="light" onClick={handleChangeFile} disabled={isSyncing} size="xs">
                    Change File
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group gap="xs">
                <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
                <Text fw={500} size="sm" c="red">
                  Danger Zone
                </Text>
              </Group>

              <Text size="xs" c="dimmed">
                Reset all data and disconnect from cloud storage. This action cannot be undone.
              </Text>

              <Group gap="xs">
                <Button variant="light" color="red" onClick={handleReset} disabled={isSyncing} size="xs">
                  Reset
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      )}

      {isSyncing && (
        <Alert icon={<IconCloud size={16} />} title="Syncing..." color="blue">
          Sync in progress. Please wait...
        </Alert>
      )}

      <Text size="xs" c="dimmed">
        Note: Auto-sync is enabled when connected. Changes are automatically synced to the cloud.
      </Text>
      </Stack>
    </Container>
  )
}
