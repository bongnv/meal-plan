import { useState } from 'react'

import { DndContext, DragOverlay } from '@dnd-kit/core'
import { Box, Card, Container, Grid, Stack, Text, Badge, Group, Title } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'

import { CalendarView } from '../../components/mealPlans/CalendarView'
import { MealPlanForm } from '../../components/mealPlans/MealPlanForm'
import { RecipeSidebar } from '../../components/mealPlans/RecipeSidebar'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'

import type { MealPlan, MealType, RecipeMealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

interface FormState {
  opened: boolean
  date: string
  mealType: MealType
  initialMeal?: MealPlan
}

export function MealPlansPage() {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan } = useMealPlans()
  const { recipes, getRecipeById } = useRecipes()
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  
  const [formState, setFormState] = useState<FormState>({
    opened: false,
    date: '',
    mealType: 'lunch',
  })

  const handleAddMeal = (params: { date: string }) => {
    // Determine the meal type based on what already exists
    // Check if lunch exists, if so default to dinner
    const lunchExists = mealPlans.some(mp => mp.date === params.date && mp.mealType === 'lunch')
    const mealType: MealType = lunchExists ? 'dinner' : 'lunch'

    setFormState({
      opened: true,
      date: params.date,
      mealType,
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'recipe') {
      setActiveRecipe(active.data.current.recipe as Recipe)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveRecipe(null)
    const { active, over } = event

    if (!over) return

    // Check if we're dragging a recipe onto a meal slot
    if (
      active.data.current?.type === 'recipe' &&
      over.data.current?.type === 'mealSlot'
    ) {
      const recipe = active.data.current.recipe as Recipe
      const { dateString, mealType } = over.data.current as {
        dateString: string
        mealType: MealType
      }

      // Check if the target slot already has a meal
      const existingMeal = mealPlans.find(
        (m) => m.date === dateString && m.mealType === mealType
      )

      // If dropping on an occupied slot, try the other meal type
      let finalMealType = mealType
      if (existingMeal) {
        const alternateMealType: MealType = mealType === 'lunch' ? 'dinner' : 'lunch'
        const alternateHasMeal = mealPlans.find(
          (m) => m.date === dateString && m.mealType === alternateMealType
        )
        
        // Only switch if alternate is free
        if (!alternateHasMeal) {
          finalMealType = alternateMealType
        } else {
          // Both slots occupied, don't create meal plan
          return
        }
      }

      // Add the recipe as a meal plan
      addMealPlan({
        date: dateString,
        mealType: finalMealType,
        type: 'recipe',
        recipeId: recipe.id,
        servings: recipe.servings,
      } as Omit<RecipeMealPlan, 'id'>)
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Container size="xl" fluid>
        <Title order={1} mb="md">Meal Plans</Title>

        <Grid gutter="md">
          {/* Main Content Area - Calendar View with integrated view switcher */}
          <Grid.Col span={{ base: 12, lg: 9 }}>
            <CalendarView
              mealPlans={mealPlans}
              getRecipeById={getRecipeById}
              onAddMeal={handleAddMeal}
              onEditMeal={handleEditMeal}
              onDeleteMeal={(mealPlan) => deleteMealPlan(mealPlan.id)}
            />
          </Grid.Col>

          {/* Recipe Sidebar - always visible */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Box style={{ position: 'sticky', top: 16 }}>
              <RecipeSidebar />
            </Box>
          </Grid.Col>
        </Grid>

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

      <DragOverlay>
        {activeRecipe ? (
          <Card
            padding="sm"
            withBorder
            shadow="xl"
            style={{
              cursor: 'grabbing',
              opacity: 0.9,
            }}
          >
            <Stack gap="xs">
              <Text fw={500} size="sm">
                {activeRecipe.name}
              </Text>
              {activeRecipe.tags.length > 0 && (
                <Group gap={4}>
                  {activeRecipe.tags.map((tag) => (
                    <Badge key={tag} size="xs" variant="light">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap={4}>
                <IconClock size={14} />
                <Text size="xs" c="dimmed">
                  {activeRecipe.totalTime} min
                </Text>
              </Group>
            </Stack>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
