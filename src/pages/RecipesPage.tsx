import { useNavigate } from 'react-router-dom'

import { RecipeList } from '../components/recipes/RecipeList'
import { useRecipes } from '../contexts/RecipeContext'

export function RecipesPage() {
  const { recipes } = useRecipes()
  const navigate = useNavigate()

  const handleView = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`)
  }

  const handleEdit = (recipeId: string) => {
    navigate(`/recipes/${recipeId}/edit`)
  }

  const handleDelete = (recipeId: string) => {
    // TODO: Show confirmation dialog before deleting
    // For now, we'll implement this in step 7
    console.log('Delete recipe:', recipeId)
  }

  const handleCreate = () => {
    navigate('/recipes/new')
  }

  return (
    <div>
      <div className="border-b bg-white p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/settings/ingredients')}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ⚙️ Ingredients
            </button>
            <button
              onClick={handleCreate}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + New Recipe
            </button>
          </div>
        </div>
      </div>
      <RecipeList
        recipes={recipes}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  )
}
