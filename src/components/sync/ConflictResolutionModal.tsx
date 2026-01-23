import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Table,
  Badge,
  Alert,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useState } from 'react'

import { useSyncContext } from '../../contexts/SyncContext'

import type { SyncConflict } from '../../contexts/SyncContext'

interface ConflictResolutionModalProps {
  opened: boolean
  onClose: () => void
}

export function ConflictResolutionModal({
  opened,
  onClose,
}: ConflictResolutionModalProps) {
  const { conflicts, resolveConflict } = useSyncContext()
  const [isResolving, setIsResolving] = useState(false)

  const handleResolve = async (resolution: 'local' | 'remote') => {
    try {
      setIsResolving(true)
      await resolveConflict(resolution)
      onClose()
    } catch (error) {
      console.error('Failed to resolve conflicts:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const formatEntityType = (type: SyncConflict['type']): string => {
    switch (type) {
      case 'recipe':
        return 'Recipe'
      case 'mealPlan':
        return 'Meal Plan'
      case 'ingredient':
        return 'Ingredient'
      default:
        return type
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Sync Conflicts Detected"
      size="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Conflicting Changes"
          color="yellow"
        >
          <Text size="sm">
            The following items have been modified both locally and in OneDrive
            since the last sync. You need to choose which version to keep.
          </Text>
        </Alert>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Local Modified</Table.Th>
              <Table.Th>Remote Modified</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {conflicts.map(conflict => (
              <Table.Tr key={conflict.id}>
                <Table.Td>
                  <Badge variant="light">
                    {formatEntityType(conflict.type)}
                  </Badge>
                </Table.Td>
                <Table.Td>{conflict.itemName}</Table.Td>
                <Table.Td>
                  <Text size="xs">{formatTimestamp(conflict.localModified)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{formatTimestamp(conflict.remoteModified)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Text size="sm" c="dimmed">
          Choose which version to keep for all {conflicts.length} conflicting
          item{conflicts.length > 1 ? 's' : ''}:
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={() => handleResolve('remote')}
            disabled={isResolving}
          >
            Keep Remote Version
          </Button>
          <Button
            onClick={() => handleResolve('local')}
            disabled={isResolving}
            loading={isResolving}
          >
            Keep Local Version
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
