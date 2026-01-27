import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { msalConfig } from './config/msalConfig'
import { CloudStorageProvider } from './contexts/CloudStorageContext'
import { SyncProvider } from './contexts/SyncContext'

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <CloudStorageProvider>
        <MantineProvider>
          <Notifications position="top-right" />
          <ModalsProvider>
            <BrowserRouter>
              <SyncProvider>
                <App />
              </SyncProvider>
            </BrowserRouter>
          </ModalsProvider>
        </MantineProvider>
      </CloudStorageProvider>
    </MsalProvider>
  </React.StrictMode>
)
