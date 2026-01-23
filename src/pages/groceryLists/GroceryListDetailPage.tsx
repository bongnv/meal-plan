import { Container, Title, Text, Stack } from '@mantine/core'
import { useParams } from 'react-router-dom'

export const GroceryListDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={1}>Grocery List Detail</Title>
        <Text c="dimmed">Grocery list detail page - coming soon (ID: {id})</Text>
      </Stack>
    </Container>
  )
}
