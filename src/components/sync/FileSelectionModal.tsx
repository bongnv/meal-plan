import {
  Modal,
  Stack,
  Group,
  Button,
  TextInput,
  Radio,
  Breadcrumbs,
  Anchor,
  Badge,
  Text,
  Alert,
  Loader,
  ActionIcon,
  Paper,
} from '@mantine/core'
import {
  IconFolder,
  IconFile,
  IconArrowUp,
  IconAlertCircle,
  IconShare,
} from '@tabler/icons-react'

import { useFileSelectionModal } from '../../hooks/useFileSelectionModal'

import type { FileInfo } from '../../utils/storage/ICloudStorageProvider'

interface FileSelectionModalProps {
  opened: boolean
  onClose: () => void
  onSelectFile: (fileInfo: FileInfo) => void
}

/**
 * File selection modal for choosing or creating sync files
 * Pure presentation component - UI logic handled by useFileSelectionModal hook
 */
export function FileSelectionModal({
  opened,
  onClose,
  onSelectFile,
}: FileSelectionModalProps) {
  const {
    // State
    isLoading,
    error,
    breadcrumbs,
    folders,
    files,
    selectedFileId,
    showCreateModal,
    newFileName,
    fileNameError,

    // Actions
    setSelectedFileId,
    setShowCreateModal,
    loadFolderContents,
    navigateToFolder,
    navigateToBreadcrumb,
    navigateUp,
    handleSelectFile,
    handleFileNameChange,
    handleCreateFile,
    closeCreateModal,
  } = useFileSelectionModal({ opened, onSelectFile })

  const renderError = () => (
    <Alert
      icon={<IconAlertCircle size="1rem" />}
      title="Error"
      color="red"
      mb="md"
    >
      {error}
      <Button
        size="xs"
        variant="light"
        mt="sm"
        onClick={async () => loadFolderContents()}
      >
        Retry
      </Button>
    </Alert>
  )

  const renderFolderBrowser = () => (
    <Stack gap="md">
      <Group justify="space-between">
        <Breadcrumbs>
          {breadcrumbs.map((breadcrumb, index) => (
            <Anchor
              key={index}
              onClick={() => navigateToBreadcrumb(index)}
              style={{ cursor: 'pointer' }}
            >
              {breadcrumb.label}
            </Anchor>
          ))}
        </Breadcrumbs>
        {breadcrumbs.length > 1 && (
          <ActionIcon variant="subtle" onClick={navigateUp} aria-label="Up">
            <IconArrowUp size="1rem" />
          </ActionIcon>
        )}
      </Group>

      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : (
        <>
          {/* Folders and Files */}
          {folders.length === 0 && files.length === 0 ? (
            <Text c="dimmed" ta="center" p="xl">
              No items in this folder
            </Text>
          ) : (
            <Stack gap="xs">
              {/* Folders */}
              {folders.map(folder => (
                <Paper
                  key={folder.id}
                  p="md"
                  withBorder
                  role="button"
                  onClick={() => navigateToFolder(folder)}
                  style={{ cursor: 'pointer' }}
                >
                  <Group>
                    <IconFolder size="1.5rem" />
                    <Text flex={1}>{folder.name}</Text>
                    {folder.isSharedWithMe && (
                      <Badge
                        size="sm"
                        leftSection={<IconShare size="0.8rem" />}
                      >
                        Shared
                      </Badge>
                    )}
                  </Group>
                </Paper>
              ))}

              {/* Files */}
              <Radio.Group
                value={selectedFileId || ''}
                onChange={setSelectedFileId}
              >
                {files.map(file => (
                  <Paper key={file.id} p="md" withBorder>
                    <Group>
                      <Radio
                        value={file.id}
                        aria-label={file.name}
                        styles={{ radio: { cursor: 'pointer' } }}
                      />
                      <IconFile size="1.5rem" />
                      <Text flex={1}>{file.name}</Text>
                      {file.isSharedWithMe && (
                        <Badge
                          size="sm"
                          leftSection={<IconShare size="0.8rem" />}
                        >
                          Shared
                        </Badge>
                      )}
                    </Group>
                  </Paper>
                ))}
              </Radio.Group>
            </Stack>
          )}
        </>
      )}
    </Stack>
  )

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="Select File"
        size="lg"
        closeOnEscape={!showCreateModal}
      >
        <Stack gap="md">
          {error && renderError()}
          {renderFolderBrowser()}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="light"
              onClick={() => setShowCreateModal(true)}
              disabled={isLoading}
            >
              Create New File
            </Button>
            <Button
              onClick={handleSelectFile}
              disabled={!selectedFileId || isLoading}
            >
              Select File
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showCreateModal}
        onClose={closeCreateModal}
        title="Create New File"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="File Name"
            placeholder="meal-plan-data"
            value={newFileName}
            onChange={e => handleFileNameChange(e.currentTarget.value)}
            error={fileNameError}
            description="Extension .json.gz will be added automatically"
            data-autofocus
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFile}
              disabled={!!fileNameError || !newFileName.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
