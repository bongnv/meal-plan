import { useState } from 'react'

import { Container, Title } from '@mantine/core'

import { CalendarView } from '../../components/mealPlans/CalendarView'
import { MealPlanForm } from '../../components/mealPlans/MealPlanForm'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'

import type { MealPlan, MealType } from '../../types/mealPlan'

interface FormState {
  opened: boolean
  date: string
  mealType: MealType
  initialMeal?: MealPlan
}

export function MealPlansPage() {
  const { mealPlans, addMealPlan, updateMealPlan } = useMealPlans()
  const { recipes, getRecipeById } = useRecipes()
  
  const [formState, setFormState] = useState<FormState>({
    opened: false,
    date: '',
    mealType: 'lunch',
  })

  const handleAddMeal = (params: { date: string; mealType: MealType }) => {
    setFormState({
      opened: true,
      date: params.date,
      mealType: params.mealType,
      initialMeal: undefined,
    })
  }

  const handleEditMeal = (mealPlan: MealPlan) => {
    setFormState({
      opened: true,
      date: mealPlan.date,
      mealType: mealPlan.mealType,
      initialMeal: mealPlan,
    })
  }

  const handleFormSubmit = (mealPlan: Partial<MealPlan>) => {
    if (mealPlan.id) {
      // For update, we need the complete MealPlan object
      updateMealPlan(mealPlan as MealPlan)
    } else {
      // For add, we need all required fields except 'id'
      const { id: _, ...mealPlanData } = mealPlan as MealPlan
      addMealPlan(mealPlanData)
    }
  }

  const handleFormClose = () => {
    setFormState({
      opened: false,
      date: '',
      mealType: 'lunch',
      initialMeal: undefined,
    })
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
      
      <MealPlanForm
        recipes={recipes}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
        opened={formState.opened}
        date={formState.date}
        mealType={formState.mealType}
        initialMeal={formState.initialMeal}
      />
    </Container>
  )
}
