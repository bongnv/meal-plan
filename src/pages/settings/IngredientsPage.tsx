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
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { IngredientForm } from '../../components/ingredients/IngredientForm'
import { IngredientList } from '../../components/ingredients/IngredientList'
import { db } from '../../db/database'
import { ingredientService } from '../../services/ingredientService'

import type { IngredientFormValues } from '../../types/ingredient'

export function IngredientsPage() {
  const ingredients =
    useLiveQuery(async () => db.ingredients.toArray(), []) ?? []
  const loading = ingredients === undefined
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >(null)

  const handleCreate = async (values: IngredientFormValues) => {
    try {
      await ingredientService.add(values)
      setCreateModalOpen(false)
    } catch (err) {
      console.error('Failed to add ingredient:', err)
    }
  }

  const handleEdit = (id: string) => {
    setSelectedIngredientId(id)
    setEditModalOpen(true)
  }

  const handleUpdate = async (values: IngredientFormValues) => {
    if (selectedIngredientId) {
      const ingredient = ingredients.find(i => i.id === selectedIngredientId)
      if (!ingredient) return

      try {
        await ingredientService.update({
          ...values,
          id: selectedIngredientId,
          createdAt: ingredient.createdAt, // Preserve original createdAt
          updatedAt: Date.now(),
        })
        setEditModalOpen(false)
        setSelectedIngredientId(null)
      } catch (err) {
        console.error('Failed to update ingredient:', err)
      }
    }
  }

  const handleDelete = async (id: string) => {
    const ingredient = ingredients.find(i => i.id === id)
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
        onConfirm: async () => {
          try {
            await ingredientService.delete(id)
          } catch (err) {
            console.error('Failed to delete ingredient:', err)
          }
        },
      })
    }
  }

  const selectedIngredient = selectedIngredientId
    ? ingredients.find(i => i.id === selectedIngredientId)
    : undefined

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Title order={1}>Loading...</Title>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
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
