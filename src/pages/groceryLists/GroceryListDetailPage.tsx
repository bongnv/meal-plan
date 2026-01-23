import {
  Button,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { GroceryListView } from '../../components/groceryLists/GroceryListView'
import { useGroceryLists } from '../../contexts/GroceryListContext'
import { useMealPlans } from '../../contexts/MealPlanContext'
import { useRecipes } from '../../contexts/RecipeContext'
import { GroceryItem } from '../../types/groceryList'

import type { IngredientCategory, Unit } from '../../types/ingredient'

export const GroceryListDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipes } = useRecipes()
  const { mealPlans } = useMealPlans()
  const {
    getGroceryListById,
    getItemsForList,
    addGroceryItem,
    updateGroceryItem: updateItem,
    updateGroceryList,
    deleteGroceryList,
    removeGroceryItem,
  } = useGroceryLists()

  // Modal states
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedNote, setEditedNote] = useState('')

  // Get grocery list from context
  const groceryList = getGroceryListById(id || '')
  const items = getItemsForList(id || '')

  const handleEdit = () => {
    if (groceryList) {
      setEditedName(groceryList.name)
      setEditedNote(groceryList.note || '')
      setEditModalOpened(true)
    }
  }

  const handleSaveEdit = () => {
    if (groceryList && editedName.trim()) {
      updateGroceryList({
        ...groceryList,
        name: editedName.trim(),
        note: editedNote.trim() || undefined,
      })
      setEditModalOpened(false)
    }
  }

  const handleDelete = () => {
    setDeleteModalOpened(true)
  }

  const handleConfirmDelete = () => {
    if (groceryList) {
      deleteGroceryList(groceryList.id)
      navigate('/grocery-lists')
    }
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
      id: `item-${Date.now()}`,
      listId: groceryList.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit as Unit,
      category: item.category as IngredientCategory,
      checked: false,
      mealPlanIds: [],
    }

    addGroceryItem(newItem)
  }

  const getRecipeName = (recipeId: string): string => {
    const recipe = recipes.find(r => r.id === recipeId)
    return recipe?.name || recipeId
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

        <Group justify="space-between" align="start">
          <Stack gap={4}>
            <Title order={1}>{groceryList.name}</Title>
            <Text size="sm" c="dimmed">
              {groceryList.dateRange.start} - {groceryList.dateRange.end}
            </Text>
            {groceryList.note && (
              <Text size="sm" c="dimmed" fs="italic">
                {groceryList.note}
              </Text>
            )}
          </Stack>
          <Group gap="sm">
            <Button
              leftSection={<IconEdit size={18} />}
              onClick={handleEdit}
              variant="light"
              data-testid="edit-list-button"
            >
              Edit
            </Button>
            <Button
              leftSection={<IconTrash size={18} />}
              onClick={handleDelete}
              variant="light"
              color="red"
              data-testid="delete-list-button"
            >
              Delete
            </Button>
          </Group>
        </Group>

        <GroceryListView
          groceryList={groceryList}
          items={items}
          mealPlans={mealPlans}
          onCheckItem={handleCheckItem}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={handleUpdateNotes}
          onRemoveItem={handleRemoveItem}
          onAddManualItem={handleAddManualItem}
          getRecipeName={getRecipeName}
        />
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Edit Grocery List"
        transitionProps={{ duration: 0 }}
      >
        <Stack gap="md">
          <TextInput
            label="List Name"
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            placeholder="Enter list name"
          />
          <TextInput
            label="Note (optional)"
            value={editedNote}
            onChange={e => setEditedNote(e.target.value)}
            placeholder="Add a note for this list"
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setEditModalOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirm Delete"
        transitionProps={{ duration: 0 }}
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete "{groceryList.name}"? This will
            also delete all items in this list. This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setDeleteModalOpened(false)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
