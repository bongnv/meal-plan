import '@mantine/core/styles.css'

import React from 'react'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { IngredientProvider } from './contexts/IngredientContext'
import { RecipeProvider } from './contexts/RecipeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <ModalsProvider>
        <BrowserRouter>
          <IngredientProvider>
            <RecipeProvider>
              <App />
            </RecipeProvider>
          </IngredientProvider>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
)
