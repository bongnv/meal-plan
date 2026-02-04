import { Box, Container, Grid, Stack, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MealPlanForm } from '../../components/mealPlans/MealPlanForm'
import { RecipeSelector } from '../../components/mealPlans/RecipeSelector'
import { useServices } from '../../contexts/ServicesContext'

import type { MealPlan, MealType } from '../../types/mealPlan'

export function AddMealPlanPage() {
  const navigate = useNavigate()
  const { mealPlanService, recipeService, ingredientService } = useServices()
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | undefined>()
  const recipes =
    useLiveQuery(async () => recipeService.getActiveRecipes(), []) ?? []
  const ingredients =
    useLiveQuery(async () => ingredientService.getIngredients(), []) ?? []

  // Get date and mealType from query params
  const date =
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  const mealType = (searchParams.get('mealType') as MealType) || 'lunch'

  const handleSubmit = async (mealPlan: Partial<MealPlan>) => {
    const { id: _, ...mealPlanData } = mealPlan as MealPlan
    await mealPlanService.add(mealPlanData)
    void navigate('/meal-plans')
  }

  const handleCancel = () => {
    void navigate('/meal-plans')
  }

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
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
          Add Meal
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
              date={date}
              mealType={mealType}
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
