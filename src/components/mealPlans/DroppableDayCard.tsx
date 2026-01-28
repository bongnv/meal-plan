import { useDroppable } from '@dnd-kit/core'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { IconCopy, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

import { getMealPlanTypeInfo } from '../../types/mealPlan'

import type { MealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface DroppableDayCardProps {
  dateString: string
  meals: MealPlan[]
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onEditMeal: (mealPlan: MealPlan) => void
  onCopyMeal: (mealPlan: MealPlan) => void
  onDeleteMeal: (mealPlan: MealPlan) => void
}

export function DroppableDayCard({
  dateString,
  meals,
  getRecipeById,
  onAddMeal,
  onEditMeal,
  onCopyMeal,
  onDeleteMeal,
}: DroppableDayCardProps) {
  const navigate = useNavigate()

  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: 'daySlot',
      dateString,
    },
  })

  const handleMealClick = (meal: MealPlan) => {
    navigate(`/meal-plans/${meal.id}`)
  }

  return (
    <Card
      ref={setNodeRef}
      shadow="sm"
      padding="md"
      withBorder
      style={{
        backgroundColor: isOver
          ? 'var(--mantine-color-blue-0)'
          : undefined,
        minHeight: '100px',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Stack gap="sm">
        {meals.length === 0 ? (
          <Box style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text size="sm" c="dimmed" mb="sm">
              No meals planned
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={() => onAddMeal({ date: dateString })}
            >
              Add Meal
            </Button>
          </Box>
        ) : (
          <>
            {meals.map(meal => {
              const isRecipe = meal.type === 'recipe'
              const recipe = isRecipe
                ? getRecipeById((meal as { recipeId: string }).recipeId)
                : null
              const typeInfo = !isRecipe
                ? getMealPlanTypeInfo(meal.type)
                : null

              return (
                <Box
                  key={meal.id}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleMealClick(meal)}
                >
                  <Group justify="space-between" wrap="nowrap" align="center">
                    <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                      <Text size="lg" style={{ flexShrink: 0 }}>
                        {meal.mealType === 'lunch' ? '🥗' : '🍽️'}
                      </Text>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="light" size="xs">
                            {meal.mealType.charAt(0).toUpperCase() +
                              meal.mealType.slice(1)}
                          </Badge>
                        </Group>
                        <Group gap="xs">
                          {isRecipe && (
                            <Text size="xs" style={{ flexShrink: 0 }}>
                              🍽
                            </Text>
                          )}
                          {!isRecipe && typeInfo && (
                            <Text size="xs" style={{ flexShrink: 0 }}>
                              {typeInfo.icon}
                            </Text>
                          )}
                          <Text
                            size="sm"
                            fw={500}
                            lineClamp={1}
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {isRecipe
                              ? recipe?.name || 'Unknown Recipe'
                              : (meal as { customText?: string }).customText ||
                                typeInfo?.label ||
                                ''}
                          </Text>
                        </Group>
                        {isRecipe && 'servings' in meal && (
                          <Text size="xs" c="dimmed">
                            {(meal as { servings: number }).servings} servings
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    <Group
                      gap={4}
                      wrap="nowrap"
                      style={{ flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        size="sm"
                        onClick={() => onCopyMeal(meal)}
                        aria-label="Copy"
                      >
                        <IconCopy size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => onEditMeal(meal)}
                        aria-label="Edit"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => onDeleteMeal(meal)}
                        aria-label="Delete"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Box>
              )
            })}
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconPlus size={14} />}
              onClick={() => onAddMeal({ date: dateString })}
              fullWidth
            >
              Add Another Meal
            </Button>
          </>
        )}
      </Stack>
    </Card>
  )
}
