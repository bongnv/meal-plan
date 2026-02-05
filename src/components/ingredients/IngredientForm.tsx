import { Button, Group, Select, Stack, TextInput } from '@mantine/core'
import { zodResolver, useForm } from '@mantine/form'

import { INGREDIENT_CATEGORIES, IngredientFormSchema } from '@/types/ingredient'

import type {
  Ingredient,
  IngredientCategory,
  IngredientFormValues,
} from '@/types/ingredient'

interface IngredientFormProps {
  ingredient?: Ingredient
  onSubmit: (values: IngredientFormValues) => void
  onCancel: () => void
}

export function IngredientForm({
  ingredient,
  onSubmit,
  onCancel,
}: IngredientFormProps) {
  const form = useForm<IngredientFormValues>({
    initialValues: {
      name: ingredient?.name || '',
      category: (ingredient?.category || '') as IngredientCategory,
    },
    validate: zodResolver(IngredientFormSchema),
  })

  const handleSubmit = (values: IngredientFormValues) => {
    onSubmit(values)
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Enter ingredient name"
          {...form.getInputProps('name')}
          required
        />

        <Select
          label="Category"
          placeholder="Select a category"
          data={INGREDIENT_CATEGORIES}
          {...form.getInputProps('category')}
          searchable
          required
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {ingredient ? 'Update Ingredient' : 'Create Ingredient'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
