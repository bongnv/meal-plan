import {
  ActionIcon,
  Badge,
  Button,
  Group,
  MultiSelect,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

import type {
  RecipeFilterActions,
  RecipeFilterState,
} from '@/hooks/useRecipeFilters'
import type { Ingredient } from '@/types/ingredient'

export interface RecipeFilterPanelProps {
  filters: RecipeFilterState
  actions: RecipeFilterActions
  allTags: string[]
  allIngredients: Ingredient[]
  resultsCount?: number
}

/**
 * Reusable recipe filter panel component
 * Provides UI for filtering recipes by search text, tags, ingredients, and time range
 */
export function RecipeFilterPanel({
  filters,
  actions,
  allTags,
  allIngredients,
  resultsCount,
}: RecipeFilterPanelProps) {
  const timeRangeOptions = [
    { label: 'All', value: '' },
    { label: 'Under 30 min', value: 'under-30' },
    { label: '30-60 min', value: '30-60' },
    { label: 'Over 60 min', value: 'over-60' },
  ]

  const ingredientOptions = allIngredients.map(ing => ({
    value: ing.id,
    label: ing.name,
  }))

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search recipes..."
        leftSection={<IconSearch size={16} />}
        value={filters.searchText}
        onChange={e => actions.setSearchText(e.currentTarget.value)}
        rightSection={
          filters.searchText && (
            <ActionIcon
              size="sm"
              variant="transparent"
              onClick={() => actions.setSearchText('')}
            >
              <IconX size={14} />
            </ActionIcon>
          )
        }
      />

      <Stack gap="sm">
        <MultiSelect
          label="Tags"
          placeholder="Select tags..."
          data={allTags}
          value={filters.selectedTags}
          onChange={actions.setSelectedTags}
          searchable
          clearable
        />

        <MultiSelect
          label="Ingredients"
          placeholder="Select ingredients..."
          data={ingredientOptions}
          value={filters.selectedIngredients}
          onChange={actions.setSelectedIngredients}
          searchable
          clearable
        />

        <div>
          <div
            style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}
          >
            Total Time
          </div>
          <SegmentedControl
            data={timeRangeOptions}
            value={filters.timeRange || ''}
            onChange={value => actions.setTimeRange((value || null) as any)}
            fullWidth
          />
        </div>

        {actions.hasActiveFilters && (
          <Group justify="space-between" align="center">
            {resultsCount !== undefined && (
              <Badge variant="light" size="md">
                {resultsCount} {resultsCount === 1 ? 'recipe' : 'recipes'} found
              </Badge>
            )}
            <Button variant="subtle" size="sm" onClick={actions.clearFilters}>
              Clear Filters
            </Button>
          </Group>
        )}
      </Stack>
    </Stack>
  )
}
