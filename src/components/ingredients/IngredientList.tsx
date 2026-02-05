import {
  ActionIcon,
  Badge,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'

import { ingredientService } from '@/services/ingredientService'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'

import type { Ingredient } from '@/types/ingredient'

interface IngredientListProps {
  ingredients: Ingredient[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function IngredientList({
  ingredients,
  onEdit,
  onDelete,
}: IngredientListProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // Filter ingredients based on search and category
  const filteredIngredients = ingredientService.filterIngredients(
    ingredients,
    search,
    categoryFilter || undefined
  )

  if (ingredients.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text size="lg" c="dimmed">
          No ingredients in your library yet
        </Text>
        <Text size="sm" c="dimmed">
          Start adding ingredients to build your library
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      {/* Search and Filter Bar */}
      <Group>
        <TextInput
          placeholder="Search ingredients..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by category"
          data={[
            { value: '', label: 'All Categories' },
            ...INGREDIENT_CATEGORIES.map(cat => ({ value: cat, label: cat })),
          ]}
          value={categoryFilter}
          onChange={setCategoryFilter}
          clearable
          style={{ minWidth: 200 }}
          aria-label="Category"
        />
      </Group>

      {/* Ingredients Table */}
      {filteredIngredients.length === 0 ? (
        <Stack align="center" py="xl">
          <Text size="lg" c="dimmed">
            No ingredients found
          </Text>
          <Text size="sm" c="dimmed">
            Try adjusting your search or filters
          </Text>
        </Stack>
      ) : (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredIngredients.map(ingredient => (
              <Table.Tr key={ingredient.id}>
                <Table.Td>
                  <Text fw={500}>{ingredient.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{ingredient.category}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => onEdit(ingredient.id)}
                      aria-label="Edit"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(ingredient.id)}
                      aria-label="Delete"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
