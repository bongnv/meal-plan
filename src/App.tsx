import { Route, Routes } from 'react-router-dom'

import { CreateRecipePage } from './pages/recipes/CreateRecipePage'
import { EditRecipePage } from './pages/recipes/EditRecipePage'
import { RecipesPage } from './pages/recipes/RecipesPage'
import { IngredientsPage } from './pages/settings/IngredientsPage'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <h1>Meal Plan</h1>
            <p>Home page - coming soon</p>
          </div>
        }
      />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/new" element={<CreateRecipePage />} />
      <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
      <Route path="/settings/ingredients" element={<IngredientsPage />} />
    </Routes>
  )
}

export default App
