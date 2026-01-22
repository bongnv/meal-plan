import {
  Autocomplete,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Textarea,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm, zodResolver } from '@mantine/form'
import { IconCopy } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { CUSTOM_MEAL_TYPES } from '../../types/mealPlan'

import { CopyMealPlanModal } from './CopyMealPlanModal'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface MealPlanFormProps {
  recipes: Recipe[]
  onSubmit: (mealPlan: Partial<MealPlan>) => void
  onClose: () => void
  onDelete?: (id: string) => void
  opened: boolean
  date: string
  mealType: MealType
  initialMeal?: MealPlan
}

const mealPlanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  mealType: z.enum(['lunch', 'dinner']),
  mealSelection: z.string().min(1, 'Meal selection is required'),
  servings: z.number().optional(),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof mealPlanSchema>

export const MealPlanForm = ({
  recipes,
  onSubmit,
  onClose,
  onDelete,
  opened,
  date,
  mealType,
  initialMeal,
}: MealPlanFormProps) => {
  const isEditing = !!initialMeal
  const [copyModalOpened, setCopyModalOpened] = useState(false)

  const handleDelete = () => {
    if (initialMeal && onDelete) {
      onDelete(initialMeal.id)
      onClose()
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
  }, [initialMeal, date, mealType, opened])

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

    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Meal' : 'Add Meal'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Autocomplete
            label="Select or Enter Meal"
            placeholder="Search recipes, or enter Dining Out, Takeout, etc..."
            data={mealOptions.map(opt => opt.label)}
            {...form.getInputProps('mealSelection')}
            onChange={value => {
              form.setFieldValue('mealSelection', value)
              // Find the matching option to set proper value format
              const matchedOption = mealOptions.find(opt => opt.label === value)
              if (matchedOption) {
                form.setFieldValue('mealSelection', matchedOption.value)
              }
            }}
            value={(() => {
              const selection = form.values.mealSelection
              const matchedOption = mealOptions.find(
                opt => opt.value === selection
              )
              return matchedOption ? matchedOption.label : selection
            })()}
          />

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
              { label: 'Lunch', value: 'lunch' },
              { label: 'Dinner', value: 'dinner' },
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
              {isEditing && initialMeal && (
                <Button
                  variant="subtle"
                  color="green"
                  leftSection={<IconCopy size={16} />}
                  onClick={() => setCopyModalOpened(true)}
                >
                  Copy
                </Button>
              )}
              <Button variant="subtle" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Meal</Button>
            </Group>
          </Group>
        </Stack>
      </form>

      {/* Copy meal plan modal */}
      {isEditing && initialMeal && (
        <CopyMealPlanModal
          opened={copyModalOpened}
          onClose={() => setCopyModalOpened(false)}
          mealPlanId={initialMeal.id}
        />
      )}
    </Modal>
  )
}
