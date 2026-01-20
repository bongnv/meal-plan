import { useState } from 'react'

import {
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconPlus } from '@tabler/icons-react'

import { IngredientForm } from '../../components/ingredients/IngredientForm'
import { IngredientList } from '../../components/ingredients/IngredientList'
import { useIngredients } from '../../contexts/IngredientContext'

import type { IngredientFormValues } from '../../types/ingredient'

export function IngredientsPage() {
  const {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientById,
  } = useIngredients()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >(null)

  const handleCreate = async (values: IngredientFormValues) => {
    await addIngredient(values)
    setCreateModalOpen(false)
  }

  const handleEdit = (id: string) => {
    setSelectedIngredientId(id)
    setEditModalOpen(true)
  }

  const handleUpdate = async (values: IngredientFormValues) => {
    if (selectedIngredientId) {
      await updateIngredient({ ...values, id: selectedIngredientId })
      setEditModalOpen(false)
      setSelectedIngredientId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    if (ingredient) {
      modals.openConfirmModal({
        title: 'Delete Ingredient',
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete "{ingredient.name}"? This action
            cannot be undone.
          </Text>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: async () => await deleteIngredient(id),
      })
    }
  }

  const selectedIngredient = selectedIngredientId
    ? getIngredientById(selectedIngredientId)
    : undefined

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Title order={1}>Loading...</Title>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Ingredient Library</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Ingredient
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <IngredientList
          ingredients={ingredients}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Paper>

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Ingredient"
        size="md"
      >
        <IngredientForm
          onSubmit={handleCreate}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedIngredientId(null)
        }}
        title="Edit Ingredient"
        size="md"
      >
        {selectedIngredient && (
          <IngredientForm
            ingredient={selectedIngredient}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditModalOpen(false)
              setSelectedIngredientId(null)
            }}
          />
        )}
      </Modal>
    </Container>
  )
}
