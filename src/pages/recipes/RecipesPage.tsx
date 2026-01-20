import { Button, Container, Group, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useNavigate } from 'react-router-dom'

import { RecipeList } from '../../components/recipes/RecipeList'
import { useRecipes } from '../../contexts/RecipeContext'

export const RecipesPage = () => {
  const navigate = useNavigate()
  const { recipes, deleteRecipe } = useRecipes()

  const handleEdit = (id: string) => {
    navigate(`/recipes/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    const recipe = recipes.find((r) => r.id === id)
    if (recipe) {
      modals.openConfirmModal({
        title: 'Delete Recipe',
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete "{recipe.name}"? This action cannot
            be undone.
          </Text>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: () => deleteRecipe(id),
      })
    }
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>My Recipes</Title>
        <Button onClick={() => navigate('/recipes/new')}>Create Recipe</Button>
      </Group>

      <RecipeList
        recipes={recipes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Container>
  )
}
