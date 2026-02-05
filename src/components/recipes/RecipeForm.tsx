import {
  ActionIcon,
  Box,
  Button,
  Card,
  Flex,
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

import { useServices } from '../../contexts/ServicesContext'
import { useRecipeSectionManager } from '../../hooks/useRecipeSectionManager'
import { UNITS } from '../../types/ingredient'
import { RecipeFormSchema } from '../../types/recipe'
import { isValidImageUrl } from '../../utils/urlValidator'
import { IngredientForm } from '../ingredients/IngredientForm'

import type { IngredientFormValues } from '../../types/ingredient'
import type {
  Recipe,
  RecipeFormValues,
} from '../../types/recipe'

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
  const { ingredientService } = useServices()
  const ingredients =
    useLiveQuery(async () => ingredientService.getIngredients(), []) ?? []
  const [
    createIngredientOpened,
    { open: openCreateIngredient, close: closeCreateIngredient },
  ] = useDisclosure(false)
  const [showImagePreview, setShowImagePreview] = useState(!!recipe?.imageUrl)

  // Use custom hook for section management
  const {
    sections,
    addSection,
    removeSection,
    updateSectionName,
    addIngredient,
    removeIngredient,
    updateIngredient,
    addInstruction,
    removeInstruction,
    updateInstruction,
  } = useRecipeSectionManager(recipe?.sections)

  const form = useForm<Omit<RecipeFormValues, 'sections'>>({
    validate: zodResolver(RecipeFormSchema.omit({ sections: true })),
    initialValues: {
      name: recipe?.name ?? '',
      description: recipe?.description ?? '',
      servings: recipe?.servings ?? 0,
      prepTime: recipe?.prepTime ?? 0,
      cookTime: recipe?.cookTime ?? 0,
      tags: recipe?.tags ?? [],
      imageUrl: recipe?.imageUrl,
    },
  })

  const handleSubmit = (values: Omit<RecipeFormValues, 'sections'>) => {
    // Combine form values with sections
    const recipeData: RecipeFormValues = {
      ...values,
      sections: sections.map(s => ({
        name: s.name?.trim() || undefined,
        ingredients: s.ingredients,
        instructions: s.instructions,
      })),
    }
    onSubmit(recipeData)
  }

  const handleCreateIngredient = async (values: IngredientFormValues) => {
    try {
      await ingredientService.add(values)
      closeCreateIngredient()
    } catch (error) {
      console.error('Failed to create ingredient:', error)
    }
  }

  const handleImageUrlChange = (value: string) => {
    form.setFieldValue('imageUrl', value || undefined)
    setShowImagePreview(isValidImageUrl(value))
  }

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

          {/* Sections */}
          <Stack gap="lg">
            {sections.map((section, sectionIndex) => (
              <Card key={sectionIndex} withBorder padding="md">
                <Stack gap="md">
                  {/* Section Name - only show when 2+ sections */}
                  {sections.length > 1 && (
                    <TextInput
                      label="Section Name (optional)"
                      placeholder="e.g., BROTH, ASSEMBLY, GARNISHES"
                      value={section.name || ''}
                      onChange={e =>
                        updateSectionName(sectionIndex, e.target.value)
                      }
                    />
                  )}

                  {/* Ingredients */}
                  <div>
                    <Title order={4} mb="xs">
                      Ingredients
                    </Title>

                    <Stack gap="xs">
                      {section.ingredients.map(
                        (ingredient, ingredientIndex) => {
                          const selectedIngredient = ingredients.find(
                            ing => ing.id === ingredient.ingredientId
                          )

                          return (
                            <Paper key={ingredientIndex} p="sm" withBorder>
                              <Flex
                                gap="xs"
                                align="flex-start"
                                wrap={{ base: 'wrap', sm: 'nowrap' }}
                              >
                                <Select
                                  placeholder="Select ingredient"
                                  label="Ingredient"
                                  style={{
                                    flex: '2 1 0',
                                    minWidth: 'min(150px, 100%)',
                                  }}
                                  data={[
                                    ...ingredients.map(ing => ({
                                      value: ing.id,
                                      label: ing.name,
                                    })),
                                    {
                                      value: '__create_new__',
                                      label: '+ Create New Ingredient',
                                    },
                                  ]}
                                  value={ingredient.ingredientId}
                                  searchable
                                  onChange={value => {
                                    if (value === '__create_new__') {
                                      openCreateIngredient()
                                    } else {
                                      updateIngredient(
                                        sectionIndex,
                                        ingredientIndex,
                                        'ingredientId',
                                        value || ''
                                      )
                                    }
                                  }}
                                />
                                <NumberInput
                                  placeholder="Quantity"
                                  label="Quantity"
                                  style={{
                                    flex: '1 1 0',
                                    minWidth: 'min(100px, 45%)',
                                  }}
                                  min={0}
                                  step={0.1}
                                  value={ingredient.quantity}
                                  onChange={value =>
                                    updateIngredient(
                                      sectionIndex,
                                      ingredientIndex,
                                      'quantity',
                                      value
                                    )
                                  }
                                />
                                <Select
                                  placeholder="Unit"
                                  label="Unit"
                                  style={{
                                    flex: '1 1 0',
                                    minWidth: 'min(120px, 45%)',
                                  }}
                                  data={UNITS.map(u => ({
                                    value: u,
                                    label: u,
                                  }))}
                                  searchable
                                  value={ingredient.unit}
                                  onChange={value =>
                                    updateIngredient(
                                      sectionIndex,
                                      ingredientIndex,
                                      'unit',
                                      value || 'whole'
                                    )
                                  }
                                />
                                <TextInput
                                  placeholder={
                                    selectedIngredient?.name || 'Custom name'
                                  }
                                  label="Custom Name (optional)"
                                  style={{
                                    flex: '2 1 0',
                                    minWidth: 'min(150px, 100%)',
                                  }}
                                  value={ingredient.displayName || ''}
                                  onChange={e =>
                                    updateIngredient(
                                      sectionIndex,
                                      ingredientIndex,
                                      'displayName',
                                      e.target.value
                                    )
                                  }
                                />
                                <Box
                                  style={{
                                    marginTop: 28,
                                    flexShrink: 0,
                                  }}
                                >
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() =>
                                      removeIngredient(
                                        sectionIndex,
                                        ingredientIndex
                                      )
                                    }
                                    aria-label="Remove ingredient"
                                  >
                                    <IconTrash size={18} />
                                  </ActionIcon>
                                </Box>
                              </Flex>
                            </Paper>
                          )
                        }
                      )}
                    </Stack>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      variant="light"
                      size="xs"
                      onClick={() => addIngredient(sectionIndex)}
                      mt="xs"
                      fullWidth
                    >
                      Add Ingredient
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div>
                    <Title order={4} mb="xs">
                      Instructions
                    </Title>

                    <Stack gap="xs">
                      {section.instructions.map(
                        (instruction, instructionIndex) => (
                          <Paper key={instructionIndex} p="sm" withBorder>
                            <Group align="flex-start" wrap="nowrap" gap="xs">
                              <Textarea
                                placeholder={`Step ${instructionIndex + 1}`}
                                label={`Step ${instructionIndex + 1}`}
                                minRows={2}
                                style={{ flex: 1, minWidth: 0 }}
                                value={instruction}
                                onChange={e =>
                                  updateInstruction(
                                    sectionIndex,
                                    instructionIndex,
                                    e.target.value
                                  )
                                }
                              />
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() =>
                                  removeInstruction(
                                    sectionIndex,
                                    instructionIndex
                                  )
                                }
                                aria-label="Remove instruction"
                                style={{ marginTop: 28, flexShrink: 0 }}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        )
                      )}
                    </Stack>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      variant="light"
                      size="xs"
                      onClick={() => addInstruction(sectionIndex)}
                      mt="xs"
                      fullWidth
                    >
                      Add Instruction
                    </Button>
                  </div>

                  {/* Remove Section button (only show when 2+ sections) */}
                  {sections.length > 1 && (
                    <Button
                      variant="light"
                      color="red"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      Remove Section
                    </Button>
                  )}
                </Stack>
              </Card>
            ))}

            {/* Add Section button */}
            <Button
              leftSection={<IconPlus size={16} />}
              variant="outline"
              onClick={addSection}
            >
              Add Section
            </Button>
          </Stack>

          <Group
            justify={isEditMode && onDelete ? 'space-between' : 'flex-end'}
            mt="md"
            wrap="nowrap"
            gap="sm"
          >
            {isEditMode && onDelete && (
              <Button
                variant="outline"
                color="red"
                onClick={onDelete}
                style={{ flex: '0 0 auto' }}
              >
                Delete
              </Button>
            )}
            <Group gap="sm" wrap="nowrap" style={{ marginLeft: 'auto' }}>
              <Button variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Create'}</Button>
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
    </Paper>
  )
}
