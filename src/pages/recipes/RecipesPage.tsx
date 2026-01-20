import { Button, Container, Group, Title } from '@mantine/core'
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
    // TODO: Add confirmation dialog (step 8)
    deleteRecipe(id)
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
