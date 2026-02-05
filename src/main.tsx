import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { initializeMsal, msalInstance } from './config/msalInstance'
import { AppProvider } from './contexts/AppContext'
import { ServicesProvider } from './contexts/ServicesContext'
import { SyncProvider } from './contexts/SyncContext'

// Initialize MSAL before rendering
void initializeMsal().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ServicesProvider>
        <MantineProvider>
          <Notifications position="top-right" />
          <ModalsProvider>
            <BrowserRouter>
              <AppProvider>
                <SyncProvider msalInstance={msalInstance}>
                  <App />
                </SyncProvider>
              </AppProvider>
            </BrowserRouter>
          </ModalsProvider>
        </MantineProvider>
      </ServicesProvider>
    </React.StrictMode>
  )
})
