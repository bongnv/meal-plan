import {
  Button,
  Checkbox,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Card,
  Badge,
} from '@mantine/core'
import { IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

export const GroceryListDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Stub data - will be replaced with real data from context in I8.7
  const stubGroceryList = {
    id: id || '1',
    name: 'Week of Jan 23',
    dateRange: {
      start: '2026-01-23',
      end: '2026-01-30',
    },
    items: [
      {
        id: 'item-1',
        name: 'Banana',
        quantity: 2,
        unit: 'cup',
        checked: false,
        category: 'Fruits',
      },
      {
        id: 'item-2',
        name: 'Chicken Breast',
        quantity: 500,
        unit: 'gram',
        checked: false,
        category: 'Meat',
      },
      {
        id: 'item-3',
        name: 'Milk',
        quantity: 1,
        unit: 'liter',
        checked: true,
        category: 'Dairy',
      },
    ],
  }

  const handleEdit = () => {
    // Will be implemented in I8.8
  }

  const handleDelete = () => {
    // Will be implemented in I8.8
  }

  const handleBack = () => {
    navigate('/grocery-lists')
  }

  const handleCheckItem = (_itemId: string) => {
    // Will be implemented in I8.7/I8.8
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleBack}
        >
          Back to Lists
        </Button>

        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>{stubGroceryList.name}</Title>
            <Text size="sm" c="dimmed">
              {stubGroceryList.dateRange.start} -{' '}
              {stubGroceryList.dateRange.end}
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconEdit size={18} />}
              onClick={handleEdit}
              variant="light"
            >
              Edit
            </Button>
            <Button
              leftSection={<IconTrash size={18} />}
              onClick={handleDelete}
              variant="light"
              color="red"
            >
              Delete
            </Button>
          </Group>
        </Group>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500} size="lg">
                Grocery Items
              </Text>
              <Badge size="lg" variant="light">
                {stubGroceryList.items.filter(item => item.checked).length} /{' '}
                {stubGroceryList.items.length} checked
              </Badge>
            </Group>

            <Stack gap="xs">
              {stubGroceryList.items.map(item => (
                <Card
                  key={item.id}
                  withBorder
                  p="sm"
                  radius="sm"
                  style={{
                    opacity: item.checked ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Checkbox
                        checked={item.checked}
                        onChange={() => handleCheckItem(item.id)}
                      />
                      <div>
                        <Text
                          fw={500}
                          style={{
                            textDecoration: item.checked
                              ? 'line-through'
                              : 'none',
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {item.quantity} {item.unit}
                        </Text>
                      </div>
                    </Group>
                    <Badge variant="light">{item.category}</Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
