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
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCloudStorage } from '../../contexts/CloudStorageContext'
import { useSyncContext } from '../../contexts/SyncContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'
import { FileSelectionModal } from '../sync/FileSelectionModal'

import type { FileInfo } from '../../utils/storage/ICloudStorageProvider'

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
  const {
    selectedFile,
    lastSyncTime,
    syncStatus,
    connectProvider,
    disconnectAndReset,
  } = useSyncContext()

  // Get cloud storage context (for provider and account info)
  const cloudStorage = useCloudStorage()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)

  // User is "connected" only when both authenticated AND has a file selected
  const isConnected = cloudStorage.isAuthenticated && selectedFile !== null
  const isSyncing = syncStatus === 'syncing'

  // Get account info only when authenticated
  const accountInfo = cloudStorage.isAuthenticated
    ? cloudStorage.getAccountInfo()
    : null

  // Auto-open file selection modal after authentication (e.g., after OAuth redirect)
  useEffect(() => {
    if (
      cloudStorage.isAuthenticated &&
      !selectedFile &&
      !isModalOpen
    ) {
      queueMicrotask(() => {
        setIsModalOpen(true)
      })
    }
  }, [cloudStorage.isAuthenticated, selectedFile, isModalOpen])

  /**
   * Handle connect to OneDrive
   * Opens FileSelectionModal for authentication and file selection
   */
  const handleConnect = async () => {
    try {
      // Authenticate first (or skip if already authenticated)
      await cloudStorage.connect(CloudProvider.ONEDRIVE)
      // Open modal for file selection
      setIsModalOpen(true)
    } catch (error) {
      console.error('Authentication failed:', error)
      // Modal won't open if authentication fails
    }
  }

  /**
   * Handle file selection from modal
   */
  const handleFileSelected = async (fileInfo: FileInfo) => {
    setIsModalOpen(false)
    await connectProvider(fileInfo)
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
      navigate('/')
    } catch (error) {
      console.error('[CloudSyncSettings] Failed to disconnect:', error)
    }
  }

  /**
   * Format last sync time
   */
  const formatLastSyncTime = useMemo(() => {
    return (timestamp: number | null): string => {
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
  }, [])

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
          <Alert
            icon={<IconCloudOff size={16} />}
            title="Not Connected"
            color="gray"
          >
            Connect to OneDrive to automatically sync your data across devices.
          </Alert>
        )}

        {!isConnected ? (
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
                  <Text fw={500}>
                    Connected to {cloudStorage.currentProvider}
                  </Text>
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

        {isConnected && (
          <Text size="xs" c="dimmed">
            Note: Auto-sync is enabled. Your changes are automatically synced to
            the cloud.
          </Text>
        )}

        {!isConnected && (
          <Text size="xs" c="dimmed">
            Connect to OneDrive to sync your data across devices and prevent
            data loss.
          </Text>
        )}
      </Stack>

      <FileSelectionModal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectFile={handleFileSelected}
      />
    </Container>
  )
}
