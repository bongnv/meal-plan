import {
  Badge,
  Box,
  Card,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useMemo } from 'react'

import { useRecipeFilters } from '../../hooks/useRecipeFilters'
import { recipeService } from '../../services/recipeService'
import { CUSTOM_MEAL_TYPES } from '../../types/mealPlan'
import { RecipeFilterPanel } from '../recipes/RecipeFilterPanel'

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

  // Filter custom meal types based on search text
  const filteredCustomOptions = useMemo(() => {
    if (!filters.searchText) return CUSTOM_MEAL_TYPES
    return CUSTOM_MEAL_TYPES.filter(option =>
      option.label.toLowerCase().includes(filters.searchText.toLowerCase())
    )
  }, [filters.searchText])

  // Show custom text option if search doesn't match any recipe or predefined option
  const showCustomTextOption = useMemo(() => {
    if (!filters.searchText.trim()) return false
    const hasRecipeMatch = filteredRecipes.length > 0
    const hasCustomMatch = filteredCustomOptions.length > 0
    return !hasRecipeMatch && !hasCustomMatch
  }, [filters.searchText, filteredRecipes, filteredCustomOptions])

  const handleSelectRecipe = (recipeId: string) => {
    onSelect(`recipe:${recipeId}`)
    onClose()
  }

  const handleSelectCustom = (customType: string) => {
    onSelect(`custom:${customType}`)
    onClose()
  }

  const handleSelectCustomText = () => {
    onSelect(filters.searchText.trim())
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
        <Box
          p="md"
          style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
        >
          <RecipeFilterPanel
            filters={filters}
            actions={actions}
            allTags={allTags}
            allIngredients={ingredients}
          />
        </Box>

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
                      <Text size="sm">"{filters.searchText.trim()}"</Text>
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
                    {actions.hasActiveFilters
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
                  {actions.hasActiveFilters && (
                    <Badge size="sm" variant="light">
                      Filtered
                    </Badge>
                  )}
                </Group>

                {filteredRecipes.length === 0 ? (
                  <Paper p="xl" withBorder>
                    <Text c="dimmed" ta="center">
                      {actions.hasActiveFilters
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
