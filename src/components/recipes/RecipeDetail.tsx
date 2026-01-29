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
  Title,
} from '@mantine/core'
import { IconPlus, IconMinus } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../../db/database'
import { formatQuantity } from '../../utils/formatQuantity'

import type { Recipe } from '../../types/recipe'

interface RecipeDetailProps {
  recipe: Recipe
  initialServings?: number // Override default servings (e.g., from meal plan)
}

export function RecipeDetail({ recipe, initialServings }: RecipeDetailProps) {
  const ingredients =
    useLiveQuery(async () => db.ingredients.toArray(), []) ?? []
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
              <Text size="sm">🍽️</Text>
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
              <Text size="sm">⏱️</Text>
              <Text size="sm" fw={500}>
                Prep: {recipe.prepTime} min
              </Text>
            </Group>
            <Group gap={4}>
              <Text size="sm">🔥</Text>
              <Text size="sm" fw={500}>
                Cook: {recipe.cookTime} min
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

        {/* Section-First Workflow: Group ingredients and instructions by section */}
        <Stack gap="xl">
          {recipe.sections.map((section, sectionIndex) => {
            // Calculate global instruction numbering offset
            const instructionOffset = recipe.sections
              .slice(0, sectionIndex)
              .reduce((acc, s) => acc + s.instructions.length, 0)

            // For single unnamed section, use traditional layout
            const isSimpleRecipe = recipe.sections.length === 1 && !section.name

            return (
              <Box key={sectionIndex}>
                {/* Section header - only show if named */}
                {section.name && (
                  <>
                    {sectionIndex > 0 && <Divider mb="xl" />}
                    <Title
                      order={2}
                      size="h3"
                      mb="lg"
                      mt={sectionIndex > 0 ? 'xl' : undefined}
                    >
                      {section.name}
                    </Title>
                  </>
                )}

                {/* Ingredients */}
                <Box mb="xl">
                  <Title order={3} size="h4" mb="md">
                    {isSimpleRecipe ? 'Ingredients' : 'Ingredients'}
                  </Title>
                  <Stack gap="xs">
                    {section.ingredients.map((ingredient, ingredientIndex) => {
                      const ingredientData = ingredients.find(
                        i => i.id === ingredient.ingredientId
                      )
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

                      // Generate unique index for checkbox state across all sections
                      const globalIndex =
                        recipe.sections
                          .slice(0, sectionIndex)
                          .reduce((acc, s) => acc + s.ingredients.length, 0) +
                        ingredientIndex

                      return (
                        <Checkbox
                          key={ingredientIndex}
                          checked={checkedIngredients.has(globalIndex)}
                          onChange={() => toggleIngredient(globalIndex)}
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

                {/* Instructions */}
                <Box>
                  <Title order={3} size="h4" mb="md">
                    {isSimpleRecipe ? 'Instructions' : 'Instructions'}
                  </Title>
                  <Stack gap="md">
                    {section.instructions.map(
                      (instruction, instructionIndex) => (
                        <Group
                          key={instructionIndex}
                          align="flex-start"
                          gap="sm"
                        >
                          <Badge
                            size="lg"
                            variant="light"
                            color="blue"
                            style={{ minWidth: 32, flexShrink: 0 }}
                          >
                            {instructionOffset + instructionIndex + 1}
                          </Badge>
                          <Text style={{ flex: 1 }}>{instruction}</Text>
                        </Group>
                      )
                    )}
                  </Stack>
                </Box>
              </Box>
            )
          })}
        </Stack>
      </Stack>
    </Box>
  )
}
