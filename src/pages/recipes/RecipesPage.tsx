import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  MultiSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { RecipeImportModal } from '../../components/recipes/RecipeImportModal'
import { RecipeList } from '../../components/recipes/RecipeList'
import { db } from '../../db/database'
import { recipeService } from '../../services/recipeService'

import type { TimeRange } from '../../services/recipeService'

export const RecipesPage = () => {
  const navigate = useNavigate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []

  // Import modal state
  const [importModalOpened, setImportModalOpened] = useState(false)

  // Filter state
  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>(null)

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [recipes])

  // Filter recipes using the service
  const filteredRecipes = useMemo(
    () =>
      recipeService.filterRecipesAdvanced(recipes, {
        searchText,
        selectedTags,
        selectedIngredients,
        timeRange,
      }),
    [recipes, searchText, selectedTags, selectedIngredients, timeRange]
  )

  // Check if any filters are active
  const hasActiveFilters =
    searchText !== '' ||
    selectedTags.length > 0 ||
    selectedIngredients.length > 0 ||
    timeRange !== null

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText('')
    setSelectedTags([])
    setSelectedIngredients([])
    setTimeRange(null)
  }

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
        <Stack gap="md">
          <Group gap="md" align="flex-start">
            {/* Search by name */}
            <TextInput
              placeholder="Search recipes..."
              leftSection={<IconSearch size={16} />}
              value={searchText}
              onChange={e => setSearchText(e.currentTarget.value)}
              style={{ flex: 1 }}
            />

            {/* Clear filters button */}
            {hasActiveFilters && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={handleClearFilters}
                size="lg"
                title="Clear all filters"
              >
                <IconX size={18} />
              </ActionIcon>
            )}
          </Group>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <MultiSelect
              placeholder="Filter by tags..."
              data={allTags}
              value={selectedTags}
              onChange={setSelectedTags}
              searchable
              clearable
              leftSection={<IconFilter size={16} />}
            />
          )}

          {/* Ingredient filter */}
          {ingredients.length > 0 && (
            <MultiSelect
              placeholder="Filter by ingredients..."
              data={ingredients.map(ing => ({
                value: ing.id,
                label: ing.name,
              }))}
              value={selectedIngredients}
              onChange={setSelectedIngredients}
              searchable
              clearable
              leftSection={<IconFilter size={16} />}
            />
          )}

          {/* Time range filter */}
          <Group gap="xs" align="center">
            <Text size="sm" fw={500}>
              Time:
            </Text>
            <SegmentedControl
              value={timeRange || ''}
              onChange={value =>
                setTimeRange(value === '' ? null : (value as TimeRange))
              }
              data={[
                { label: 'All', value: '' },
                { label: '< 30 min', value: 'under-30' },
                { label: '30-60 min', value: '30-60' },
                { label: '> 60 min', value: 'over-60' },
              ]}
            />
          </Group>

          {/* Results count */}
          {hasActiveFilters && (
            <Group gap="xs">
              <Badge variant="light" size="lg">
                {filteredRecipes.length}{' '}
                {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
              </Badge>
              <Button
                variant="subtle"
                size="compact-sm"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Show custom empty state when filters are active but no results */}
      {hasActiveFilters && filteredRecipes.length === 0 ? (
        <Stack align="center" justify="center" mih={400}>
          <Title order={2} c="dimmed">
            No recipes match your filters
          </Title>
          <Text c="dimmed" size="lg">
            Try adjusting your search criteria
          </Text>
          <Button size="lg" mt="md" onClick={handleClearFilters}>
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
