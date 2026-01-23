import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

import { GroceryListView } from '../../components/groceryLists/GroceryListView'
import { useGroceryLists } from '../../contexts/GroceryListContext'
import { useIngredients } from '../../contexts/IngredientContext'
import { GroceryItem } from '../../types/groceryList'

import type { IngredientCategory, Unit } from '../../types/ingredient'

export const GroceryListDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ingredients } = useIngredients()
  const {
    getGroceryListById,
    getItemsForList,
    addGroceryItem,
    updateGroceryItem: updateItem,
    removeGroceryItem,
  } = useGroceryLists()

  // Get grocery list from context
  const groceryList = getGroceryListById(id || '')
  const items = getItemsForList(id || '')

  const handleEdit = () => {
    // Will be implemented in I8.8
  }

  const handleDelete = () => {
    // Will be implemented in I8.8
  }

  const handleBack = () => {
    navigate('/grocery-lists')
  }

  const handleCheckItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    updateItem(itemId, { checked: !item.checked })
  }

  const handleUpdateQuantity = (
    itemId: string,
    quantity: number,
    unit: string
  ) => {
    updateItem(itemId, { quantity, unit: unit as Unit })
  }

  const handleUpdateNotes = (itemId: string, notes: string) => {
    updateItem(itemId, { notes })
  }

  const handleRemoveItem = (itemId: string) => {
    removeGroceryItem(itemId)
  }

  const handleAddManualItem = (item: {
    name: string
    quantity: number
    unit: string
    category: string
  }) => {
    if (!groceryList) return

    const newItem: GroceryItem = {
      id: `manual-${Date.now()}`,
      listId: groceryList.id,
      ingredientId: null,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit as Unit,
      category: item.category as IngredientCategory,
      checked: false,
      mealPlanIds: [],
    }

    addGroceryItem(newItem)
  }

  const getIngredientName = (ingredientId: string): string => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  // Handle grocery list not found
  if (!groceryList) {
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
          <Text>Grocery list not found</Text>
        </Stack>
      </Container>
    )
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
            <Title order={1}>{groceryList.name}</Title>
            <Text size="sm" c="dimmed">
              {groceryList.dateRange.start} - {groceryList.dateRange.end}
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

        <GroceryListView
          groceryList={groceryList}
          items={items}
          onCheckItem={handleCheckItem}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={handleUpdateNotes}
          onRemoveItem={handleRemoveItem}
          onAddManualItem={handleAddManualItem}
          getIngredientName={getIngredientName}
        />
      </Stack>
    </Container>
  )
}
