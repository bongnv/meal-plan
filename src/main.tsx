import '@mantine/core/styles.css'

import React from 'react'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { IngredientProvider } from './contexts/IngredientContext'
import { MealPlanProvider } from './contexts/MealPlanContext'
import { RecipeProvider } from './contexts/RecipeContext'
import { SyncProvider } from './contexts/SyncContext'
import { CloudStorageFactory } from './utils/storage/CloudStorageFactory'
import { CloudProvider } from './utils/storage/CloudProvider'
import { OneDriveProvider } from './utils/storage/providers/OneDriveProvider'

// Register cloud storage providers
const factory = CloudStorageFactory.getInstance()
factory.registerProvider(CloudProvider.ONEDRIVE, new OneDriveProvider())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <ModalsProvider>
        <BrowserRouter>
          <SyncProvider>
            <IngredientProvider>
              <RecipeProvider>
                <MealPlanProvider>
                  <App />
                </MealPlanProvider>
              </RecipeProvider>
            </IngredientProvider>
          </SyncProvider>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
)
