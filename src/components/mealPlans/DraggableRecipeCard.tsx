import { useDraggable } from '@dnd-kit/core'
import { Badge, Card, Group, Stack, Text } from '@mantine/core'
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
      <Stack gap="xs">
        <Text fw={500} size="sm">
          {recipe.name}
        </Text>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <Group gap={4}>
            {recipe.tags.map(tag => (
              <Badge key={tag} size="xs" variant="light">
                {tag}
              </Badge>
            ))}
          </Group>
        )}

        {/* Time */}
        <Group gap={4}>
          <IconClock size={14} />
          <Text size="xs" c="dimmed">
            {recipe.totalTime} min
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}
