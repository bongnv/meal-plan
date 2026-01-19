import { useNavigate } from 'react-router-dom'

import { RecipeForm } from '../components/recipes/RecipeForm'
import { useRecipes } from '../contexts/RecipeContext'

export function CreateRecipePage() {
  const { addRecipe } = useRecipes()
  const navigate = useNavigate()

  const handleSubmit = (recipeInput: {
    name: string
    description: string
    ingredients: Array<{ ingredientId: string; quantity: number }>
    instructions: string[]
    servings: number
    totalTime: number
    tags: string[]
  }) => {
    addRecipe(recipeInput)
    navigate('/recipes')
  }

  const handleCancel = () => {
    navigate('/recipes')
  }

  return (
    <div>
      <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
