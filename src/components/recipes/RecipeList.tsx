import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconEdit,
  IconEye,
  IconTrash,
  IconUsers,
  IconClock,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

import type { Recipe } from '../../types/recipe'

interface RecipeListProps {
  recipes: Recipe[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export const RecipeList = ({ recipes, onEdit, onDelete }: RecipeListProps) => {
  const navigate = useNavigate()

  if (recipes.length === 0) {
    return (
      <Stack align="center" justify="center" mih={400}>
        <Title order={2} c="dimmed">
          No recipes yet
        </Title>
        <Text c="dimmed" size="lg" ta="center">
          Start building your recipe collection!
        </Text>
        <Text c="dimmed" size="sm" ta="center" maw={500}>
          Create recipes with ingredients, instructions, and even link
          sub-recipes together to build complex dishes.
        </Text>
        <Button size="lg" mt="md" onClick={() => navigate('/recipes/new')}>
          Create Your First Recipe
        </Button>
      </Stack>
    )
  }

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  return (
    <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
      {recipes.map(recipe => (
        <Card
          key={recipe.id}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{
            transition:
              'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/recipes/${recipe.id}`)}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = ''
            e.currentTarget.style.transform = ''
          }}
        >
          <Stack gap="md">
            {/* Recipe thumbnail image - always shown */}
            <Image
              src={recipe.imageUrl || undefined}
              alt={`${recipe.name} thumbnail`}
              fit="cover"
              h={180}
              radius="sm"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='180'%3E%3Crect fill='%23e9ecef' width='400' height='180'/%3E%3Ctext fill='%23868e96' font-family='sans-serif' font-size='16' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E"
            />

            <Title order={3} lineClamp={1}>
              {recipe.name}
            </Title>

            <Text size="sm" c="dimmed" lineClamp={3}>
              {truncateText(recipe.description)}
            </Text>

            {recipe.tags.length > 0 && (
              <Group gap="xs">
                {recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="light" size="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}

            <Group gap="md">
              <Group gap={4}>
                <IconUsers size={16} />
                <Text size="sm">{recipe.servings} servings</Text>
              </Group>
              <Group gap={4}>
                <IconClock size={16} />
                <Text size="sm">{recipe.prepTime + recipe.cookTime} min</Text>
              </Group>
            </Group>

            <Group gap="xs" mt="auto">
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                aria-label="View recipe"
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/recipes/${recipe.id}`)
                }}
              >
                <IconEye size={18} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="orange"
                size="lg"
                aria-label="Edit recipe"
                onClick={e => {
                  e.stopPropagation()
                  onEdit(recipe.id)
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                aria-label="Delete recipe"
                onClick={e => {
                  e.stopPropagation()
                  onDelete(recipe.id)
                }}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  )
}
