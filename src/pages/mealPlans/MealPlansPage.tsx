import { DndContext, DragOverlay } from '@dnd-kit/core'
import {
  ActionIcon,
  Box,
  Card,
  Container,
  Drawer,
  Grid,
  Stack,
  Text,
  Badge,
  Group,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconMenu2, IconClock } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CalendarView } from '../../components/mealPlans/CalendarView'
import { RecipeSidebar } from '../../components/mealPlans/RecipeSidebar'
import { db } from '../../db/database'
import { mealPlanService } from '../../services/mealPlanService'

import type { MealType, RecipeMealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

export function MealPlansPage() {
  const navigate = useNavigate()
  const mealPlans = useLiveQuery(() => db.mealPlans.toArray(), []) ?? []
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [sidebarOpened, setSidebarOpened] = useState(false)

  // Detect if we're on desktop (>= 1024px)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const handleAddMeal = (params: { date: string }) => {
    // Determine the meal type based on what already exists
    // Default to lunch first, then dinner, then allow any
    const existingMeals = mealPlans.filter(mp => mp.date === params.date)

    let mealType: MealType = 'lunch'

    if (existingMeals.length > 0) {
      const hasLunch = existingMeals.some(mp => mp.mealType === 'lunch')
      const hasDinner = existingMeals.some(mp => mp.mealType === 'dinner')

      if (!hasLunch) {
        mealType = 'lunch'
      } else if (!hasDinner) {
        mealType = 'dinner'
      } else {
        // Both exist, default to lunch (user can change in page)
        mealType = 'lunch'
      }
    }

    navigate(`/meal-plans/new?date=${params.date}&mealType=${mealType}`)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'recipe') {
      setActiveRecipe(active.data.current.recipe as Recipe)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRecipe(null)
    const { active, over } = event

    if (!over) return

    // Check if we're dragging a recipe onto a day slot
    if (
      active.data.current?.type === 'recipe' &&
      over.data.current?.type === 'daySlot'
    ) {
      const recipe = active.data.current.recipe as Recipe
      const { dateString } = over.data.current as {
        dateString: string
      }

      // Determine meal type based on existing meals for that day
      const existingMeals = mealPlans.filter(mp => mp.date === dateString)

      let mealType: MealType = 'lunch'

      if (existingMeals.length > 0) {
        const hasLunch = existingMeals.some(mp => mp.mealType === 'lunch')
        const hasDinner = existingMeals.some(mp => mp.mealType === 'dinner')

        if (!hasLunch) {
          mealType = 'lunch'
        } else if (!hasDinner) {
          mealType = 'dinner'
        } else {
          // Both exist, add as lunch (can be edited later)
          mealType = 'lunch'
        }
      }

      // Add the recipe as a meal plan
      try {
        await mealPlanService.add({
          date: dateString,
          mealType,
          type: 'recipe',
          recipeId: recipe.id,
          servings: recipe.servings,
        } as Omit<RecipeMealPlan, 'id'>)
      } catch (err) {
        console.error('Failed to add meal plan:', err)
      }
    }
  }

  const content = (
    <>
      <Container
        size="xl"
        fluid
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Group
          justify="space-between"
          align="center"
          mb="md"
          style={{ flexShrink: 0 }}
        >
          <Title order={1}>Meal Plans</Title>
          {!isDesktop && (
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => setSidebarOpened(true)}
              aria-label="Open recipes"
            >
              <IconMenu2 size={20} />
            </ActionIcon>
          )}
        </Group>

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
          {/* Main Content Area - List View */}
          <Grid.Col
            span={{ base: 12, lg: 9 }}
            style={{
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CalendarView
              mealPlans={mealPlans}
              getRecipeById={id => recipes.find(r => r.id === id)}
              onAddMeal={handleAddMeal}
              onDeleteMeal={async mealPlan => {
                try {
                  await mealPlanService.delete(mealPlan.id)
                } catch (err) {
                  console.error('Failed to delete meal plan:', err)
                }
              }}
            />
          </Grid.Col>

          {/* Recipe Sidebar - desktop only */}
          {isDesktop && (
            <Grid.Col
              span={{ base: 12, lg: 3 }}
              style={{
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box style={{ height: '100%', overflow: 'hidden' }}>
                <RecipeSidebar />
              </Box>
            </Grid.Col>
          )}
        </Grid>
      </Container>

      {/* Drag overlay - desktop only */}
      {isDesktop && (
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
                    {activeRecipe.tags.map(tag => (
                      <Badge key={tag} size="xs" variant="light">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                )}
                <Group gap={4}>
                  <IconClock size={14} />
                  <Text size="xs" c="dimmed">
                    {activeRecipe.prepTime + activeRecipe.cookTime} min
                  </Text>
                </Group>
              </Stack>
            </Card>
          ) : null}
        </DragOverlay>
      )}

      {/* Mobile Drawer for recipes */}
      {!isDesktop && (
        <Drawer
          opened={sidebarOpened}
          onClose={() => setSidebarOpened(false)}
          title="Recipes"
          position="right"
          size="lg"
        >
          <RecipeSidebar />
        </Drawer>
      )}
    </>
  )

  // Wrap with DndContext only on desktop
  return isDesktop ? (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {content}
    </DndContext>
  ) : (
    content
  )
}
