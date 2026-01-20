import { useDroppable } from '@dnd-kit/core'
import { Box, Button, Group, Text, Anchor } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import { getMealPlanTypeInfo, isRecipeMealPlan } from '../../types/mealPlan'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface DroppableMealSlotProps {
  dateString: string
  mealType: MealType
  meal: MealPlan | undefined
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onEditMeal: (mealPlan: MealPlan) => void
}

export function DroppableMealSlot({
  dateString,
  mealType,
  meal,
  getRecipeById,
  onAddMeal,
  onEditMeal,
}: DroppableMealSlotProps) {
  const navigate = useNavigate()
  const { isOver, setNodeRef } = useDroppable({
    id: `${dateString}-${mealType}`,
    data: {
      type: 'mealSlot',
      dateString,
      mealType,
    },
  })

  const renderContent = () => {
    if (!meal) {
      return (
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          onClick={() => onAddMeal({ date: dateString })}
          fullWidth
          styles={{ root: { height: 'auto', padding: '4px' } }}
        >
          + Add Meal
        </Button>
      )
    }

    if (isRecipeMealPlan(meal)) {
      const recipe = getRecipeById(meal.recipeId)
      return (
        <Box onClick={() => onEditMeal(meal)} style={{ cursor: 'pointer', padding: '4px' }}>
          <Group gap={4} wrap="nowrap">
            <Text size="xs" style={{ flexShrink: 0 }}>🍽</Text>
            <Anchor
              size="xs"
              lineClamp={1}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/recipes/${meal.recipeId}`)
              }}
            >
              {recipe?.name || 'Unknown Recipe'}
            </Anchor>
          </Group>
        </Box>
      )
    }

    const typeInfo = getMealPlanTypeInfo(meal.type)
    return (
      <Box onClick={() => onEditMeal(meal)} style={{ cursor: 'pointer', padding: '4px' }}>
        <Group gap={4} wrap="nowrap">
          {typeInfo && <Text size="xs" style={{ flexShrink: 0 }}>{typeInfo.icon}</Text>}
          <Text size="xs" lineClamp={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meal.customText || typeInfo?.label || ''}
          </Text>
        </Group>
      </Box>
    )
  }

  return (
    <Box
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? 'var(--mantine-color-blue-1)' : undefined,
        borderRadius: '4px',
        minHeight: '28px',
        transition: 'background-color 0.2s',
      }}
    >
      {renderContent()}
    </Box>
  )
}
