import { useEffect, useMemo } from 'react'

import {
  Autocomplete,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Textarea,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm, zodResolver } from '@mantine/form'
import { z } from 'zod'

import { CUSTOM_MEAL_TYPES, getMealPlanTypeInfo } from '../../types/mealPlan'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface MealPlanFormProps {
  recipes: Recipe[]
  onSubmit: (mealPlan: Partial<MealPlan>) => void
  onClose: () => void
  opened: boolean
  date: string
  mealType: MealType
  initialMeal?: MealPlan
}

const mealPlanSchema = z
  .object({
    entryType: z.enum(['recipe', 'custom']),
    date: z.string().min(1, 'Date is required'),
    mealType: z.enum(['lunch', 'dinner']),
    recipeId: z.string().optional(),
    servings: z.number().optional(),
    customMeal: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.entryType === 'recipe') {
        return !!data.recipeId
      }
      return true
    },
    {
      message: 'Recipe is required',
      path: ['recipeId'],
    }
  )
  .refine(
    (data) => {
      if (data.entryType === 'recipe') {
        return data.servings !== undefined && data.servings > 0
      }
      return true
    },
    {
      message: 'Servings is required',
      path: ['servings'],
    }
  )
  .refine(
    (data) => {
      if (data.entryType === 'custom') {
        return !!data.customMeal && data.customMeal.trim().length > 0
      }
      return true
    },
    {
      message: 'Custom meal is required',
      path: ['customMeal'],
    }
  )

type FormValues = z.infer<typeof mealPlanSchema>

export const MealPlanForm = ({
  recipes,
  onSubmit,
  onClose,
  opened,
  date,
  mealType,
  initialMeal,
}: MealPlanFormProps) => {
  const isEditing = !!initialMeal

  // Prepare custom meal options
  const customMealOptions = useMemo(() => {
    return CUSTOM_MEAL_TYPES.filter((t) => t.value !== 'other').map((type) => ({
      value: type.label,
      label: `${type.icon} ${type.label}`,
    }))
  }, [])

  // Prepare recipe options
  const recipeOptions = useMemo(() => {
    return recipes.map((recipe) => ({
      value: recipe.id,
      label: recipe.name,
    }))
  }, [recipes])

  const form = useForm<FormValues>({
    validate: zodResolver(mealPlanSchema),
    initialValues: {
      entryType: 'recipe',
      date,
      mealType,
      recipeId: '',
      servings: undefined,
      customMeal: '',
      note: '',
    },
  })

  // Initialize form with existing meal data
  useEffect(() => {
    if (initialMeal) {
      const isRecipeMeal = initialMeal.type === 'recipe'

      form.setValues({
        entryType: isRecipeMeal ? 'recipe' : 'custom',
        date: initialMeal.date,
        mealType: initialMeal.mealType,
        recipeId: isRecipeMeal ? initialMeal.recipeId : '',
        servings: isRecipeMeal ? initialMeal.servings : undefined,
        customMeal: isRecipeMeal
          ? ''
          : initialMeal.type === 'other'
            ? initialMeal.customText || ''
            : getMealPlanTypeInfo(initialMeal.type)?.label || '',
        note: initialMeal.note || '',
      })
    } else {
      form.setValues({
        entryType: 'recipe',
        date,
        mealType,
        recipeId: '',
        servings: undefined,
        customMeal: '',
        note: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMeal, date, mealType, opened])

  // Auto-set servings when recipe is selected
  useEffect(() => {
    if (form.values.recipeId) {
      const recipe = recipes.find((r) => r.id === form.values.recipeId)
      if (recipe && form.values.servings === undefined) {
        form.setFieldValue('servings', recipe.servings)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.recipeId])

  const handleSubmit = (values: FormValues) => {
    if (values.entryType === 'recipe') {
      const mealPlan: Partial<MealPlan> = {
        ...(initialMeal?.id && { id: initialMeal.id }),
        date: values.date,
        mealType: values.mealType,
        type: 'recipe',
        recipeId: values.recipeId!,
        servings: values.servings!,
        note: values.note || undefined,
      }
      onSubmit(mealPlan)
    } else {
      // Custom meal - check if it's a predefined option or free text
      const customValue = values.customMeal!.trim()
      
      // Find predefined type by matching the label (with or without icon)
      const predefinedType = CUSTOM_MEAL_TYPES.find(
        (t) => {
          // Match either "Label" or "🍽️ Label"
          return customValue === t.label || customValue === `${t.icon} ${t.label}`
        }
      )

      if (predefinedType && predefinedType.value !== 'other') {
        // Use predefined type
        const mealPlan: Partial<MealPlan> = {
          ...(initialMeal?.id && { id: initialMeal.id }),
          date: values.date,
          mealType: values.mealType,
          type: predefinedType.value as
            | 'dining-out'
            | 'takeout'
            | 'leftovers'
            | 'skipping',
          note: values.note || undefined,
        }
        onSubmit(mealPlan)
      } else {
        // Free text - use "other" type
        // Strip icon if present (e.g., "🍽️ Custom Text" -> "Custom Text")
        const textOnly = customValue.replace(/^[\u{1F000}-\u{1F9FF}]\s*/u, '')
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
          <SegmentedControl
            {...form.getInputProps('entryType')}
            data={[
              { label: 'Recipe', value: 'recipe' },
              { label: 'Custom', value: 'custom' },
            ]}
            fullWidth
          />

          {form.values.entryType === 'recipe' ? (
            <>
              <Select
                label="Select Recipe"
                placeholder="Choose a recipe"
                data={recipeOptions}
                searchable
                {...form.getInputProps('recipeId')}
              />

              <NumberInput
                label="Servings"
                placeholder="Number of servings"
                min={1}
                {...form.getInputProps('servings')}
              />
            </>
          ) : (
            <Autocomplete
              label="Custom Meal"
              placeholder="Dining Out, Takeout, Leftovers, or enter your own..."
              data={customMealOptions}
              {...form.getInputProps('customMeal')}
            />
          )}

          <DatePickerInput
            label="Date"
            placeholder="Select date"
            valueFormat="YYYY-MM-DD"
            value={form.values.date ? new Date(form.values.date) : null}
            onChange={(value) => {
              if (value) {
                const isoString = value.toISOString()
                const formattedDate = isoString.split('T')[0]
                form.setFieldValue('date', formattedDate)
              }
            }}
            error={form.errors.date}
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

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Meal</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
