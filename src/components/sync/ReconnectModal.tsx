import { Modal, Text, Button, Stack, Alert, Group } from '@mantine/core'
import { IconAlertTriangle, IconCloud, IconCloudOff } from '@tabler/icons-react'

interface ReconnectModalProps {
  onReconnect: () => void
  onWorkOffline: () => void
}

/**
 * Modal shown when OneDrive session has expired
 * Prompts user to reconnect or work offline
 */
export function ReconnectModal({
  onReconnect,
  onWorkOffline,
}: ReconnectModalProps) {
  return (
    <Modal
      opened={true}
      onClose={() => {
        /* Cannot close without action */
      }}
      title="Session Expired"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={20} />}
          title="Your OneDrive session has expired"
          color="yellow"
        >
          <Text size="sm">
            Please reconnect to continue syncing your meal plan data.
          </Text>
        </Alert>

        <Text size="sm" c="dimmed">
          Your local changes are safe. Choose to reconnect now or work offline
          and reconnect later via Settings → Cloud Sync.
        </Text>

        <Group gap="sm" mt="md">
          <Button
            leftSection={<IconCloud size={16} />}
            onClick={onReconnect}
            fullWidth
          >
            Reconnect to OneDrive
          </Button>
          <Button
            leftSection={<IconCloudOff size={16} />}
            onClick={onWorkOffline}
            variant="light"
            color="gray"
            fullWidth
          >
            Work Offline
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
