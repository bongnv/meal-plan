import { useState } from 'react'

import { ActionIcon, Badge, Button, Container, Group, Stack, Text, Title, Loader, Box, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconEdit, IconTrash, IconCopy } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

import { CopyMealPlanModal } from '../../components/mealPlans/CopyMealPlanModal'
import { MealPlanForm } from '../../components/mealPlans/MealPlanForm'
import { RecipeDetail } from '../../components/recipes/RecipeDetail'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'
import { isRecipeMealPlan, isCustomMealPlan, getMealPlanTypeInfo } from '../../types/mealPlan'

import type { MealPlan } from '../../types/mealPlan'

export function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMealPlanById, updateMealPlan, deleteMealPlan, loading: mealPlansLoading } = useMealPlans()
  const { recipes, getRecipeById } = useRecipes()
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [copyModalOpened, setCopyModalOpened] = useState(false)

  if (mealPlansLoading) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Loader size="lg" />
          <Text>Loading meal plan...</Text>
        </Stack>
      </Container>
    )
  }

  if (!id) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Invalid meal plan ID
          </Text>
          <Button onClick={() => navigate('/meal-plans')}>Back to Meal Plans</Button>
        </Stack>
      </Container>
    )
  }

  const mealPlan = getMealPlanById(id)

  if (!mealPlan) {
    return (
      <Container>
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Meal plan not found
          </Text>
          <Button onClick={() => navigate('/meal-plans')}>Back to Meal Plans</Button>
        </Stack>
      </Container>
    )
  }

  const handleEdit = () => {
    setEditModalOpened(true)
  }

  const handleFormSubmit = (updatedMealPlan: Partial<MealPlan>) => {
    if (updatedMealPlan.id) {
      updateMealPlan(updatedMealPlan as MealPlan)
    }
    setEditModalOpened(false)
  }

  const handleFormClose = () => {
    setEditModalOpened(false)
  }

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'Delete Meal',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this meal? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteMealPlan(id)
        navigate('/meal-plans')
      },
    })
  }

  const isRecipe = isRecipeMealPlan(mealPlan)
  const recipe = isRecipe ? getRecipeById(mealPlan.recipeId) : null
  const mealDate = new Date(mealPlan.date)
  const formattedDate = mealDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const mealTypeLabel = mealPlan.mealType.charAt(0).toUpperCase() + mealPlan.mealType.slice(1)
  const mealIcon = mealPlan.mealType === 'lunch' ? '🥗' : '🍽️'
  
  // Create note for recipe detail
  const recipeNote = `${mealIcon} ${mealTypeLabel} • ${formattedDate}${mealPlan.note ? ` • ${mealPlan.note}` : ''}`

  return (
    <Container size="lg">
      <MealPlanForm
        recipes={recipes}
        opened={editModalOpened}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        onDelete={(id) => {
          deleteMealPlan(id)
          navigate('/meal-plans')
        }}
        date={mealPlan.date}
        mealType={mealPlan.mealType}
        initialMeal={mealPlan}
      />

      <Stack gap="md">
        {/* Back button */}
        <Group>
          <Button variant="subtle" onClick={() => navigate('/meal-plans')}>
            ← Back to Meal Plans
          </Button>
        </Group>

        {/* Recipe-based meal: Use RecipeDetail component */}
        {isRecipe && recipe ? (
          <Box>
            {/* Meal Header */}
            <Group justify="space-between" align="flex-start" mb="lg">
              <Box style={{ flex: 1 }}>
                <Title order={1} mb="md">
                  {recipe.name}
                </Title>
                <Text size="sm" c="dimmed" mb="xs">
                  {recipeNote}
                </Text>
              </Box>
              <Group gap="xs">
                <Tooltip label="Copy meal">
                  <ActionIcon
                    variant="light"
                    color="green"
                    size="lg"
                    onClick={() => setCopyModalOpened(true)}
                    aria-label="Copy meal"
                  >
                    <IconCopy size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Edit meal">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="lg"
                    onClick={handleEdit}
                    aria-label="Edit meal"
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete meal">
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    onClick={handleDelete}
                    aria-label="Delete meal"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
            <RecipeDetail recipe={recipe} initialServings={mealPlan.servings} />
          </Box>
        ) : (
          /* Custom meal: Show simple details */
          <Box>
            <Stack gap="lg">
              <Box>
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Title order={1} mb="md">
                      {getMealPlanTypeInfo(mealPlan.type)?.label || 'Meal'}
                    </Title>
                    <Text size="sm" c="dimmed" mb="xs">
                      {recipeNote}
                    </Text>
                  </Box>
                  <Group gap="xs">
                    <Button variant="light" color="green" onClick={() => setCopyModalOpened(true)}>
                      Copy
                    </Button>
                    <Button variant="light" color="blue" onClick={handleEdit}>
                      Edit
                    </Button>
                    <Button variant="light" color="red" onClick={handleDelete}>
                      Delete
                    </Button>
                  </Group>
                </Group>
                
                <Group gap="md" mb="md">
                  <Text size="xl">{getMealPlanTypeInfo(mealPlan.type)?.icon}</Text>
                  <Badge variant="light" color="blue" size="lg">
                    {mealTypeLabel}
                  </Badge>
                </Group>

                {isCustomMealPlan(mealPlan) && mealPlan.customText && (
                  <Text size="lg" c="dimmed">
                    {mealPlan.customText}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Copy Modal */}
      <CopyMealPlanModal
        opened={copyModalOpened}
        mealPlanId={mealPlan.id}
        onClose={() => setCopyModalOpened(false)}
      />
    </Container>
  )
}
