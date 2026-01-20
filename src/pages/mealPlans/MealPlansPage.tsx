import { Container, Title } from '@mantine/core'

import { CalendarView } from '../../components/mealPlans/CalendarView'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'

import type { MealPlan, MealType } from '../../types/mealPlan'

export function MealPlansPage() {
  const { mealPlans } = useMealPlans()
  const { getRecipeById } = useRecipes()

  const handleAddMeal = (params: { date: string; mealType: MealType }) => {
    // TODO: Open meal plan form modal in future step
    console.log('Add meal:', params)
  }

  const handleEditMeal = (mealPlan: MealPlan) => {
    // TODO: Open meal plan form modal in future step
    console.log('Edit meal:', mealPlan)
  }

  return (
    <Container size="xl">
      <Title order={1} mb="md">
        Meal Plans
      </Title>
      
      <CalendarView
        mealPlans={mealPlans}
        getRecipeById={getRecipeById}
        onAddMeal={handleAddMeal}
        onEditMeal={handleEditMeal}
      />
    </Container>
  )
}
