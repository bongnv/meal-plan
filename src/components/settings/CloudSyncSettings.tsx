import {
  Button,
  Stack,
  Text,
  Group,
  Badge,
  Paper,
  Title,
  Alert,
  Container,
} from '@mantine/core'
import { IconCloud, IconCloudOff } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

import { useSyncContext } from '@/contexts/SyncContext'
import { CloudProvider } from '@/utils/storage/CloudProvider'

/**
 * Cloud Storage Sync Settings component
 *
 * Cloud-first design: encourages users to sync with OneDrive.
 * Displays cloud storage connection status and allows user to:
 * - Connect to OneDrive
 * - View connected account and file information
 * - Change selected file (switches to different dataset)
 */
export function CloudSyncSettings() {
  const { currentFile, status, disconnectAndReset, getAccountInfo, connect } =
    useSyncContext()

  const navigate = useNavigate()

  const isSyncing = status === 'syncing'

  // Get account info (returns null if not authenticated)
  const accountInfo = getAccountInfo()

  /**
   * Handle connect to OneDrive
   */
  const handleConnect = async () => {
    try {
      // Authenticate - will trigger modal to show
      await connect(CloudProvider.ONEDRIVE)
    } catch (error) {
      console.error('Authentication failed:', error)
    }
  }

  /**
   * Handle disconnect
   * Disconnects from cloud and navigates to home page where welcome screen will show
   */
  const handleDisconnect = async () => {
    try {
      // Disconnect from cloud and clear all local data
      await disconnectAndReset()

      // Navigate to home page where welcome screen will show
      void navigate('/')
    } catch (error) {
      console.error('[CloudSyncSettings] Failed to disconnect:', error)
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

        {currentFile === null && (
          <Alert
            icon={<IconCloudOff size={16} />}
            title="Not Connected"
            color="gray"
          >
            Connect to OneDrive to automatically sync your data across devices.
          </Alert>
        )}

        {currentFile === null ? (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Choose a cloud storage provider to sync your recipes, meal
                plans, and ingredients.
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
                  <Text fw={500}>Connected to OneDrive</Text>
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
              </Stack>
            </Paper>

            {currentFile && (
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Text fw={500} size="sm">
                    Sync File
                  </Text>

                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text size="sm">{currentFile.name}</Text>
                    </Group>

                    <Text size="xs" c="dimmed">
                      Folder: {getFolderPath(currentFile.path)}
                    </Text>
                  </Stack>

                  <Button
                    variant="light"
                    color="red"
                    onClick={handleDisconnect}
                    disabled={isSyncing}
                    size="xs"
                  >
                    Disconnect
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}

        {isSyncing && (
          <Alert icon={<IconCloud size={16} />} title="Syncing..." color="blue">
            Sync in progress. Please wait...
          </Alert>
        )}

        {currentFile !== null && (
          <Text size="xs" c="dimmed">
            Note: Auto-sync is enabled. Your changes are automatically synced to
            the cloud.
          </Text>
        )}

        {currentFile === null && (
          <Text size="xs" c="dimmed">
            Connect to OneDrive to sync your data across devices and prevent
            data loss.
          </Text>
        )}
      </Stack>
    </Container>
  )
}
