import { useDraggable } from '@dnd-kit/core'
import { Badge, Box, Card, Group, Image, Stack, Text } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'

import type { Recipe } from '../../types/recipe'

interface DraggableRecipeCardProps {
  recipe: Recipe
}

export const DraggableRecipeCard = ({ recipe }: DraggableRecipeCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: {
      type: 'recipe',
      recipe,
    },
  })

  return (
    <Card
      ref={setNodeRef}
      padding="sm"
      withBorder
      data-testid={`recipe-card-${recipe.id}`}
      data-recipe-id={recipe.id}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
      {...listeners}
      {...attributes}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {/* Recipe info on left */}
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Text fw={500} size="sm" lineClamp={2}>
            {recipe.name}
          </Text>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <Group gap={4}>
              {recipe.tags.slice(0, 3).map(tag => (
                <Badge key={tag} size="xs" variant="light">
                  {tag}
                </Badge>
              ))}
              {recipe.tags.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{recipe.tags.length - 3}
                </Text>
              )}
            </Group>
          )}

          {/* Time */}
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="xs" c="dimmed">
              {recipe.prepTime + recipe.cookTime} min
            </Text>
          </Group>
        </Stack>

        {/* Image on right */}
        {recipe.imageUrl && (
          <Box style={{ flexShrink: 0 }}>
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              w={60}
              h={60}
              radius="sm"
              fit="cover"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23e9ecef' width='60' height='60'/%3E%3Ctext fill='%23868e96' font-family='sans-serif' font-size='10' dy='3.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E"
            />
          </Box>
        )}
      </Group>
    </Card>
  )
}
