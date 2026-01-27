import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconClock, IconSearch } from '@tabler/icons-react'
import { useState, useMemo } from 'react'

import { useRecipes } from '../../contexts/RecipeContext'
import { getExcludedRecipeIds } from '../../utils/recipes/circularDependency'

import type { SubRecipe } from '../../types/recipe'

interface SubRecipeSelectorProps {
  open: boolean
  onClose: () => void
  onAdd: (subRecipe: SubRecipe) => void
  currentRecipeId?: string
}

export function SubRecipeSelector({
  open,
  onClose,
  onAdd,
  currentRecipeId,
}: SubRecipeSelectorProps) {
  const { recipes, getRecipeById } = useRecipes()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [servings, setServings] = useState<number | string>(1)
  const [displayName, setDisplayName] = useState('')

  // Get excluded recipe IDs to prevent circular dependencies
  const excludedIds = useMemo(() => {
    if (!currentRecipeId) return []
    return getExcludedRecipeIds(currentRecipeId, recipes)
  }, [currentRecipeId, recipes])

  // Filter recipes by search term
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [recipes, searchTerm])

  const selectedRecipe = selectedRecipeId
    ? getRecipeById(selectedRecipeId)
    : null

  const handleAdd = () => {
    if (!selectedRecipeId || typeof servings !== 'number' || servings <= 0) {
      return
    }

    onAdd({
      recipeId: selectedRecipeId,
      servings,
      displayName: displayName.trim() || undefined,
    })

    // Reset form
    setSelectedRecipeId(null)
    setServings(1)
    setDisplayName('')
    setSearchTerm('')
    onClose()
  }

  const handleCancel = () => {
    // Reset form
    setSelectedRecipeId(null)
    setServings(1)
    setDisplayName('')
    setSearchTerm('')
    onClose()
  }

  const handleRecipeSelect = (recipeId: string) => {
    if (excludedIds.includes(recipeId)) {
      return // Don't allow selecting excluded recipes
    }
    setSelectedRecipeId(recipeId)
  }

  const isAddDisabled =
    !selectedRecipeId || typeof servings !== 'number' || servings <= 0

  return (
    <Modal
      opened={open}
      onClose={handleCancel}
      title="Select Sub-Recipe"
      size="lg"
    >
      <Stack gap="md">
        {/* Search Input */}
        <TextInput
          placeholder="Search recipes..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={event => setSearchTerm(event.currentTarget.value)}
        />

        {/* Recipe List */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Available Recipes
          </Text>
          <ScrollArea h={300} type="auto">
            <Stack gap="xs">
              {filteredRecipes.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="lg">
                  No recipes found
                </Text>
              ) : (
                filteredRecipes.map(recipe => {
                  const isExcluded = excludedIds.includes(recipe.id)
                  const isSelected = selectedRecipeId === recipe.id

                  return (
                    <Card
                      key={recipe.id}
                      withBorder
                      padding="sm"
                      radius="md"
                      style={{
                        cursor: isExcluded ? 'not-allowed' : 'pointer',
                        backgroundColor: isSelected
                          ? 'var(--mantine-color-blue-0)'
                          : undefined,
                        borderColor: isSelected
                          ? 'var(--mantine-color-blue-6)'
                          : undefined,
                        opacity: isExcluded ? 0.5 : 1,
                      }}
                      onClick={() => handleRecipeSelect(recipe.id)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Box style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text fw={500} size="sm">
                              {recipe.name}
                            </Text>
                            {isExcluded && (
                              <Badge size="xs" color="red">
                                Circular Dependency
                              </Badge>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {recipe.description}
                          </Text>
                          <Group gap="md" mt={4}>
                            <Group gap={4}>
                              <IconClock size={14} />
                              <Text size="xs" c="dimmed">
                                {recipe.prepTime} min prep
                              </Text>
                            </Group>
                            <Group gap={4}>
                              <IconClock size={14} />
                              <Text size="xs" c="dimmed">
                                {recipe.cookTime} min cook
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {recipe.servings} servings
                            </Text>
                          </Group>
                        </Box>
                      </Group>
                    </Card>
                  )
                })
              )}
            </Stack>
          </ScrollArea>
        </Box>

        {/* Selected Recipe Details */}
        {selectedRecipe && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Configure Sub-Recipe
            </Text>
            <Stack gap="sm">
              <Group grow>
                <NumberInput
                  label="Servings"
                  placeholder="e.g., 1, 2, 4, 8"
                  value={servings}
                  onChange={setServings}
                  min={0.1}
                  step={1}
                  decimalScale={1}
                  required
                />
                <TextInput
                  label="Custom Name (optional)"
                  placeholder="e.g., Filling, Topping"
                  value={displayName}
                  onChange={event => setDisplayName(event.currentTarget.value)}
                />
              </Group>
              <Text size="xs" c="dimmed">
                Adding: {servings} servings of {selectedRecipe.name}
                {displayName && ` (${displayName})`}
              </Text>
            </Stack>
          </Box>
        )}

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAddDisabled}>
            Add Sub-Recipe
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
