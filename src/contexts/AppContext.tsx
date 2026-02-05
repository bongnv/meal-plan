import { createContext, useContext, useState, type ReactNode } from 'react'

interface AppContextType {
  // Modal visibility state
  showWelcome: boolean
  showFileSelection: boolean
  showReconnectModal: boolean

  // Modal visibility setters
  setShowWelcome: (show: boolean) => void
  setShowFileSelection: (show: boolean) => void
  setShowReconnectModal: (show: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showFileSelection, setShowFileSelection] = useState(false)
  const [showReconnectModal, setShowReconnectModal] = useState(false)

  return (
    <AppContext.Provider
      value={{
        // Modal visibility state
        showWelcome,
        showFileSelection,
        showReconnectModal,

        // Modal visibility setters
        setShowWelcome,
        setShowFileSelection,
        setShowReconnectModal,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

/**
 * Hook to access app context
 * Must be used within AppProvider
 */
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
