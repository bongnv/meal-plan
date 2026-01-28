import { useMsal } from '@azure/msal-react'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

import { loginRequest } from '../config/msalConfig'
import { CloudProvider } from '../utils/storage/CloudProvider'
import { OneDriveProvider } from '../utils/storage/providers/OneDriveProvider'

import type {
  ICloudStorageProvider,
  FileInfo,
  FolderInfo,
  FolderListResult,
} from '../utils/storage/ICloudStorageProvider'

/**
 * LocalStorage key for persisting provider selection
 */
const CONNECTED_PROVIDER_KEY = 'mealplan_connected_provider'

/**
 * SessionStorage key for temporary provider during redirect flow
 */
const PENDING_PROVIDER_KEY = 'mealplan_pending_provider'

interface CloudStorageContextType {
  // Current state
  currentProvider: CloudProvider | null
  isAuthenticated: boolean

  // Provider instance (for dependency injection)
  providerInstance: ICloudStorageProvider | null

  // Auth methods (managed by context)
  connect: (provider: CloudProvider) => Promise<void>
  disconnect: () => Promise<void>
  getAccountInfo: () => { name: string; email: string }

  // File operation methods (delegated to provider)
  uploadFile: (fileInfo: FileInfo, data: string) => Promise<FileInfo>
  downloadFile: (fileInfo: FileInfo) => Promise<string>
  listFoldersAndFiles: (folder?: FolderInfo) => Promise<FolderListResult>
}

const CloudStorageContext = createContext<CloudStorageContextType | undefined>(
  undefined
)

export function CloudStorageProvider({ children }: { children: ReactNode }) {
  const { instance: msalInstance, inProgress } = useMsal()

  // Initialize currentProvider from localStorage, but validate after MSAL is ready
  const [currentProvider, setCurrentProvider] = useState<CloudProvider | null>(
    () => {
      // Check for pending provider from redirect flow first
      const pending = sessionStorage.getItem(
        PENDING_PROVIDER_KEY
      ) as CloudProvider | null
      if (pending) {
        return pending
      }

      // Otherwise check localStorage
      const saved = localStorage.getItem(
        CONNECTED_PROVIDER_KEY
      ) as CloudProvider | null
      return saved
    }
  )

  // Create all available providers once
  const providers = useMemo(() => {
    const map = new Map<CloudProvider, ICloudStorageProvider>()

    // Register OneDrive provider with shared MSAL instance
    map.set(CloudProvider.ONEDRIVE, new OneDriveProvider(msalInstance))

    // Future: Add other providers here
    // map.set(CloudProvider.GOOGLE_DRIVE, new GoogleDriveProvider())
    // map.set(CloudProvider.DROPBOX, new DropboxProvider())

    return map
  }, [msalInstance])

  // Compute isAuthenticated from active provider, not just MSAL hook
  // This ensures we check the specific provider's auth state
  // IMPORTANT: Don't check authentication until MSAL finishes initializing
  const isAuthenticated = useMemo(() => {
    // Wait for MSAL to finish initializing
    if (inProgress !== 'none') {
      return false
    }

    if (!currentProvider) {
      return false
    }

    const provider = providers.get(currentProvider)
    const providerAuth = provider?.isAuthenticated() ?? false
    return providerAuth
  }, [inProgress, currentProvider, providers])

  // Auto-restore provider from localStorage on mount
  // Wait for MSAL to finish initializing before checking authentication
  useEffect(() => {
    // Don't check until MSAL is done initializing
    if (inProgress !== 'none') {
      return
    }

    // If no provider saved, nothing to validate
    if (!currentProvider) {
      return
    }

    // Check if still authenticated
    const provider = providers.get(currentProvider)
    const authenticated = provider?.isAuthenticated() ?? false

    if (!authenticated) {
      // Not authenticated anymore, clear saved provider
      // Queue state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        localStorage.removeItem(CONNECTED_PROVIDER_KEY)
        sessionStorage.removeItem(PENDING_PROVIDER_KEY)
        setCurrentProvider(null)
      })
    } else {
      // Save to localStorage now that authentication is confirmed
      const pendingProvider = sessionStorage.getItem(PENDING_PROVIDER_KEY)
      if (pendingProvider || currentProvider) {
        const providerToSave = pendingProvider || currentProvider
        localStorage.setItem(CONNECTED_PROVIDER_KEY, providerToSave as string)
        sessionStorage.removeItem(PENDING_PROVIDER_KEY)
      }
    }
  }, [providers, inProgress, currentProvider])

  // Get the active provider instance
  const getActiveProvider = (): ICloudStorageProvider => {
    if (!currentProvider) {
      throw new Error('No provider connected. Call connect() first.')
    }
    const provider = providers.get(currentProvider)
    if (!provider) {
      throw new Error(`Provider ${currentProvider} is not registered`)
    }
    if (!provider.isAuthenticated()) {
      throw new Error('Not authenticated. Please log in first.')
    }
    return provider
  }

  // Connect to a specific provider (handles authentication via MSAL)
  const connect = async (provider: CloudProvider): Promise<void> => {
    const providerInstance = providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not registered`)
    }

    // Authenticate via MSAL redirect
    if (provider === CloudProvider.ONEDRIVE) {
      // Save provider to sessionStorage (temporary) so it can be restored after redirect
      // Will only be saved to localStorage after successful authentication
      sessionStorage.setItem(PENDING_PROVIDER_KEY, provider)
      setCurrentProvider(provider)
      // Trigger redirect - page will reload after authentication
      await msalInstance.loginRedirect(loginRequest)
      return // Code after this won't execute due to redirect
    }

    setCurrentProvider(provider)
    localStorage.setItem(CONNECTED_PROVIDER_KEY, provider)
  }

  // Disconnect from current provider
  const disconnect = async (): Promise<void> => {
    if (!currentProvider) {
      return
    }
    // Don't call logoutPopup - let token expire naturally on browser close
    setCurrentProvider(null)
    localStorage.removeItem(CONNECTED_PROVIDER_KEY)
  }

  // Get account info from active provider (synchronous)
  const getAccountInfo = (): { name: string; email: string } => {
    const provider = getActiveProvider()
    return provider.getAccountInfo()
  }

  // Upload file using active provider
  const uploadFile = async (
    fileInfo: FileInfo,
    data: string
  ): Promise<FileInfo> => {
    const provider = getActiveProvider()
    return provider.uploadFile(fileInfo, data)
  }

  // Download file using active provider
  const downloadFile = async (fileInfo: FileInfo): Promise<string> => {
    const provider = getActiveProvider()
    return provider.downloadFile(fileInfo)
  }

  // List folders and files using active provider
  const listFoldersAndFiles = async (
    folder?: FolderInfo
  ): Promise<FolderListResult> => {
    const provider = getActiveProvider()
    return provider.listFoldersAndFiles(folder)
  }

  return (
    <CloudStorageContext.Provider
      value={{
        currentProvider,
        isAuthenticated,
        providerInstance: currentProvider
          ? (providers.get(currentProvider) ?? null)
          : null,
        connect,
        disconnect,
        getAccountInfo,
        uploadFile,
        downloadFile,
        listFoldersAndFiles,
      }}
    >
      {children}
    </CloudStorageContext.Provider>
  )
}

/**
 * Hook to access cloud storage providers
 * Must be used within CloudStorageProvider
 */
export function useCloudStorage() {
  const context = useContext(CloudStorageContext)
  if (!context) {
    throw new Error(
      'useCloudStorage must be used within a CloudStorageProvider'
    )
  }
  return context
}
