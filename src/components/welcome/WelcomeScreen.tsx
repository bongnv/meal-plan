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

interface WelcomeScreenProps {
  onConnect: () => void
  onSkip: () => void
}

/**
 * Welcome screen component shown on first visit
 * Prompts user to connect to OneDrive or skip to work offline
 */
export function WelcomeScreen({ onConnect, onSkip }: WelcomeScreenProps) {
  return (
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
              Connect to OneDrive to sync your data across devices, or skip to
              work offline on this device only.
            </Alert>

            <Stack gap="md">
              <Button size="lg" fullWidth onClick={onConnect}>
                Connect to OneDrive
              </Button>

              <Button
                variant="subtle"
                size="sm"
                fullWidth
                onClick={onSkip}
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
                Without cloud sync, your data will only be stored on this device
                and will not be backed up. You won't be able to access your
                meals and recipes from other devices.
              </Text>
            </Alert>
          </Stack>
        </Paper>
      </Center>
    </Overlay>
  )
}
