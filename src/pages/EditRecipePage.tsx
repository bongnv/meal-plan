import { useNavigate, useParams } from 'react-router-dom'

import { RecipeForm } from '../components/recipes/RecipeForm'
import { useRecipes } from '../contexts/RecipeContext'

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const { getRecipeById, updateRecipe } = useRecipes()
  const navigate = useNavigate()

  const recipe = id ? getRecipeById(id) : null

  if (!recipe) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-700">
            Recipe Not Found
          </h2>
          <p className="mb-4 text-gray-500">
            The recipe you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/recipes')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = (recipeInput: {
    name: string
    description: string
    ingredients: Array<{ ingredientId: string; quantity: number }>
    instructions: string[]
    servings: number
    totalTime: number
    tags: string[]
  }) => {
    updateRecipe({
      ...recipe,
      ...recipeInput,
    })
    navigate('/recipes')
  }

  const handleCancel = () => {
    navigate('/recipes')
  }

  return (
    <div>
      <RecipeForm
        recipe={recipe}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
