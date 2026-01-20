import {
  ActionIcon,
  AspectRatio,
  Badge,
  Button,
  Card,
  Center,
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
  IconPhoto,
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
        <Text c="dimmed" size="lg">
          Start building your recipe collection!
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
            {/* Image placeholder - future-ready for recipe images */}
            <AspectRatio ratio={16 / 9}>
              {recipe.imageUrl ? (
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  fit="cover"
                  radius="sm"
                />
              ) : (
                <Center
                  style={{
                    backgroundColor: 'var(--mantine-color-gray-1)',
                    borderRadius: 'var(--mantine-radius-sm)',
                  }}
                >
                  <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
                </Center>
              )}
            </AspectRatio>

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
                <Text size="sm">{recipe.totalTime} min</Text>
              </Group>
            </Group>

            <Group gap="xs" mt="auto">
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                aria-label="View recipe"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <IconEye size={18} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="orange"
                size="lg"
                aria-label="Edit recipe"
                onClick={() => onEdit(recipe.id)}
              >
                <IconEdit size={18} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                aria-label="Delete recipe"
                onClick={() => onDelete(recipe.id)}
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
