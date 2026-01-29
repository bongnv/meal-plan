import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { RecipeFilterPanel } from '../../components/recipes/RecipeFilterPanel'
import { RecipeImportModal } from '../../components/recipes/RecipeImportModal'
import { RecipeList } from '../../components/recipes/RecipeList'
import { db } from '../../db/database'
import { useRecipeFilters } from '../../hooks/useRecipeFilters'
import { recipeService } from '../../services/recipeService'

export const RecipesPage = () => {
  const navigate = useNavigate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recipes = useLiveQuery(async () => db.recipes.toArray(), []) ?? []
  const ingredients =
    useLiveQuery(async () => db.ingredients.toArray(), []) ?? []

  // Import modal state
  const [importModalOpened, setImportModalOpened] = useState(false)

  // Filter state and actions from custom hook
  const { filters, actions } = useRecipeFilters()

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    return recipeService.extractUniqueTags(recipes)
  }, [recipes])

  // Filter recipes using the service
  const filteredRecipes = useMemo(
    () => recipeService.filterRecipesAdvanced(recipes, filters),
    [recipes, filters]
  )

  const handleEdit = (id: string) => {
    navigate(`/recipes/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    const recipe = recipes.find(r => r.id === id)
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
        onConfirm: async () => {
          try {
            await recipeService.delete(id)
          } catch (err) {
            console.error('Failed to delete recipe:', err)
          }
        },
      })
    }
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>My Recipes</Title>
        <Group gap="sm">
          <Button variant="default" onClick={() => setImportModalOpened(true)}>
            Import with AI
          </Button>
          <Button onClick={() => navigate('/recipes/new')}>
            Create Recipe
          </Button>
        </Group>
      </Group>

      <RecipeImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
      />

      {/* Filters Section */}
      <Paper p="md" mb="xl" withBorder>
        <RecipeFilterPanel
          filters={filters}
          actions={actions}
          allTags={allTags}
          allIngredients={ingredients}
          resultsCount={filteredRecipes.length}
        />
      </Paper>

      {/* Show custom empty state when filters are active but no results */}
      {actions.hasActiveFilters && filteredRecipes.length === 0 ? (
        <Stack align="center" justify="center" mih={400}>
          <Title order={2} c="dimmed">
            No recipes match your filters
          </Title>
          <Text c="dimmed" size="lg">
            Try adjusting your search criteria
          </Text>
          <Button size="lg" mt="md" onClick={actions.clearFilters}>
            Clear All Filters
          </Button>
        </Stack>
      ) : (
        <RecipeList
          recipes={filteredRecipes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </Container>
  )
}
