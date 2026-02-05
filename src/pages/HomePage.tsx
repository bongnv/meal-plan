import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconCalendar,
  IconChefHat,
  IconShoppingCart,
} from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { useServices } from '@/contexts/ServicesContext'
import { isRecipeMealPlan, getMealPlanTypeInfo } from '@/types/mealPlan'
import {
  getNextMeal,
  getUpcomingMeals,
  formatMealDate,
} from '@/utils/mealPlanning/upcomingMeals'

export function HomePage() {
  const navigate = useNavigate()
  const { recipeService, mealPlanService, groceryListService } = useServices()

  // Fetch data
  const recipes =
    useLiveQuery(async () => recipeService.getActiveRecipes(), []) ?? []
  const mealPlans =
    useLiveQuery(async () => mealPlanService.getMealPlans(), []) ?? []
  const groceryLists =
    useLiveQuery(async () => groceryListService.getAllLists(), []) ?? []
  const groceryItems =
    useLiveQuery(async () => groceryListService.getAllItems(), []) ?? []

  // Get next meal and upcoming meals
  const nextMeal = getNextMeal(mealPlans)
  const upcomingMeals = getUpcomingMeals(mealPlans, 4).slice(1) // Skip first (it's the next meal)

  // Get most recent grocery list
  const activeList = groceryListService.getMostRecentList(groceryLists)

  // Get items for active list
  const activeListItems = activeList
    ? groceryItems.filter(item => item.listId === activeList.id)
    : []

  // Get recipe for a meal
  const getRecipeForMeal = (recipeId: string) => {
    return recipes.find(r => r.id === recipeId)
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Next Meal Section */}
        <div>
          <Title order={2} mb="md">
            🍽️ Next Meal
          </Title>
          {nextMeal ? (
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={async () => navigate(`/meal-plans/${nextMeal.id}`)}
            >
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  {formatMealDate(nextMeal.date, nextMeal.mealType)}
                </Text>
                {isRecipeMealPlan(nextMeal) ? (
                  <>
                    <Title order={3}>
                      {getRecipeForMeal(nextMeal.recipeId)?.name ||
                        'Unknown Recipe'}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {nextMeal.servings} servings
                    </Text>
                  </>
                ) : (
                  <>
                    <Title order={3}>
                      {nextMeal.customText || 'Custom Meal'}
                    </Title>
                    <Badge variant="light" size="sm">
                      {getMealPlanTypeInfo(nextMeal.type)?.label}
                    </Badge>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md" align="center">
                <Text c="dimmed">No meals planned yet</Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    onClick={async () => navigate('/meal-plans')}
                  >
                    Plan a Meal
                  </Button>
                  <Button
                    variant="subtle"
                    onClick={async () => navigate('/recipes')}
                  >
                    Browse Recipes
                  </Button>
                </Group>
              </Stack>
            </Card>
          )}
        </div>

        {/* Coming Up Section */}
        {upcomingMeals.length > 0 && (
          <div>
            <Title order={3} mb="md">
              📅 Coming Up
            </Title>
            <Stack gap="sm">
              {upcomingMeals.map(meal => (
                <Card
                  key={meal.id}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={async () => navigate(`/meal-plans/${meal.id}`)}
                >
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" c="dimmed">
                        {formatMealDate(meal.date, meal.mealType)}
                      </Text>
                      {isRecipeMealPlan(meal) ? (
                        <Text fw={500}>
                          {getRecipeForMeal(meal.recipeId)?.name ||
                            'Unknown Recipe'}
                        </Text>
                      ) : (
                        <Group gap="xs">
                          <Text fw={500}>
                            {meal.customText || 'Custom Meal'}
                          </Text>
                          <Badge variant="light" size="sm">
                            {getMealPlanTypeInfo(meal.type)?.label}
                          </Badge>
                        </Group>
                      )}
                    </div>
                  </Group>
                </Card>
              ))}
              <Button
                variant="subtle"
                size="sm"
                onClick={async () => navigate('/meal-plans')}
              >
                View All Meals →
              </Button>
            </Stack>
          </div>
        )}

        {/* Shopping List Section */}
        <div>
          <Title order={3} mb="md">
            🛒 Shopping List
          </Title>
          {activeList ? (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>{activeList.name}</Text>
                    <Badge variant="light">
                      {activeListItems.length} items
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {activeListItems.filter(item => item.checked).length}{' '}
                    checked
                  </Text>
                </div>

                <Group gap="xs">
                  <Button
                    variant="filled"
                    onClick={async () =>
                      navigate(`/grocery-lists/${activeList.id}`)
                    }
                  >
                    View List
                  </Button>
                  <Button
                    variant="light"
                    onClick={async () =>
                      navigate(`/grocery-lists/${activeList.id}`)
                    }
                  >
                    Check Off Items
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md" align="center">
                <Text c="dimmed">No active shopping list</Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    onClick={async () => navigate('/grocery-lists')}
                  >
                    Generate List
                  </Button>
                  <Button
                    variant="subtle"
                    onClick={async () => navigate('/grocery-lists')}
                  >
                    Create List
                  </Button>
                </Group>
              </Stack>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <Title order={3} mb="md">
            ⚡ Quick Actions
          </Title>
          <Group gap="md">
            <Button
              variant="light"
              leftSection={<IconCalendar size={18} />}
              onClick={async () => navigate('/meal-plans')}
            >
              Plan a Meal
            </Button>
            <Button
              variant="light"
              leftSection={<IconChefHat size={18} />}
              onClick={async () => navigate('/recipes')}
            >
              Browse Recipes
            </Button>
            <Button
              variant="light"
              leftSection={<IconShoppingCart size={18} />}
              onClick={async () => navigate('/grocery-lists')}
            >
              New Grocery List
            </Button>
          </Group>
        </div>
      </Stack>
    </Container>
  )
}
