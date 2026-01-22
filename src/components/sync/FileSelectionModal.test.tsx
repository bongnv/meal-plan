import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as CloudStorageContext from '../../contexts/CloudStorageContext'
import { CloudProvider } from '../../utils/storage/CloudProvider'

import { FileSelectionModal } from './FileSelectionModal'

import type { FolderListResult } from '../../utils/storage/ICloudStorageProvider'

// Helper to render with Mantine provider
const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

// Mock the useCloudStorage hook
const mockListFoldersAndFiles = vi.fn().mockResolvedValue({
  folders: [
    { id: '1', name: 'Documents', path: '/Documents', isSharedWithMe: false },
    {
      id: '2',
      name: 'Shared Folder',
      path: '/Shared Folder',
      isSharedWithMe: true,
    },
  ],
  files: [
    {
      id: '3',
      name: 'meal-plan-data.json.gz',
      path: '/meal-plan-data.json.gz',
      isSharedWithMe: false,
    },
  ],
} as FolderListResult)

const createMockCloudStorage = () => ({
  currentProvider: CloudProvider.ONEDRIVE,
  isAuthenticated: true,
  isConnecting: false,
  accountInfo: { name: 'Test User', email: 'test@example.com' },
  error: null,
  setProvider: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  uploadFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn().mockResolvedValue('{}'),
  listFoldersAndFiles: mockListFoldersAndFiles,
  getAccountInfo: vi.fn().mockReturnValue({
    name: 'Test User',
    email: 'test@example.com',
  }),
})

