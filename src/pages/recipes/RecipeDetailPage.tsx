import {
  ActionIcon,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Tooltip,
  Box,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconEdit, IconTrash } from '@tabler/icons-react'
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

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'Delete Recipe',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete "{recipe.name}"? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        if (id) {
          deleteRecipe(id)
          navigate('/recipes')
        }
      },
    })
  }

  return (
    <Container size="lg">
      <Stack gap="md">
        <Group>
          <Button variant="subtle" onClick={() => navigate('/recipes')}>
            ← Back to Recipes
          </Button>
        </Group>

        {/* Recipe Header */}
        <Box>
          <Group justify="space-between" align="flex-start" mb="lg">
            <Title order={1}>{recipe.name}</Title>
            <Group gap="xs">
              <Tooltip label="Edit recipe">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  onClick={() => handleEdit(recipe.id)}
                  aria-label="Edit recipe"
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete recipe">
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={handleDelete}
                  aria-label="Delete recipe"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Box>

        <RecipeDetail
          recipe={recipe}
          getRecipeById={getRecipeById}
          onRecipeClick={recipeId => navigate(`/recipes/${recipeId}`)}
        />
      </Stack>
    </Container>
  )
}
