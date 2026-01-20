import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { IngredientProvider } from './contexts/IngredientContext'
import { RecipeProvider } from './contexts/RecipeContext'
import { CreateRecipePage } from './pages/CreateRecipePage'
import { EditRecipePage } from './pages/EditRecipePage'
import { IngredientsSettingsPage } from './pages/IngredientsSettingsPage'
import { RecipesPage } from './pages/RecipesPage'

function App() {
  return (
    <BrowserRouter>
      <IngredientProvider>
        <RecipeProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Navigate to="/recipes" replace />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/new" element={<CreateRecipePage />} />
              <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
              <Route
                path="/settings/ingredients"
                element={<IngredientsSettingsPage />}
              />
            </Routes>
          </div>
        </RecipeProvider>
      </IngredientProvider>
    </BrowserRouter>
  )
}

export default App
