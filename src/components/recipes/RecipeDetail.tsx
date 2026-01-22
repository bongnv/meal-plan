import {
  ActionIcon,
  Badge,
  Box,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconUsers, IconClock, IconPlus, IconMinus } from '@tabler/icons-react'
import { useState } from 'react'

import { useIngredients } from '../../contexts/IngredientContext'

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
  const [checkedInstructions, setCheckedInstructions] = useState<Set<number>>(
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

  const toggleInstruction = (index: number) => {
    const newSet = new Set(checkedInstructions)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setCheckedInstructions(newSet)
  }

  return (
    <Box>
      <Stack gap="lg">
        {/* Recipe Description */}
        <Box>
          <Text size="lg" mb="md">
            {recipe.description || 'No description'}
          </Text>

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
              const ingredientName =
                ingredientData?.name || 'Unknown Ingredient'
              const unit = ingredientData?.unit || ''
              const adjustedQuantity = (
                ingredient.quantity * servingMultiplier
              ).toFixed(1)

              return (
                <Checkbox
                  key={index}
                  checked={checkedIngredients.has(index)}
                  onChange={() => toggleIngredient(index)}
                  label={
                    <Text>
                      <Text component="span" fw={500}>
                        {adjustedQuantity} {unit}
                      </Text>{' '}
                      {ingredientName}
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
              <Checkbox
                key={index}
                checked={checkedInstructions.has(index)}
                onChange={() => toggleInstruction(index)}
                label={
                  <Text>
                    <Text component="span" fw={500}>
                      Step {index + 1}.
                    </Text>{' '}
                    {instruction}
                  </Text>
                }
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
