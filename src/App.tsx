import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { RecipeProvider } from './contexts/RecipeContext'
import { CreateRecipePage } from './pages/CreateRecipePage'
import { EditRecipePage } from './pages/EditRecipePage'
import { RecipesPage } from './pages/RecipesPage'

function App() {
  return (
    <BrowserRouter>
      <RecipeProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<CreateRecipePage />} />
            <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
          </Routes>
        </div>
      </RecipeProvider>
    </BrowserRouter>
  )
}

export default App
