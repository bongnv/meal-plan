import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm, zodResolver } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../../db/database'
import { ingredientService } from '../../services/ingredientService'
import { UNITS } from '../../types/ingredient'
import { RecipeFormSchema } from '../../types/recipe'
import { IngredientForm } from '../ingredients/IngredientForm'

import { SubRecipeCard } from './SubRecipeCard'
import { SubRecipeSelector } from './SubRecipeSelector'

import type { IngredientFormValues } from '../../types/ingredient'
import type { Recipe, RecipeFormValues, SubRecipe } from '../../types/recipe'

interface RecipeFormProps {
  recipe?: Recipe
  onSubmit: (values: RecipeFormValues) => void
  onCancel: () => void
  onDelete?: () => void
}

export function RecipeForm({
  recipe,
  onSubmit,
  onCancel,
  onDelete,
}: RecipeFormProps) {
  const isEditMode = !!recipe
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []
  const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []
  const [
    createIngredientOpened,
    { open: openCreateIngredient, close: closeCreateIngredient },
  ] = useDisclosure(false)
  const [
    subRecipeSelectorOpened,
    { open: openSubRecipeSelector, close: closeSubRecipeSelector },
  ] = useDisclosure(false)
  const [showImagePreview, setShowImagePreview] = useState(!!recipe?.imageUrl)

  const form = useForm<RecipeFormValues>({
    validate: zodResolver(RecipeFormSchema),
    initialValues: {
      name: recipe?.name ?? '',
      description: recipe?.description ?? '',
      servings: recipe?.servings ?? 0,
      prepTime: recipe?.prepTime ?? 0,
      cookTime: recipe?.cookTime ?? 0,
      ingredients: recipe?.ingredients ?? [],
      subRecipes: recipe?.subRecipes ?? [],
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
      unit: 'whole', // Default to 'whole' for countable items
      displayName: '',
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

  const addSubRecipe = (subRecipe: SubRecipe) => {
    form.insertListItem('subRecipes', subRecipe)
  }

  const removeSubRecipe = (index: number) => {
    form.removeListItem('subRecipes', index)
  }

  const handleCreateIngredient = async (values: IngredientFormValues) => {
    try {
      await ingredientService.add(values)
      closeCreateIngredient()
      // After creating, the new ingredient will be available in the dropdown
      // User can select it manually
    } catch (error) {
      console.error('Failed to create ingredient:', error)
    }
  }

  const handleImageUrlChange = (value: string) => {
    form.setFieldValue('imageUrl', value || undefined)
    // Check if URL is valid for preview
    try {
      if (value && value.trim()) {
        const url = new URL(value)
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          setShowImagePreview(true)
        } else {
          setShowImagePreview(false)
        }
      } else {
        setShowImagePreview(false)
      }
    } catch {
      setShowImagePreview(false)
    }
  }

  const ingredientSelectData = [
    ...ingredients.map(ing => ({
      value: ing.id,
      label: ing.name,
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

          <div>
            <TextInput
              label="Image URL (optional)"
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              value={form.values.imageUrl || ''}
              onChange={event =>
                handleImageUrlChange(event.currentTarget.value)
              }
              error={form.errors.imageUrl}
            />
            {showImagePreview && form.values.imageUrl && (
              <Box mt="xs">
                <Text size="sm" c="dimmed" mb={4}>
                  Preview:
                </Text>
                <Image
                  src={form.values.imageUrl}
                  alt="Recipe image preview"
                  radius="md"
                  fit="cover"
                  h={200}
                  style={{ maxWidth: '400px' }}
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23e9ecef' width='400' height='200'/%3E%3Ctext fill='%23868e96' font-family='sans-serif' font-size='16' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage not available%3C/text%3E%3C/svg%3E"
                />
              </Box>
            )}
          </div>

          <Group grow>
            <NumberInput
              label="Servings"
              placeholder="Number of servings"
              required
              min={1}
              {...form.getInputProps('servings')}
            />

            <NumberInput
              label="Prep Time (minutes)"
              placeholder="Preparation time"
              required
              min={1}
              {...form.getInputProps('prepTime')}
            />

            <NumberInput
              label="Cook Time (minutes)"
              placeholder="Cooking time"
              required
              min={1}
              {...form.getInputProps('cookTime')}
            />
          </Group>

          <TagsInput
            label="Tags"
            placeholder="Press Enter to add tags"
            {...form.getInputProps('tags')}
          />

          <div>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Sub-Recipes</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="xs"
                onClick={openSubRecipeSelector}
              >
                Add Sub-Recipe
              </Button>
            </Group>

            <Stack gap="xs">
              {form.values.subRecipes.map((subRecipe, index) => {
                const subRecipeData = recipes.find(
                  r => r.id === subRecipe.recipeId
                )

                return (
                  <SubRecipeCard
                    key={index}
                    subRecipe={subRecipe}
                    recipeData={subRecipeData}
                    expandable={true}
                    onRemove={() => removeSubRecipe(index)}
                  />
                )
              })}
            </Stack>
          </div>

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
                const selectedIngredient = ingredients.find(
                  ing => ing.id === ingredient.ingredientId
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
                    <Select
                      placeholder="Unit"
                      label={index === 0 ? 'Unit' : undefined}
                      data={UNITS.map(u => ({ value: u, label: u }))}
                      style={{ flex: 1 }}
                      searchable
                      {...form.getInputProps(`ingredients.${index}.unit`)}
                    />
                    <TextInput
                      placeholder={selectedIngredient?.name || 'Custom name'}
                      label={index === 0 ? 'Custom Name (optional)' : undefined}
                      style={{ flex: 2 }}
                      {...form.getInputProps(
                        `ingredients.${index}.displayName`
                      )}
                    />
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

          <Group justify="space-between" mt="md">
            {isEditMode && onDelete && (
              <Button variant="outline" color="red" onClick={onDelete}>
                Delete Recipe
              </Button>
            )}
            <Group ml="auto">
              <Button variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Recipe' : 'Create Recipe'}
              </Button>
            </Group>
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

      <SubRecipeSelector
        open={subRecipeSelectorOpened}
        onClose={closeSubRecipeSelector}
        onAdd={addSubRecipe}
        currentRecipeId={recipe?.id}
      />
    </Paper>
  )
}
