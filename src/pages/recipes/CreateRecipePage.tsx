import { Container, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import { RecipeForm } from '../../components/recipes/RecipeForm'
import { recipeService } from '../../services/recipeService'

import type { RecipeFormValues } from '../../types/recipe'

export function CreateRecipePage() {
  const navigate = useNavigate()

  const handleSubmit = async (values: RecipeFormValues) => {
    await recipeService.add({
      ...values,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    void navigate('/recipes')
  }

  const handleCancel = () => {
    void navigate('/recipes')
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
