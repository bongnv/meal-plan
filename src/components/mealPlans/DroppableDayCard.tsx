import { useDroppable } from '@dnd-kit/core'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
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
  onCopyMeal: (mealPlan: MealPlan) => void
  onDeleteMeal: (mealPlan: MealPlan) => void
}

export function DroppableDayCard({
  dateString,
  meals,
  getRecipeById,
  onAddMeal,
  onCopyMeal,
  onDeleteMeal,
}: DroppableDayCardProps) {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: 'daySlot',
      dateString,
    },
  })

  const handleMealClick = (meal: MealPlan) => {
    void navigate(`/meal-plans/${meal.id}`)
  }

  return (
    <Card
      ref={setNodeRef}
      shadow="sm"
      padding="md"
      withBorder
      style={{
        backgroundColor: isOver ? 'var(--mantine-color-blue-0)' : undefined,
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
              const typeInfo = !isRecipe ? getMealPlanTypeInfo(meal.type) : null

              return (
                <Box
                  key={meal.id}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleMealClick(meal)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      'var(--mantine-color-gray-1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      'var(--mantine-color-gray-0)'
                  }}
                >
                  <Group gap="sm" style={{ width: '100%' }} wrap="nowrap">
                    {/* Recipe image or meal type icon */}
                    {isRecipe && recipe?.imageUrl ? (
                      <Box style={{ flexShrink: 0 }}>
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          w={60}
                          h={60}
                          radius="sm"
                          fit="cover"
                          fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23e9ecef' width='60' height='60'/%3E%3Ctext fill='%23868e96' font-family='sans-serif' font-size='24' dy='9' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E🍽%3C/text%3E%3C/svg%3E"
                        />
                      </Box>
                    ) : (
                      <Text size="lg" style={{ flexShrink: 0 }}>
                        {isRecipe ? '🍽' : typeInfo?.icon || '🍽️'}
                      </Text>
                    )}
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" wrap="wrap">
                        <Badge variant="light" size="xs">
                          {meal.mealType.charAt(0).toUpperCase() +
                            meal.mealType.slice(1)}
                        </Badge>
                      </Group>
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
                      {isRecipe && 'servings' in meal && (
                        <Text size="xs" c="dimmed">
                          {(meal as { servings: number }).servings} servings
                        </Text>
                      )}
                    </Stack>
                    {isDesktop && (
                      <Group
                        gap={4}
                        wrap="nowrap"
                        style={{ flexShrink: 0 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Tooltip label="Copy">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            size="sm"
                            onClick={() => onCopyMeal(meal)}
                            aria-label="Copy"
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={async () =>
                              navigate(`/meal-plans/${meal.id}/edit`)
                            }
                            aria-label="Edit"
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => onDeleteMeal(meal)}
                            aria-label="Delete"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
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
