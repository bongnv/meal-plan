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

export const GroceryListsPage = () => {
  const navigate = useNavigate()
  const [_modalOpened, setModalOpened] = useState(false)

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
    // Modal will be implemented in I8.4
    // For now, just toggle state
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
    </Container>
  )
}
