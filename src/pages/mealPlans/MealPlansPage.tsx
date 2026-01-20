import { Container, Title, Text, Paper } from '@mantine/core'

export function MealPlansPage() {
  return (
    <Container size="xl">
      <Title order={1} mb="md">
        Meal Plans
      </Title>
      
      <Paper p="md" withBorder>
        <Text c="dimmed">
          Calendar and list views coming soon...
        </Text>
      </Paper>
    </Container>
  )
}
