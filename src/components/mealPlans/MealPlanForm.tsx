import {
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm, zodResolver } from '@mantine/form'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { z } from 'zod'

import { db } from '../../db/database'
import { CUSTOM_MEAL_TYPES } from '../../types/mealPlan'

import { RecipeSelectorModal } from './RecipeSelectorModal'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface MealPlanFormProps {
  recipes: Recipe[]
  onSubmit: (mealPlan: Partial<MealPlan>) => void
  onCancel: () => void
  onDelete?: (id: string) => void
  date: string
  mealType: MealType
  initialMeal?: MealPlan
  selectedRecipeId?: string
}

const mealPlanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealSelection: z.string().min(1, 'Meal selection is required'),
  servings: z.number().optional(),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof mealPlanSchema>

export const MealPlanForm = ({
  recipes,
  onSubmit,
  onCancel,
  onDelete,
  date,
  mealType,
  initialMeal,
  selectedRecipeId,
}: MealPlanFormProps) => {
  const isEditing = !!initialMeal
  const [
    recipeSelectorOpened,
    { open: openRecipeSelector, close: closeRecipeSelector },
  ] = useDisclosure(false)

  // Detect mobile devices (< 768px)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Load ingredients for filtering
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), []) ?? []

  const handleDelete = () => {
    if (initialMeal && onDelete) {
      onDelete(initialMeal.id)
      onCancel()
    }
  }

  // Prepare unified meal options: recipes + custom meal types
  const mealOptions = useMemo(() => {
    const recipeOpts = recipes.map(recipe => ({
      value: `recipe:${recipe.id}`,
      label: `🍽 ${recipe.name}`,
      recipeId: recipe.id,
      type: 'recipe' as const,
    }))

    const customOpts = CUSTOM_MEAL_TYPES.filter(t => t.value !== 'other').map(
      type => ({
        value: `custom:${type.value}`,
        label: `${type.icon} ${type.label}`,
        customType: type.value,
        type: 'custom' as const,
      })
    )

    return [...recipeOpts, ...customOpts]
  }, [recipes])

  const form = useForm<FormValues>({
    validate: zodResolver(mealPlanSchema),
    initialValues: {
      date,
      mealType,
      mealSelection: '',
      servings: undefined,
      note: '',
    },
  })

  // Initialize form with existing meal data
  useEffect(() => {
    if (initialMeal) {
      const isRecipeMeal = initialMeal.type === 'recipe'

      if (isRecipeMeal) {
        form.setValues({
          date: initialMeal.date,
          mealType: initialMeal.mealType,
          mealSelection: `recipe:${initialMeal.recipeId}`,
          servings: initialMeal.servings,
          note: initialMeal.note || '',
        })
      } else if (initialMeal.type === 'other') {
        // Free text custom meal
        form.setValues({
          date: initialMeal.date,
          mealType: initialMeal.mealType,
          mealSelection: initialMeal.customText || '',
          servings: undefined,
          note: initialMeal.note || '',
        })
      } else {
        // Predefined custom type
        form.setValues({
          date: initialMeal.date,
          mealType: initialMeal.mealType,
          mealSelection: `custom:${initialMeal.type}`,
          servings: undefined,
          note: initialMeal.note || '',
        })
      }
    } else {
      form.setValues({
        date,
        mealType,
        mealSelection: '',
        servings: undefined,
        note: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMeal, date, mealType])

  // Auto-set servings when recipe is selected
  useEffect(() => {
    if (form.values.mealSelection.startsWith('recipe:')) {
      const recipeId = form.values.mealSelection.replace('recipe:', '')
      const recipe = recipes.find(r => r.id === recipeId)
      if (recipe && form.values.servings === undefined) {
        form.setFieldValue('servings', recipe.servings)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.mealSelection])

  // Update form when selectedRecipeId prop changes (from sidebar)
  useEffect(() => {
    if (selectedRecipeId && selectedRecipeId !== form.values.mealSelection) {
      const formattedValue = selectedRecipeId.includes(':')
        ? selectedRecipeId
        : `recipe:${selectedRecipeId}`
      form.setFieldValue('mealSelection', formattedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipeId])

  const handleSubmit = (values: FormValues) => {
    const selection = values.mealSelection.trim()

    // Check if it's a recipe
    if (selection.startsWith('recipe:')) {
      const recipeId = selection.replace('recipe:', '')
      const mealPlan: Partial<MealPlan> = {
        ...(initialMeal?.id && { id: initialMeal.id }),
        date: values.date,
        mealType: values.mealType,
        type: 'recipe',
        recipeId,
        servings: values.servings!,
        note: values.note || undefined,
      }
      onSubmit(mealPlan)
    }
    // Check if it's a predefined custom type
    else if (selection.startsWith('custom:')) {
      const customType = selection.replace('custom:', '')
      const mealPlan: Partial<MealPlan> = {
        ...(initialMeal?.id && { id: initialMeal.id }),
        date: values.date,
        mealType: values.mealType,
        type: customType as 'dining-out' | 'takeout' | 'leftovers' | 'skipping',
        note: values.note || undefined,
      }
      onSubmit(mealPlan)
    }
    // Otherwise it's free text
    else {
      // Strip icon if present (e.g., "🍽️ Custom Text" -> "Custom Text")
      const textOnly = selection.replace(/^[\u{1F000}-\u{1F9FF}]\s*/u, '')
      const mealPlan: Partial<MealPlan> = {
        ...(initialMeal?.id && { id: initialMeal.id }),
        date: values.date,
        mealType: values.mealType,
        type: 'other',
        customText: textOnly,
        note: values.note || undefined,
      }
      onSubmit(mealPlan)
    }
  }

  const handleRecipeSelect = (value: string) => {
    // Handle different value formats:
    // - Just recipe ID: convert to recipe:id
    // - other:text: just use the text part
    // - recipe:id or custom:type: use as-is
    if (value.startsWith('other:')) {
      form.setFieldValue('mealSelection', value.replace('other:', ''))
    } else if (value.includes(':')) {
      form.setFieldValue('mealSelection', value)
    } else {
      form.setFieldValue('mealSelection', `recipe:${value}`)
    }
  }

  const getDisplayLabel = () => {
    const selection = form.values.mealSelection
    const matchedOption = mealOptions.find(opt => opt.value === selection)
    return matchedOption ? matchedOption.label : selection
  }

  return (
    <Paper p="md" shadow="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {isMobile ? (
            // Mobile: Show TextInput with Button to open modal
            <TextInput
              label="Select or Enter Meal"
              placeholder="Tap to select..."
              value={getDisplayLabel()}
              onClick={openRecipeSelector}
              readOnly
              style={{ cursor: 'pointer' }}
              error={form.errors.mealSelection as string}
            />
          ) : (
            // Desktop: Show read-only field, use sidebar for selection
            <TextInput
              label="Selected Meal"
              placeholder="Select from the sidebar"
              value={getDisplayLabel()}
              readOnly
              error={form.errors.mealSelection as string}
            />
          )}

          {form.values.mealSelection.startsWith('recipe:') && (
            <NumberInput
              label="Servings"
              placeholder="Number of servings"
              min={1}
              {...form.getInputProps('servings')}
            />
          )}

          <DatePickerInput
            label="Date"
            placeholder="Select date"
            valueFormat="YYYY-MM-DD"
            value={form.values.date ? new Date(form.values.date) : null}
            onChange={(value: string | null) => {
              if (value) {
                form.setFieldValue('date', value)
              } else {
                form.setFieldValue('date', '')
              }
            }}
            error={form.errors.date as string}
          />

          <SegmentedControl
            {...form.getInputProps('mealType')}
            data={[
              { label: 'Breakfast', value: 'breakfast' },
              { label: 'Lunch', value: 'lunch' },
              { label: 'Dinner', value: 'dinner' },
              { label: 'Snack', value: 'snack' },
            ]}
            fullWidth
          />

          <Textarea
            label="Note (Optional)"
            placeholder="Add any additional notes..."
            minRows={2}
            {...form.getInputProps('note')}
          />

          <Group justify="space-between" mt="md">
            <Group gap="xs">
              {isEditing && onDelete && (
                <Button variant="subtle" color="red" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </Group>
            <Group gap="xs">
              <Button variant="subtle" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save Meal</Button>
            </Group>
          </Group>
        </Stack>
      </form>

      {/* Recipe selector modal for mobile */}
      <RecipeSelectorModal
        opened={recipeSelectorOpened}
        onClose={closeRecipeSelector}
        recipes={recipes}
        ingredients={ingredients}
        selectedValue={form.values.mealSelection}
        onSelect={handleRecipeSelect}
      />
    </Paper>
  )
}
