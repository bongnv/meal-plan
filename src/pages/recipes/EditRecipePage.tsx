import { Container, Loader, Title } from '@mantine/core'
import { useNavigate, useParams } from 'react-router-dom'

import { RecipeForm } from '../../components/recipes/RecipeForm'
import { useRecipes } from '../../contexts/RecipeContext'

import type { RecipeFormValues } from '../../types/recipe'

export function EditRecipePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getRecipeById, updateRecipe, loading } = useRecipes()

  const recipe = id ? getRecipeById(id) : null

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!id || !recipe) return
    const updatedRecipe = { ...recipe, ...values }
    await updateRecipe(updatedRecipe)
    navigate('/recipes')
  }

  const handleCancel = () => {
    navigate('/recipes')
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Loader />
      </Container>
    )
  }

  if (!recipe) {
    return (
      <Container size="md" py="xl">
        <Title order={1}>Recipe not found</Title>
      </Container>
    )
  }

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">
        Edit Recipe
      </Title>
      <RecipeForm
        recipe={recipe}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Container>
  )
}
