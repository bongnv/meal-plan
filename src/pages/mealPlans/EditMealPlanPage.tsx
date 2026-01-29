import {
  Box,
  Button,
  Container,
  Grid,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { MealPlanForm } from '../../components/mealPlans/MealPlanForm'
import { RecipeSelector } from '../../components/mealPlans/RecipeSelector'
import { db } from '../../db/database'
import { mealPlanService } from '../../services/mealPlanService'

import type { MealPlan } from '../../types/mealPlan'

export function EditMealPlanPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | undefined>()
  const recipes = useLiveQuery(async () => db.getActiveRecipes(), []) ?? []
  const ingredients =
    useLiveQuery(async () => db.ingredients.toArray(), []) ?? []
  const mealPlan = useLiveQuery(async () => {
    if (!id) return undefined
    return db.mealPlans.get(id)
  }, [id])
  const loading = mealPlan === undefined

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
  }

  const handleSubmit = async (updatedMealPlan: Partial<MealPlan>) => {
    if (updatedMealPlan.id) {
      await mealPlanService.update(updatedMealPlan as MealPlan)
      void navigate('/meal-plans')
    }
  }

  const handleCancel = () => {
    void navigate('/meal-plans')
  }

  const handleDelete = async (mealPlanId: string) => {
    await mealPlanService.delete(mealPlanId)
    void navigate('/meal-plans')
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" mt="xl">
          <Loader size="lg" />
          <Text>Loading meal plan...</Text>
        </Stack>
      </Container>
    )
  }

  if (!id) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Invalid meal plan ID
          </Text>
          <Button onClick={() => void navigate('/meal-plans')}>
            Back to Meal Plans
          </Button>
        </Stack>
      </Container>
    )
  }

  if (!mealPlan) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" mt="xl">
          <Text size="lg" c="red">
            Meal plan not found
          </Text>
          <Button onClick={() => void navigate('/meal-plans')}>
            Back to Meal Plans
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container
      size="xl"
      px={{ base: 'xs', sm: 'md' }}
      py={{ base: 'md', sm: 'xl' }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack gap="lg" style={{ height: '100%', minHeight: 0 }}>
        <Title order={1} style={{ flexShrink: 0 }}>
          Edit Meal
        </Title>

        <Grid
          gutter="md"
          style={{ flex: 1, minHeight: 0 }}
          styles={{
            inner: {
              height: '100%',
              maxHeight: '100%',
            },
          }}
        >
          {/* Form area */}
          <Grid.Col
            span={{ base: 12, md: isDesktop ? 7 : 12 }}
            style={{
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MealPlanForm
              recipes={recipes}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
              date={mealPlan.date}
              mealType={mealPlan.mealType}
              initialMeal={mealPlan}
              selectedRecipeId={selectedRecipeId}
            />
          </Grid.Col>

          {/* Recipe selector sidebar - desktop only */}
          {isDesktop && (
            <Grid.Col
              span={5}
              style={{
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box style={{ height: '100%', overflow: 'hidden' }}>
                <RecipeSelector
                  recipes={recipes}
                  ingredients={ingredients}
                  selectedRecipeId={
                    'recipeId' in mealPlan ? mealPlan.recipeId : undefined
                  }
                  onSelect={handleRecipeSelect}
                />
              </Box>
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </Container>
  )
}