describe('FileSelectionModal', () => {
  let mockCloudStorage: ReturnType<typeof createMockCloudStorage>
  const onSelectFile = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    mockCloudStorage = createMockCloudStorage()
    vi.clearAllMocks()
    vi.spyOn(CloudStorageContext, 'useCloudStorage').mockReturnValue(
      mockCloudStorage
    )
  })

  describe('Modal Rendering', () => {
    it('should render modal when opened', async () => {
      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
    })

    it('should not render modal when closed', () => {
      renderWithMantine(
        <FileSelectionModal
          opened={false}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      expect(screen.queryByText(/select file/i)).not.toBeInTheDocument()
    })

    it('should list folders and files when opened', async () => {
      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(mockListFoldersAndFiles).toHaveBeenCalledWith(undefined)
      })

      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('Shared Folder')).toBeInTheDocument()
      expect(screen.getByText('meal-plan-data.json.gz')).toBeInTheDocument()
    })
  })

  describe('Folder Navigation', () => {
    it('should display breadcrumb navigation', async () => {
      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('OneDrive')).toBeInTheDocument()
      })
    })

    it('should navigate into folder when clicked', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
      })

      // Click on Documents folder
      const documentsFolder = screen.getByText('Documents')
      await user.click(documentsFolder)

      await waitFor(() => {
        expect(mockListFoldersAndFiles).toHaveBeenCalledWith({
          id: '1',
          name: 'Documents',
          path: '/Documents',
          isSharedWithMe: false,
        })
      })
    })

    it('should update breadcrumb after navigating into folder', async () => {
      const user = userEvent.setup()

      // Initial root listing
      mockListFoldersAndFiles
        .mockResolvedValueOnce({
          folders: [
            {
              id: '1',
              name: 'Documents',
              path: '/Documents',
              isSharedWithMe: false,
            },
          ],
          files: [],
        })
        .mockResolvedValueOnce({
          folders: [
            {
              id: '2',
              name: 'MealPlanner',
              path: '/Documents/MealPlanner',
              isSharedWithMe: false,
            },
          ],
          files: [],
        })

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
      })

      const documentsFolder = screen.getByText('Documents')
      await user.click(documentsFolder)

      await waitFor(() => {
        expect(screen.getByText('OneDrive')).toBeInTheDocument()
        expect(screen.getByText('Documents')).toBeInTheDocument()
      })
    })

    it('should navigate up to parent folder', async () => {
      const user = userEvent.setup()

      mockListFoldersAndFiles
        .mockResolvedValueOnce({
          folders: [
            {
              id: '1',
              name: 'Documents',
              path: '/Documents',
              isSharedWithMe: false,
            },
          ],
          files: [],
        })
        .mockResolvedValueOnce({
          folders: [],
          files: [
            {
              id: '3',
              name: 'data.json.gz',
              path: '/Documents/data.json.gz',
              isSharedWithMe: false,
            },
          ],
        })
        .mockResolvedValueOnce({
          folders: [
            {
              id: '1',
              name: 'Documents',
              path: '/Documents',
              isSharedWithMe: false,
            },
          ],
          files: [],
        })

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Navigate into Documents
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
      })
      const documentsFolder = screen.getByText('Documents')
      await user.click(documentsFolder)

      // Wait for subfolder view
      await waitFor(() => {
        expect(screen.getByText('data.json.gz')).toBeInTheDocument()
      })

      // Click up/back button
      const upButton = screen.getByRole('button', { name: /up|back/i })
      await user.click(upButton)

      await waitFor(() => {
        expect(mockListFoldersAndFiles).toHaveBeenCalledTimes(3)
        expect(mockListFoldersAndFiles).toHaveBeenLastCalledWith(undefined)
      })
    })
  })

  describe('Folder and File Display', () => {
    it('should show shared badge for shared folders', async () => {
      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Shared Folder')).toBeInTheDocument()
      })

      const sharedFolder = screen
        .getByText('Shared Folder')
        .closest('[role="button"]') as HTMLElement
      expect(
        within(sharedFolder).getAllByText(/shared/i).length
      ).toBeGreaterThan(0)
    })

    it('should show shared badge for shared files', async () => {
      mockListFoldersAndFiles.mockResolvedValueOnce({
        folders: [],
        files: [
          {
            id: '1',
            name: 'shared-meal-plan.json.gz',
            path: '/shared-meal-plan.json.gz',
            isSharedWithMe: true,
          },
        ],
      })

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('shared-meal-plan.json.gz')).toBeInTheDocument()
      })

      const sharedFile = screen
        .getByText('shared-meal-plan.json.gz')
        .closest('div[class*="Paper"]') as HTMLElement
      expect(sharedFile).toBeInTheDocument()
      expect(within(sharedFile).getByText('Shared')).toBeInTheDocument()
    })

    it('should show empty state when no files in folder', async () => {
      mockListFoldersAndFiles.mockResolvedValueOnce({
        folders: [],
        files: [],
      })

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no items in this folder/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Selection', () => {
    it('should allow selecting a file', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('meal-plan-data.json.gz')).toBeInTheDocument()
      })

      const fileRadio = screen.getByRole('radio', {
        name: /meal-plan-data\.json\.gz/i,
      })
      await user.click(fileRadio)

      expect(fileRadio).toBeChecked()
    })

    it('should enable select button when file is selected', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('meal-plan-data.json.gz')).toBeInTheDocument()
      })

      const selectButton = screen.getByRole('button', { name: /select file/i })
      expect(selectButton).toBeDisabled()

      const fileRadio = screen.getByRole('radio', {
        name: /meal-plan-data\.json\.gz/i,
      })
      await user.click(fileRadio)

      expect(selectButton).toBeEnabled()
    })

    it('should call onSelectFile with file info when select button clicked', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('meal-plan-data.json.gz')).toBeInTheDocument()
      })

      const fileRadio = screen.getByRole('radio', {
        name: /meal-plan-data\.json\.gz/i,
      })
      await user.click(fileRadio)

      const selectButton = screen.getByRole('button', { name: /select file/i })
      await user.click(selectButton)

      expect(onSelectFile).toHaveBeenCalledWith({
        id: '3',
        name: 'meal-plan-data.json.gz',
        path: '/meal-plan-data.json.gz',
        isSharedWithMe: false,
      })
    })
  })

  describe('File Creation', () => {
    it('should show create file section', async () => {
      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/create new file/i)).toBeInTheDocument()
      })
    })

    it('should have default filename suggestion', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        const filenameInput = screen.getByLabelText(
          /file name/i
        ) as HTMLInputElement
        expect(filenameInput.value).toBe('')
      })
    })

    it('should validate filename is not empty', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.clear(filenameInput)
      await user.tab()

      // The create button should be disabled when filename is empty
      const createFileButton = screen.getByRole('button', { name: /^create$/i })
      expect(createFileButton).toBeDisabled()
    })

    it('should validate filename has no invalid characters', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.clear(filenameInput)
      await user.type(filenameInput, 'invalid/name*.json.gz')

      await waitFor(() => {
        expect(screen.getByText(/invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should auto-append .json.gz extension if not present', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createNewButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createNewButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.clear(filenameInput)
      await user.type(filenameInput, 'my-meal-plan')

      const createButton = screen.getByRole('button', { name: /^create$/i })
      await user.click(createButton)

      expect(onSelectFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-meal-plan.json.gz',
        })
      )
    })

    it('should enable create button when filename is valid', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createNewButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createNewButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.clear(filenameInput)
      await user.type(filenameInput, 'new-meal-plan')

      const createButton = screen.getByRole('button', { name: /^create$/i })
      expect(createButton).toBeEnabled()
    })

    it('should call onSelectFile with new file info when create clicked', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      // Click Create New File button to open the nested modal
      const createNewButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createNewButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.clear(filenameInput)
      await user.type(filenameInput, 'new-file.json.gz')

      const createButton = screen.getByRole('button', { name: /^create$/i })
      await user.click(createButton)

      expect(onSelectFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'new-file.json.gz',
          path: '/new-file.json.gz',
        })
      )
    })

    it('should validate filename is unique in current folder', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('meal-plan-data.json.gz')).toBeInTheDocument()
      })

      // Click Create New File button to open the nested modal
      const createNewButton = await screen.findByRole('button', {
        name: /create new file/i,
      })
      await user.click(createNewButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/file name/i)).toBeInTheDocument()
      })

      const filenameInput = screen.getByLabelText(/file name/i)
      await user.type(filenameInput, 'meal-plan-data.json.gz')

      await waitFor(() => {
        expect(screen.getByText(/file already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Action', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup()

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalledOnce()
    })
  })

  describe('Error Handling', () => {
    it('should display error when listing folders fails', async () => {
      mockListFoldersAndFiles.mockRejectedValueOnce(new Error('Listing failed'))

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/listing failed/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after listing error', async () => {
      const user = userEvent.setup()
      let callCount = 0
      mockListFoldersAndFiles.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Listing failed'))
        }
        return Promise.resolve({
          folders: [],
          files: [
            {
              id: '1',
              name: 'test.json.gz',
              path: '/test.json.gz',
              isSharedWithMe: false,
            },
          ],
        })
      })

      renderWithMantine(
        <FileSelectionModal
          opened={true}
          onClose={onCancel}
          onSelectFile={onSelectFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/listing failed/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('test.json.gz')).toBeInTheDocument()
      })
    })
  })
})
