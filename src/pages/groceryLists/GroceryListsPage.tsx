import {
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  SimpleGrid,
} from '@mantine/core'
import { IconShoppingCart, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GroceryListGenerator } from '../../components/groceryLists/GroceryListGenerator'
import { useIngredients } from '../../contexts/IngredientContext'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'
import { generateGroceryList } from '../../utils/generateGroceryList'

export const GroceryListsPage = () => {
  const navigate = useNavigate()
  const [modalOpened, setModalOpened] = useState(false)

  // Get data from contexts
  const { recipes } = useRecipes()
  const { mealPlans } = useMealPlans()
  const { ingredients } = useIngredients()

  // Stub data - will be replaced with real data from context in I8.7
  const stubGroceryLists: Array<{
    id: string
    name: string
    dateRange: { start: string; end: string }
    itemCount: number
    checkedCount: number
  }> = []

  const hasLists = stubGroceryLists.length > 0

  const handleGenerateClick = () => {
    setModalOpened(true)
  }

  const handleCloseModal = () => {
    setModalOpened(false)
  }

  const handleGenerate = (params: {
    startDate: Date
    endDate: Date
    name?: string
  }) => {
    // Generate grocery list from meal plans
    const dateRange = {
      start: params.startDate.toISOString().split('T')[0],
      end: params.endDate.toISOString().split('T')[0],
    }

    const groceryList = generateGroceryList(
      dateRange,
      params.name || `Week of ${params.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      mealPlans,
      recipes,
      ingredients
    )

    // TODO I8.7: Save to context and navigate to detail page
    // For now, just log and navigate to detail page with temporary data
    console.log('Generated grocery list:', groceryList)
    navigate(`/grocery-lists/${groceryList.id}`)
    setModalOpened(false)
  }

  const handleListClick = (listId: string) => {
    navigate(`/grocery-lists/${listId}`)
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Grocery Lists</Title>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={handleGenerateClick}
          >
            Generate New List
          </Button>
        </Group>

        {!hasLists && (
          <Card withBorder shadow="sm" p="xl" radius="md" mt="md">
            <Stack align="center" gap="md">
              <IconShoppingCart size={64} stroke={1.5} color="gray" />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={500} mb="xs">
                  No grocery lists yet
                </Text>
                <Text size="sm" c="dimmed">
                  Generate your first grocery list from your meal plans
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={handleGenerateClick}
                mt="sm"
              >
                Generate New List
              </Button>
            </Stack>
          </Card>
        )}

        {hasLists && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md">
            {stubGroceryLists.map(list => (
              <Card
                key={list.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => handleListClick(list.id)}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={500} size="lg">
                        {list.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {list.dateRange.start} - {list.dateRange.end}
                      </Text>
                    </div>
                    <Badge
                      color={
                        list.checkedCount === list.itemCount ? 'green' : 'blue'
                      }
                      variant="light"
                    >
                      {list.checkedCount}/{list.itemCount}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <GroceryListGenerator
        opened={modalOpened}
        onClose={handleCloseModal}
        onGenerate={handleGenerate}
      />
    </Container>
  )
}
