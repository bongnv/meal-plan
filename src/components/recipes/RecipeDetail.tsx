import {
  ActionIcon,
  Badge,
  Box,
  Checkbox,
  Divider,
  Group,
  Image,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconUsers, IconClock, IconPlus, IconMinus } from '@tabler/icons-react'
import { useState } from 'react'

import { useIngredients } from '../../contexts/IngredientContext'
import { formatQuantity } from '../../utils/formatQuantity'

import type { Recipe } from '../../types/recipe'

interface RecipeDetailProps {
  recipe: Recipe
  initialServings?: number // Override default servings (e.g., from meal plan)
}

export function RecipeDetail({ recipe, initialServings }: RecipeDetailProps) {
  const { getIngredientById } = useIngredients()
  const [servings, setServings] = useState(initialServings ?? recipe.servings)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  )

  const servingMultiplier = servings / recipe.servings

  const adjustServings = (delta: number) => {
    const newServings = servings + delta
    if (newServings > 0) {
      setServings(newServings)
    }
  }

  const toggleIngredient = (index: number) => {
    const newSet = new Set(checkedIngredients)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setCheckedIngredients(newSet)
  }

  return (
    <Box>
      <Stack gap="lg">
        {/* Hero Image */}
        {recipe.imageUrl && (
          <Box
            style={{
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              radius="md"
              fit="cover"
              h={{ base: 200, sm: 300, md: 400 }}
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23e9ecef' width='800' height='400'/%3E%3Ctext fill='%23868e96' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage not available%3C/text%3E%3C/svg%3E"
            />
          </Box>
        )}

        {/* Meta Information and Tags */}
        <Box>
          {/* Meta Information */}
          <Group gap="md" mb="md">
            <Group gap={4}>
              <IconUsers size={18} />
              <Text size="sm" fw={500}>
                {servings} servings
              </Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => adjustServings(-1)}
                aria-label="Decrease servings"
              >
                <IconMinus size={14} />
              </ActionIcon>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => adjustServings(1)}
                aria-label="Increase servings"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
            <Group gap={4}>
              <IconClock size={18} />
              <Text size="sm" fw={500}>
                {recipe.totalTime} min
              </Text>
            </Group>
          </Group>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <Group gap="xs" mb="md">
              {recipe.tags.map(tag => (
                <Badge key={tag} variant="light" color="blue">
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          {/* Recipe Description */}
          <Text size="lg">{recipe.description || 'No description'}</Text>
        </Box>

        <Divider />

        {/* Ingredients Section */}
        <Box>
          <Title order={2} size="h3" mb="md">
            Ingredients
          </Title>
          <Stack gap="xs">
            {recipe.ingredients.map((ingredient, index) => {
              const ingredientData = getIngredientById(ingredient.ingredientId)
              const displayName =
                ingredient.displayName ||
                ingredientData?.name ||
                'Unknown Ingredient'
              // Use recipe ingredient unit (migration ensures all recipes have units)
              const unit = ingredient.unit || 'piece'
              // Hide "whole" unit for natural reading (e.g., "4 eggs" instead of "4 whole eggs")
              const displayUnit = unit === 'whole' ? '' : unit
              const adjustedQuantity = formatQuantity(
                ingredient.quantity * servingMultiplier
              )

              return (
                <Checkbox
                  key={index}
                  checked={checkedIngredients.has(index)}
                  onChange={() => toggleIngredient(index)}
                  label={
                    <Text>
                      <Text component="span" fw={500}>
                        {adjustedQuantity} {displayUnit}
                      </Text>{' '}
                      {displayName}
                    </Text>
                  }
                />
              )
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Instructions Section */}
        <Box>
          <Title order={2} size="h3" mb="md">
            Instructions
          </Title>
          <Stack gap="md">
            {recipe.instructions.map((instruction, index) => (
              <Group key={index} align="flex-start" gap="md">
                <ThemeIcon
                  size="lg"
                  radius="xl"
                  variant="filled"
                  color="yellow"
                  style={{ flexShrink: 0 }}
                >
                  <Text size="sm" fw={600}>
                    {index + 1}
                  </Text>
                </ThemeIcon>
                <Text style={{ flex: 1, paddingTop: 2 }}>{instruction}</Text>
              </Group>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
