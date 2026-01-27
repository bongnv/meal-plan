import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../../db/database'
import { formatQuantity } from '../../utils/formatQuantity'

import type { Recipe, SubRecipe } from '../../types/recipe'

interface SubRecipeCardProps {
  subRecipe: SubRecipe
  recipeData?: Recipe
  expandable?: boolean
  onRemove?: () => void
  onClick?: () => void
}

export function SubRecipeCard({
  subRecipe,
  recipeData,
  expandable = false,
  onRemove,
  onClick,
}: SubRecipeCardProps) {
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []
  const getIngredientById = (id: string) => ingredients.find(i => i.id === id)
  const [expanded, setExpanded] = useState(false)

  const displayName =
    subRecipe.displayName || recipeData?.name || subRecipe.recipeId

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      style={{
        borderColor: 'var(--mantine-color-blue-6)',
        borderWidth: 2,
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={handleCardClick}
    >
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Text size="lg">🍳</Text>
            <Box style={{ flex: 1 }}>
              <Group gap="xs">
                <Badge variant="light" color="blue" size="sm">
                  SUB-RECIPE
                </Badge>
              </Group>
              <Text fw={500} size="sm" mt={4}>
                {displayName}
              </Text>
              <Tooltip
                label={`Uses ${subRecipe.servings} serving${subRecipe.servings !== 1 ? 's' : ''} of ${recipeData?.servings || '?'} from this recipe`}
                withArrow
              >
                <Text size="xs" c="dimmed" style={{ cursor: 'help' }}>
                  {subRecipe.servings} servings
                </Text>
              </Tooltip>
            </Box>
          </Group>

          {/* Action Buttons */}
          <Group gap="xs">
            {expandable && recipeData && (
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={e => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                aria-label={expanded ? 'Collapse details' : 'Expand details'}
              >
                {expanded ? (
                  <IconChevronUp size={18} />
                ) : (
                  <IconChevronDown size={18} />
                )}
              </ActionIcon>
            )}
            {onRemove && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={e => {
                  e.stopPropagation()
                  onRemove()
                }}
                aria-label="Remove sub-recipe"
              >
                <IconX size={18} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Expandable Ingredients Preview */}
        {expandable && recipeData && (
          <Collapse in={expanded} transitionDuration={0}>
            <Box
              style={{
                borderTop: '1px solid var(--mantine-color-gray-3)',
                paddingTop: 'var(--mantine-spacing-sm)',
              }}
            >
              <Text size="sm" fw={500} mb="xs">
                Ingredients:
              </Text>
              <Stack gap={4}>
                {recipeData.ingredients.map((ingredient, index) => {
                  const ingredientData = getIngredientById(
                    ingredient.ingredientId
                  )
                  const ingredientName =
                    ingredient.displayName ||
                    ingredientData?.name ||
                    'Unknown Ingredient'
                  const unit = ingredient.unit || 'piece'
                  const displayUnit = unit === 'whole' ? '' : unit
                  const servingMultiplier =
                    subRecipe.servings / (recipeData?.servings || 1)
                  const quantity = formatQuantity(
                    ingredient.quantity * servingMultiplier
                  )

                  return (
                    <Text key={index} size="xs" c="dimmed">
                      {quantity} {displayUnit} {ingredientName}
                    </Text>
                  )
                })}
              </Stack>
            </Box>
          </Collapse>
        )}
      </Stack>
    </Card>
  )
}
