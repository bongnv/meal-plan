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
import { notifications } from '@mantine/notifications'
import { IconShoppingCart, IconPlus } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GroceryListGenerator } from '../../components/groceryLists/GroceryListGenerator'
import { db } from '../../db/database'
import { groceryListService } from '../../services/groceryListService'
import { generateGroceryList } from '../../utils/generateGroceryList'

export const GroceryListsPage = () => {
  const navigate = useNavigate()
  const [modalOpened, setModalOpened] = useState(false)

  // Get data from queries
  const recipes = useLiveQuery(async () => db.getActiveRecipes(), []) ?? []
  const mealPlans = useLiveQuery(async () => db.mealPlans.toArray(), []) ?? []
  const ingredients =
    useLiveQuery(async () => db.ingredients.toArray(), []) ?? []
  const groceryLists =
    useLiveQuery(async () => db.groceryLists.toArray(), []) ?? []
  const groceryItems =
    useLiveQuery(async () => db.groceryItems.toArray(), []) ?? []

  const hasLists = groceryLists.length > 0

  const handleGenerateClick = () => {
    setModalOpened(true)
  }

  const handleCloseModal = () => {
    setModalOpened(false)
  }

  const handleGenerate = async (params: {
    startDate: Date
    endDate: Date
    name?: string
  }) => {
    // Generate grocery list from meal plans
    const dateRange = {
      start: params.startDate.toISOString().split('T')[0],
      end: params.endDate.toISOString().split('T')[0],
    }

    const { list, items } = generateGroceryList(
      dateRange,
      params.name ||
        `Week of ${params.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      mealPlans,
      recipes,
      ingredients
    )

    // Save to database
    await groceryListService.generateList(list, items)
    setModalOpened(false)

    // Show success notification
    notifications.show({
      title: 'Grocery list created',
      message: `${list.name} with ${items.length} items`,
      color: 'green',
    })
  }

  const handleListClick = (listId: string) => {
    void navigate(`/grocery-lists/${listId}`)
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
            {groceryLists.map(list => {
              const listItems = groceryItems.filter(
                item => item.listId === list.id
              )
              const checkedCount = listItems.filter(item => item.checked).length
              const itemCount = listItems.length

              return (
                <Card
                  key={list.id}
                  shadow="sm"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleListClick(list.id)}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={500} size="md" lineClamp={1}>
                        {list.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {list.dateRange.start} - {list.dateRange.end}
                      </Text>
                    </div>
                    <Badge
                      color={checkedCount === itemCount ? 'green' : 'blue'}
                      variant="light"
                      size="lg"
                    >
                      {checkedCount}/{itemCount}
                    </Badge>
                  </Group>
                </Card>
              )
            })}
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
