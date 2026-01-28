import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Drawer,
  Group,
  MultiSelect,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconCheck, IconSearch, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { recipeService } from '../../services/recipeService'
import { CUSTOM_MEAL_TYPES } from '../../types/mealPlan'

import type { TimeRange } from '../../services/recipeService'
import type { Ingredient } from '../../types/ingredient'
import type { Recipe } from '../../types/recipe'

interface RecipeSelectorModalProps {
  opened: boolean
  onClose: () => void
  recipes: Recipe[]
  ingredients: Ingredient[]
  selectedValue: string
  onSelect: (value: string) => void
}

export function RecipeSelectorModal({
  opened,
  onClose,
  recipes,
  ingredients,
  selectedValue,
  onSelect,
}: RecipeSelectorModalProps) {
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

  const handleSelectRecipe = (recipeId: string) => {
    onSelect(`recipe:${recipeId}`)
    onClose()
  }

  const handleSelectCustom = (customType: string) => {
    onSelect(`custom:${customType}`)
    onClose()
  }

  const handleSelectCustomText = () => {
    onSelect(searchText.trim())
    onClose()
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Select Meal"
      position="bottom"
      size="90%"
      styles={{
        body: { padding: 0, height: 'calc(90vh - 60px)' },
        content: { display: 'flex', flexDirection: 'column' },
      }}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Filters Section */}
        <Paper
          p="md"
          style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
        >
          <Stack gap="sm">
            {/* Search input */}
            <TextInput
              placeholder="Search recipes..."
              leftSection={<IconSearch size={16} />}
              value={searchText}
              onChange={e => setSearchText(e.currentTarget.value)}
              rightSection={
                searchText && (
                  <ActionIcon
                    variant="transparent"
                    onClick={() => setSearchText('')}
                    size="sm"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )
              }
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
            <Box>
              <Text size="sm" fw={500} mb={4}>
                Prep + Cook Time
              </Text>
              <SegmentedControl
                value={timeRange || ''}
                onChange={value => setTimeRange(value as TimeRange)}
                data={[
                  { label: 'All', value: '' },
                  { label: '< 30m', value: '<30' },
                  { label: '30-60m', value: '30-60' },
                  { label: '> 60m', value: '>60' },
                ]}
                fullWidth
                size="xs"
              />
            </Box>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleClearFilters}
                fullWidth
              >
                Clear all filters
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Results Section */}
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap="md" p="md">
            {/* Custom text option - show first if applicable */}
            {showCustomTextOption && (
              <Box>
                <Title order={5} mb="xs" c="green">
                  Custom Text
                </Title>
                <Card
                  padding="sm"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor: 'var(--mantine-color-green-6)',
                    borderWidth: 2,
                  }}
                  onClick={handleSelectCustomText}
                >
                  <Group gap="sm" wrap="nowrap">
                    <Box style={{ fontSize: 24 }}>✏️</Box>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text fw={500} size="sm" c="green">
                        Use custom text:
                      </Text>
                      <Text size="sm">"{searchText.trim()}"</Text>
                    </Stack>
                  </Group>
                </Card>
              </Box>
            )}

            {/* Custom Meal Types Section */}
            {filteredCustomOptions.length > 0 && (
              <Box>
                <Title order={5} mb="xs">
                  Quick Options
                </Title>
                <Stack gap="xs">
                  {filteredCustomOptions
                    .filter(t => t.value !== 'other')
                    .map(type => {
                      const isSelected =
                        selectedValue === `custom:${type.value}`
                      return (
                        <Card
                          key={type.value}
                          padding="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? 'var(--mantine-color-blue-light)'
                              : undefined,
                          }}
                          onClick={() => handleSelectCustom(type.value)}
                        >
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Text size="lg">{type.icon}</Text>
                              <Text fw={500}>{type.label}</Text>
                            </Group>
                            {isSelected && (
                              <IconCheck
                                size={20}
                                color="var(--mantine-color-blue-6)"
                              />
                            )}
                          </Group>
                        </Card>
                      )
                    })}
                </Stack>
              </Box>
            )}

            {/* No results message */}
            {filteredRecipes.length === 0 &&
              filteredCustomOptions.length === 0 &&
              !showCustomTextOption && (
                <Paper p="xl" withBorder>
                  <Text c="dimmed" ta="center">
                    {hasActiveFilters
                      ? 'No options match your search'
                      : 'No options available'}
                  </Text>
                </Paper>
              )}

            {/* Recipes Section */}
            {filteredRecipes.length > 0 && (
              <Box>
                <Group justify="space-between" mb="xs">
                  <Title order={5}>Recipes ({filteredRecipes.length})</Title>
                  {hasActiveFilters && (
                    <Badge size="sm" variant="light">
                      Filtered
                    </Badge>
                  )}
                </Group>

                {filteredRecipes.length === 0 ? (
                  <Paper p="xl" withBorder>
                    <Text c="dimmed" ta="center">
                      {hasActiveFilters
                        ? 'No recipes match your filters'
                        : 'No recipes available'}
                    </Text>
                  </Paper>
                ) : (
                  <Stack gap="xs">
                    {filteredRecipes.map(recipe => {
                      const totalTime = recipe.prepTime + recipe.cookTime
                      const isSelected = selectedValue === `recipe:${recipe.id}`
                      return (
                        <Card
                          key={recipe.id}
                          padding="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? 'var(--mantine-color-blue-light)'
                              : undefined,
                          }}
                          onClick={() => handleSelectRecipe(recipe.id)}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Group gap="xs" mb={4}>
                                <Text fw={500} truncate>
                                  {recipe.name}
                                </Text>
                                {isSelected && (
                                  <IconCheck
                                    size={20}
                                    color="var(--mantine-color-blue-6)"
                                    style={{ flexShrink: 0 }}
                                  />
                                )}
                              </Group>
                              <Group gap="xs">
                                <Badge size="xs" variant="light">
                                  {recipe.servings} servings
                                </Badge>
                                <Badge size="xs" variant="light">
                                  {totalTime}m
                                </Badge>
                              </Group>
                              {recipe.tags.length > 0 && (
                                <Group gap={4} mt={4}>
                                  {recipe.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} size="xs" variant="dot">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {recipe.tags.length > 3 && (
                                    <Badge size="xs" variant="dot">
                                      +{recipe.tags.length - 3}
                                    </Badge>
                                  )}
                                </Group>
                              )}
                            </Box>
                          </Group>
                        </Card>
                      )
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        </ScrollArea>
      </Box>
    </Drawer>
  )
}
