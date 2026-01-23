import {
  Stack,
  Title,
  Text,
  Button,
  Center,
  Paper,
  Alert,
  Overlay,
} from '@mantine/core'
import { IconCloudOff, IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'

import { FileInfo } from '@/utils/storage/ICloudStorageProvider'

import { useCloudStorage } from '../../contexts/CloudStorageContext'
import { useSyncContext } from '../../contexts/SyncContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'
import { FileSelectionModal } from '../sync/FileSelectionModal'

/**
 * Welcome screen component shown on first visit
 * Prompts user to connect to OneDrive or skip to work offline
 */
export function WelcomeScreen() {
  const cloudStorage = useCloudStorage()
  const { connectProvider, selectedFile, isInitializing } = useSyncContext()

  const [isDismissed, setIsDismissed] = useState(false)

  // Hide entire welcome screen when dismissed or has selected file
  if (isDismissed || selectedFile !== null) {
    return null
  }

  const handleConnect = async () => {
    try {
      // Authenticate with OneDrive - connectionState will change to pendingFileSelection
      await cloudStorage.connect(CloudProvider.ONEDRIVE)
    } catch (error) {
      console.error('Failed to connect to OneDrive:', error)
      // Error will be visible to user via cloudStorage.error
    }
  }

  const handleSkip = () => {
    // Dismiss for this session only
    // Will show again on next page load to remind user to back up data
    setIsDismissed(true)
  }

  const handleFileSelected = async (fileInfo: FileInfo) => {
    await connectProvider(fileInfo)
  }

  const handleModalClose = async () => {
    // User canceled file selection - disconnect and return to welcome screen
    await cloudStorage.disconnect()
  }

  return (
    <>
      {!cloudStorage.isAuthenticated && (
        <Overlay
          fixed
          color="var(--mantine-color-gray-0)"
          backgroundOpacity={1}
          zIndex={1000}
          data-testid="welcome-screen"
        >
          <Center style={{ height: '100vh' }}>
            <Paper
              shadow="md"
              p="xl"
              radius="md"
              style={{ maxWidth: 500, width: '90%' }}
            >
              <Stack gap="lg">
                <div style={{ textAlign: 'center' }}>
                  <IconCloudOff size={64} color="var(--mantine-color-blue-6)" />
                  <Title order={1} mt="md">
                    Welcome to Meal Plan
                  </Title>
                  <Text size="lg" c="dimmed" mt="xs">
                    Plan your meals, organize recipes, and create grocery lists
                  </Text>
                </div>

                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Get Started"
                  color="blue"
                >
                  Connect to OneDrive to sync your data across devices, or skip
                  to work offline on this device only.
                </Alert>

                <Stack gap="md">
                  <Button size="lg" fullWidth onClick={handleConnect}>
                    Connect to OneDrive
                  </Button>

                  <Button
                    variant="subtle"
                    size="sm"
                    fullWidth
                    onClick={handleSkip}
                    c="dimmed"
                  >
                    Skip - Work Offline
                  </Button>
                </Stack>

                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="yellow"
                  title="Offline Limitations"
                >
                  <Text size="sm">
                    Without cloud sync, your data will only be stored on this
                    device and will not be backed up. You won't be able to
                    access your meals and recipes from other devices.
                  </Text>
                </Alert>
              </Stack>
            </Paper>
          </Center>
        </Overlay>
      )}

      <FileSelectionModal
        opened={
          cloudStorage.isAuthenticated &&
          selectedFile === null &&
          !isInitializing
        }
        onClose={handleModalClose}
        onSelectFile={handleFileSelected}
      />
    </>
  )
}
