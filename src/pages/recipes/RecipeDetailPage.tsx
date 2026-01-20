import { Button, Container, Group, Loader, Stack, Text } from '@mantine/core'
import { useNavigate, useParams } from 'react-router-dom'

import { RecipeDetail } from '../../components/recipes/RecipeDetail'
import { useRecipes } from '../../contexts/RecipeContext'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecipeById, deleteRecipe, loading } = useRecipes()

  if (loading) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Loader size="lg" />
          <Text>Loading recipe...</Text>
        </Stack>
      </Container>
    )
  }

  if (!id) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Invalid recipe ID
          </Text>
          <Button onClick={() => navigate('/recipes')}>Back to Recipes</Button>
        </Stack>
      </Container>
    )
  }

  const recipe = getRecipeById(id)

  if (!recipe) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Recipe not found
          </Text>
          <Button onClick={() => navigate('/recipes')}>Back to Recipes</Button>
        </Stack>
      </Container>
    )
  }

  const handleEdit = (recipeId: string) => {
    navigate(`/recipes/${recipeId}/edit`)
  }

  const handleDelete = (recipeId: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`
      )
    ) {
      deleteRecipe(recipeId)
      navigate('/recipes')
    }
  }

  return (
    <Container size="lg">
      <Stack gap="md">
        <Group>
          <Button variant="subtle" onClick={() => navigate('/recipes')}>
            ← Back to Recipes
          </Button>
        </Group>

        <RecipeDetail
          recipe={recipe}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Stack>
    </Container>
  )
}
