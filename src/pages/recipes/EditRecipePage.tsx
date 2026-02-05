import { Container, Loader, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'

import { RecipeForm } from '@/components/recipes/RecipeForm'
import { useServices } from '@/contexts/ServicesContext'

import type { RecipeFormValues } from '@/types/recipe'

export function EditRecipePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { recipeService } = useServices()
  const recipe = useLiveQuery(async () => {
    if (!id) return undefined
    return recipeService.getById(id)
  }, [id, recipeService])
  const loading = recipe === undefined

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!id || !recipe) return
    const updatedRecipe = { ...recipe, ...values }
    await recipeService.update(updatedRecipe)
    void navigate('/recipes')
  }

  const handleCancel = () => {
    void navigate('/recipes')
  }

  const handleDelete = () => {
    if (!id || !recipe) return
    modals.openConfirmModal({
      title: 'Delete Recipe',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete "{recipe.name}"? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await recipeService.delete(id)
        void navigate('/recipes')
      },
    })
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Loader />
      </Container>
    )
  }

  if (!recipe) {
    return (
      <Container size="lg" py="xl">
        <Title order={1}>Recipe not found</Title>
      </Container>
    )
  }

  return (
    <Container
      size="lg"
      px={{ base: 'xs', sm: 'md' }}
      py={{ base: 'md', sm: 'xl' }}
    >
      <Title order={1} mb={{ base: 'md', sm: 'xl' }}>
        Edit Recipe
      </Title>
      <RecipeForm
        recipe={recipe}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </Container>
  )
}
