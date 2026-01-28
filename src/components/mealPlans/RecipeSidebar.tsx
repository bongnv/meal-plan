import {
  Button,
  Group,
  MultiSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'

import { db } from '../../db/database'
import { useRecipeFilter } from '../../hooks/useRecipeFilter'
import { recipeService } from '../../services/recipeService'

import { DraggableRecipeCard } from './DraggableRecipeCard'

import type { TimeRange } from '../../hooks/useRecipeFilter'

export const RecipeSidebar = () => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []

  // Filter state
  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>(null)

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    return recipeService.extractUniqueTags(recipes)
  }, [recipes])

  // Filter recipes using the hook
  const filteredRecipes = useRecipeFilter(recipes, {
    searchText,
    selectedTags,
    selectedIngredients,
    timeRange,
  })

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

  return (
    <Paper
      p="md"
      withBorder
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Stack gap="md" style={{ flexShrink: 0 }}>
        <Title order={3}>Recipes</Title>

        {/* Search input */}
        <TextInput
          placeholder="Search recipes..."
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={e => setSearchText(e.currentTarget.value)}
        />

        {/* Tag filter */}
        {allTags.length > 0 && (
          <MultiSelect
            placeholder="Filter by tags..."
            data={allTags}
            value={selectedTags}
            onChange={setSelectedTags}
            searchable
            clearable
            size="sm"
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
            size="sm"
          />
        )}

        {/* Time range filter */}
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
          size="xs"
          fullWidth
        />

        {/* Results count and clear button */}
        {hasActiveFilters && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {filteredRecipes.length}{' '}
              {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
            </Text>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Group>
        )}
      </Stack>

      {/* Scrollable recipe list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          marginTop: '1rem',
          minHeight: 0,
        }}
      >
        {filteredRecipes.length === 0 ? (
          <Stack align="center" justify="center" py="xl">
            <Text c="dimmed">No recipes found</Text>
            {hasActiveFilters && (
              <Button size="sm" variant="light" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap="sm" pb="md">
            {filteredRecipes.map(recipe => (
              <DraggableRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </Stack>
        )}
      </div>
    </Paper>
  )
}
