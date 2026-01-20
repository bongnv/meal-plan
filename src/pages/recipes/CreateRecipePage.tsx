import { Container, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import { RecipeForm } from '../../components/recipes/RecipeForm'
import { useRecipes } from '../../contexts/RecipeContext'

import type { RecipeFormValues } from '../../types/recipe'

export function CreateRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipes()

  const handleSubmit = async (values: RecipeFormValues) => {
    await addRecipe(values)
    navigate('/recipes')
  }

  const handleCancel = () => {
    navigate('/recipes')
  }

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">
        Create New Recipe
      </Title>
      <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </Container>
  )
}
