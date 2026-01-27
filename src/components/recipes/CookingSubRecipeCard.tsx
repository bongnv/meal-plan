import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../../db/database'
import { formatQuantity } from '../../utils/formatQuantity'

import type { Recipe, SubRecipe } from '../../types/recipe'

interface CookingSubRecipeCardProps {
  subRecipe: SubRecipe
  subRecipeData?: Recipe
  servingMultiplier: number
  isCompleted: boolean
  onToggleComplete: () => void
  onViewDetails?: () => void
}

export function CookingSubRecipeCard({
  subRecipe,
  subRecipeData,
  servingMultiplier,
  isCompleted,
  onToggleComplete,
  onViewDetails,
}: CookingSubRecipeCardProps) {
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []
  const [expanded, setExpanded] = useState(false)

  if (!subRecipeData) {
    return (
      <Card withBorder padding="md" style={{ opacity: 0.5 }}>
        <Text c="red">Sub-recipe not found: {subRecipe.recipeId}</Text>
      </Card>
    )
  }

  const displayName = subRecipe.displayName || subRecipeData.name
  // Calculate actual servings being made (original sub-recipe servings * serving multiplier)
  const actualServingsBeingMade = subRecipeData.servings * servingMultiplier
  const totalPrepTime = subRecipeData.prepTime
  const totalCookTime = subRecipeData.cookTime

  return (
    <Card
      withBorder
      padding="md"
      style={{
        borderColor: isCompleted
          ? 'var(--mantine-color-gray-3)'
          : 'var(--mantine-color-blue-6)',
        borderWidth: isCompleted ? 1 : 2,
        opacity: isCompleted ? 0.6 : 1,
        backgroundColor: isCompleted
          ? 'var(--mantine-color-gray-0)'
          : undefined,
      }}
    >
      <Stack gap="md">
        {/* Header: Name, Checkbox, Times, Expand/Collapse */}
        <Group justify="space-between" align="flex-start">
          <Group align="flex-start" style={{ flex: 1 }}>
            <Checkbox
              checked={isCompleted}
              onChange={onToggleComplete}
              size="lg"
              mt={2}
              aria-label={`Mark ${displayName} as complete`}
            />
            <Box style={{ flex: 1 }}>
              <Text
                fw={500}
                size="sm"
                mt={4}
                style={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}
              >
                {displayName}
              </Text>
              <Group gap={8} mt={4}>
                <Group gap={4}>
                  <Text size="xs">🍽️</Text>
                  <Text size="xs">
                    {formatQuantity(actualServingsBeingMade)} servings
                  </Text>
                </Group>
                <Group gap={4}>
                  <Text size="xs">⏱️</Text>
                  <Text size="xs">Prep: {totalPrepTime} min</Text>
                </Group>
                <Group gap={4}>
                  <Text size="xs">🔥</Text>
                  <Text size="xs">Cook: {totalCookTime} min</Text>
                </Group>
              </Group>
            </Box>
          </Group>

          {/* Action Buttons */}
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </ActionIcon>
            {onViewDetails && (
              <Button variant="light" size="xs" onClick={onViewDetails}>
                View Full Recipe →
              </Button>
            )}
          </Group>
        </Group>

        <Collapse in={expanded} transitionDuration={200}>
          <Stack gap="md">
            <Divider />

            {/* Ingredients List */}
            <Box>
              <Text fw={600} size="sm" mb="md">
                📋 Ingredients
              </Text>
              <Stack gap={4}>
                {subRecipeData.ingredients.map((ingredient, idx) => {
                  const ingredientData = ingredients.find(
                    ing => ing.id === ingredient.ingredientId
                  )
                  const scaledQuantity = ingredient.quantity * servingMultiplier
                  const displayUnit =
                    ingredient.unit === 'whole' ? '' : ingredient.unit
                  const ingredientName =
                    ingredient.displayName || ingredientData?.name || 'Unknown'
                  const quantity = formatQuantity(scaledQuantity)

                  return (
                    <Group key={idx} gap="xs" align="center">
                      <Checkbox
                        aria-label={`Ingredient: ${ingredientName}`}
                        size="sm"
                      />
                      <Text size="sm">
                        {quantity} {displayUnit} {ingredientName}
                      </Text>
                    </Group>
                  )
                })}
              </Stack>
            </Box>

            {/* Instructions */}
            {subRecipeData.instructions.length > 0 && (
              <Box>
                <Text fw={600} size="sm" mb="md">
                  📝 Instructions ({subRecipeData.instructions.length} steps)
                </Text>
                <Stack gap="md">
                  {subRecipeData.instructions.map((instruction, idx) => (
                    <Group key={idx} align="flex-start" gap="sm">
                      <Badge
                        size="lg"
                        variant="light"
                        color="blue"
                        style={{ minWidth: 32, flexShrink: 0 }}
                      >
                        {idx + 1}
                      </Badge>
                      <Text size="sm" style={{ flex: 1 }}>
                        {instruction}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  )
}
