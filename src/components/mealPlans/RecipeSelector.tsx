import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  MultiSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconClock, IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { recipeService } from '../../services/recipeService'
import { CUSTOM_MEAL_TYPES } from '../../types/mealPlan'

import type { TimeRange } from '../../services/recipeService'
import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

interface RecipeSelectorProps {
  recipes: Recipe[]
  ingredients: Ingredient[]
  selectedRecipeId?: string
  onSelect: (recipeId: string) => void
}

export const RecipeSelector = ({
  recipes,
  ingredients,
  selectedRecipeId,
  onSelect,
}: RecipeSelectorProps) => {
  // Filter state
  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>(null)

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    return recipeService.extractUniqueTags(recipes)
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

  // Filter custom meal types based on search text
  const filteredCustomOptions = useMemo(() => {
    if (!searchText) return CUSTOM_MEAL_TYPES
    return CUSTOM_MEAL_TYPES.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText])

  // Show custom text option if search doesn't match any recipe or predefined option
  const showCustomTextOption = useMemo(() => {
    if (!searchText.trim()) return false
    const hasRecipeMatch = filteredRecipes.length > 0
    const hasCustomMatch = filteredCustomOptions.length > 0
    return !hasRecipeMatch && !hasCustomMatch
  }, [searchText, filteredRecipes, filteredCustomOptions])

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
        <Title order={3}>Select Recipe</Title>

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
        {filteredRecipes.length === 0 &&
        filteredCustomOptions.length === 0 &&
        !showCustomTextOption ? (
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
            {/* Custom text option */}
            {showCustomTextOption && (
              <Card
                padding="sm"
                withBorder
                style={{
                  cursor: 'pointer',
                  borderColor: 'var(--mantine-color-green-6)',
                  borderWidth: 2,
                }}
                onClick={() => onSelect(`other:${searchText.trim()}`)}
              >
                <Stack gap="xs">
                  <Text fw={500} size="sm" c="green">
                    ✏️ Use custom text: "{searchText.trim()}"
                  </Text>
                </Stack>
              </Card>
            )}

            {/* Predefined custom meal options */}
            {filteredCustomOptions.map(option => (
              <Card
                key={option.value}
                padding="sm"
                withBorder
                style={{
                  cursor: 'pointer',
                  backgroundColor:
                    selectedRecipeId === `custom:${option.value}`
                      ? 'var(--mantine-color-blue-0)'
                      : undefined,
                  borderColor:
                    selectedRecipeId === `custom:${option.value}`
                      ? 'var(--mantine-color-blue-6)'
                      : undefined,
                  borderWidth:
                    selectedRecipeId === `custom:${option.value}` ? 2 : 1,
                }}
                onClick={() => onSelect(`custom:${option.value}`)}
              >
                <Stack gap="xs">
                  <Text fw={500} size="sm">
                    {option.icon} {option.label}
                  </Text>
                </Stack>
              </Card>
            ))}

            {/* Recipe options */}
            {filteredRecipes.map(recipe => {
              const isSelected = selectedRecipeId === recipe.id
              return (
                <Card
                  key={recipe.id}
                  padding="sm"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'var(--mantine-color-blue-0)'
                      : undefined,
                    borderColor: isSelected
                      ? 'var(--mantine-color-blue-6)'
                      : undefined,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  onClick={() => onSelect(recipe.id)}
                >
                  <Stack gap="xs">
                    <Text fw={500} size="sm">
                      {recipe.name}
                    </Text>
                    {recipe.tags.length > 0 && (
                      <Group gap={4}>
                        {recipe.tags.map(tag => (
                          <Badge key={tag} size="xs" variant="light">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                    )}
                    <Box>
                      <Group gap={4}>
                        <IconClock size={14} />
                        <Text size="xs" c="dimmed">
                          {recipe.prepTime + recipe.cookTime} min
                        </Text>
                      </Group>
                    </Box>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        )}
      </div>
    </Paper>
  )
}
