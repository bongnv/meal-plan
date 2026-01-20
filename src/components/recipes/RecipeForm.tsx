import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm, zodResolver } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconTrash } from '@tabler/icons-react'

import { useIngredients } from '../../contexts/IngredientContext'
import { RecipeFormSchema } from '../../types/recipe'
import { IngredientForm } from '../ingredients/IngredientForm'

import type { IngredientFormValues } from '../../types/ingredient'
import type { Recipe, RecipeFormValues } from '../../types/recipe'

interface RecipeFormProps {
  recipe?: Recipe
  onSubmit: (values: RecipeFormValues) => void
  onCancel: () => void
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const isEditMode = !!recipe
  const {
    ingredients,
    getIngredientById,
    addIngredient: addIngredientToLibrary,
  } = useIngredients()
  const [
    createIngredientOpened,
    { open: openCreateIngredient, close: closeCreateIngredient },
  ] = useDisclosure(false)

  const form = useForm<RecipeFormValues>({
    validate: zodResolver(RecipeFormSchema),
    initialValues: {
      name: recipe?.name ?? '',
      description: recipe?.description ?? '',
      servings: recipe?.servings ?? 0,
      totalTime: recipe?.totalTime ?? 0,
      ingredients: recipe?.ingredients ?? [],
      instructions: recipe?.instructions ?? [],
      tags: recipe?.tags ?? [],
      imageUrl: recipe?.imageUrl,
    },
  })

  const handleSubmit = (values: RecipeFormValues) => {
    onSubmit(values)
  }

  const addIngredient = () => {
    form.insertListItem('ingredients', {
      ingredientId: '',
      quantity: 0,
    })
  }

  const removeIngredient = (index: number) => {
    form.removeListItem('ingredients', index)
  }

  const addInstruction = () => {
    form.insertListItem('instructions', '')
  }

  const removeInstruction = (index: number) => {
    form.removeListItem('instructions', index)
  }

  const handleCreateIngredient = async (values: IngredientFormValues) => {
    try {
      await addIngredientToLibrary(values)
      closeCreateIngredient()
      // After creating, the new ingredient will be available in the dropdown
      // User can select it manually
    } catch (error) {
      console.error('Failed to create ingredient:', error)
    }
  }

  const ingredientSelectData = [
    ...ingredients.map(ing => ({
      value: ing.id,
      label: `${ing.name} (${ing.unit})`,
    })),
    { value: '__create_new__', label: '+ Create New Ingredient' },
  ]

  return (
    <Paper p="md" shadow="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter recipe name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Describe your recipe"
            required
            minRows={3}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <NumberInput
              label="Servings"
              placeholder="Number of servings"
              required
              min={1}
              {...form.getInputProps('servings')}
            />

            <NumberInput
              label="Total Time (minutes)"
              placeholder="Total cooking time"
              required
              min={1}
              {...form.getInputProps('totalTime')}
            />
          </Group>

          <div>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Ingredients</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="xs"
                onClick={addIngredient}
              >
                Add Ingredient
              </Button>
            </Group>

            <Stack gap="xs">
              {form.values.ingredients.map((ingredient, index) => {
                const selectedIngredient = getIngredientById(
                  ingredient.ingredientId
                )
                return (
                  <Group key={index} align="flex-start">
                    <Select
                      placeholder="Select ingredient"
                      label={index === 0 ? 'Ingredient' : undefined}
                      style={{ flex: 2 }}
                      data={ingredientSelectData}
                      value={ingredient.ingredientId}
                      searchable
                      onChange={value => {
                        if (value === '__create_new__') {
                          openCreateIngredient()
                        } else {
                          form.setFieldValue(
                            `ingredients.${index}.ingredientId`,
                            value || ''
                          )
                        }
                      }}
                      error={form.errors[`ingredients.${index}.ingredientId`]}
                    />
                    <NumberInput
                      placeholder="Quantity"
                      label={index === 0 ? 'Quantity' : undefined}
                      min={0}
                      step={0.1}
                      style={{ flex: 1 }}
                      {...form.getInputProps(`ingredients.${index}.quantity`)}
                    />
                    {selectedIngredient && (
                      <div
                        style={{
                          marginTop: index === 0 ? 28 : 0,
                          fontSize: '0.875rem',
                          color: 'var(--mantine-color-dimmed)',
                        }}
                      >
                        {selectedIngredient.unit}
                      </div>
                    )}
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeIngredient(index)}
                      aria-label="Remove ingredient"
                      style={{ marginTop: index === 0 ? 28 : 0 }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                )
              })}
              {form.errors['ingredients'] && (
                <div style={{ color: 'var(--mantine-color-error)' }}>
                  {form.errors['ingredients']}
                </div>
              )}
            </Stack>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Instructions</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="xs"
                onClick={addInstruction}
              >
                Add Instruction
              </Button>
            </Group>

            <Stack gap="xs">
              {form.values.instructions.map((_, index) => (
                <Group key={index} align="flex-start">
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    label={`Step ${index + 1}`}
                    minRows={2}
                    style={{ flex: 1 }}
                    {...form.getInputProps(`instructions.${index}`)}
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeInstruction(index)}
                    aria-label="Remove instruction"
                    style={{ marginTop: 28 }}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              ))}
              {form.errors['instructions'] && (
                <div style={{ color: 'var(--mantine-color-error)' }}>
                  {form.errors['instructions']}
                </div>
              )}
            </Stack>
          </div>

          <TagsInput
            label="Tags"
            placeholder="Press Enter to add tags"
            {...form.getInputProps('tags')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update Recipe' : 'Create Recipe'}
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={createIngredientOpened}
        onClose={closeCreateIngredient}
        title="Create New Ingredient"
      >
        <IngredientForm
          onSubmit={handleCreateIngredient}
          onCancel={closeCreateIngredient}
        />
      </Modal>
    </Paper>
  )
}
