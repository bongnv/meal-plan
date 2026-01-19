import { useState, FormEvent } from 'react'

import * as Label from '@radix-ui/react-label'

import { Recipe, RecipeInput, RecipeInputSchema } from '../../types/recipe'

interface RecipeFormProps {
  recipe?: Recipe
  onSubmit: (recipe: RecipeInput) => void
  onCancel: () => void
}

interface FormErrors {
  name?: string
  description?: string
  servings?: string
  totalTime?: string
  tags?: string
  ingredients?: string
  instructions?: string
  general?: string
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const isEditMode = !!recipe

  // Initialize form state
  const [name, setName] = useState(recipe?.name || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [servings, setServings] = useState(
    recipe?.servings ? String(recipe.servings) : ''
  )
  const [totalTime, setTotalTime] = useState(
    recipe?.totalTime ? String(recipe.totalTime) : ''
  )
  const [tags, setTags] = useState(recipe?.tags?.join(', ') || '')
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients || [{ ingredientId: '', quantity: 0 }]
  )
  const [instructions, setInstructions] = useState(recipe?.instructions || [''])
  const [errors, setErrors] = useState<FormErrors>({})

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredientId: '', quantity: 0 }])
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (
    index: number,
    field: 'ingredientId' | 'quantity',
    value: string | number
  ) => {
    const updated = [...ingredients]
    if (field === 'ingredientId') {
      updated[index] = { ...updated[index], ingredientId: value as string }
    } else {
      updated[index] = { ...updated[index], quantity: Number(value) }
    }
    setIngredients(updated)
  }

  const handleAddInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Parse tags from comma-separated string
    const parsedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    // Filter out empty ingredients and instructions
    const validIngredients = ingredients.filter(
      ing => ing.ingredientId.trim() !== '' && ing.quantity > 0
    )
    const validInstructions = instructions.filter(inst => inst.trim() !== '')

    const recipeInput: RecipeInput = {
      name,
      description,
      ingredients: validIngredients,
      instructions: validInstructions,
      servings: Number(servings),
      totalTime: Number(totalTime),
      tags: parsedTags,
    }

    // Validate with Zod
    const result = RecipeInputSchema.safeParse(recipeInput)

    if (!result.success) {
      const newErrors: FormErrors = {}
      result.error.errors.forEach(err => {
        const path = err.path[0] as string
        if (path === 'name') {
          newErrors.name = 'Name is required'
        } else if (path === 'servings') {
          newErrors.servings = 'Servings must be a positive number'
        } else if (path === 'totalTime') {
          newErrors.totalTime = 'Total time cannot be negative'
        } else {
          newErrors[path as keyof FormErrors] = err.message
        }
      })
      setErrors(newErrors)
      return
    }

    // Submit if validation passes
    onSubmit(result.data)
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {isEditMode ? 'Edit Recipe' : 'Create Recipe'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label.Root htmlFor="name" className="text-sm font-medium">
            Name *
          </Label.Root>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <Label.Root htmlFor="description" className="text-sm font-medium">
            Description
          </Label.Root>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Servings and Total Time in a row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label.Root htmlFor="servings" className="text-sm font-medium">
              Servings *
            </Label.Root>
            <input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={e => setServings(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-invalid={!!errors.servings}
              aria-describedby={errors.servings ? 'servings-error' : undefined}
            />
            {errors.servings && (
              <p id="servings-error" className="text-sm text-red-600">
                {errors.servings}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label.Root htmlFor="totalTime" className="text-sm font-medium">
              Total Time (minutes) *
            </Label.Root>
            <input
              id="totalTime"
              type="number"
              min="0"
              value={totalTime}
              onChange={e => setTotalTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-invalid={!!errors.totalTime}
              aria-describedby={
                errors.totalTime ? 'totalTime-error' : undefined
              }
            />
            {errors.totalTime && (
              <p id="totalTime-error" className="text-sm text-red-600">
                {errors.totalTime}
              </p>
            )}
          </div>
        </div>

        {/* Tags field */}
        <div className="space-y-2">
          <Label.Root htmlFor="tags" className="text-sm font-medium">
            Tags (comma-separated)
          </Label.Root>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g., dinner, quick, healthy"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Ingredients section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ingredients</h2>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Ingredient
            </button>
          </div>

          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 p-4 md:grid-cols-12"
            >
              <div className="space-y-2 md:col-span-6">
                <Label.Root
                  htmlFor={`ingredient-id-${index}`}
                  className="text-sm font-medium"
                >
                  Ingredient ID {index + 1}
                </Label.Root>
                <input
                  id={`ingredient-id-${index}`}
                  type="text"
                  value={ingredient.ingredientId}
                  onChange={e =>
                    handleIngredientChange(
                      index,
                      'ingredientId',
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`Ingredient ${index + 1}`}
                />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label.Root
                  htmlFor={`ingredient-quantity-${index}`}
                  className="text-sm font-medium"
                >
                  Quantity
                </Label.Root>
                <input
                  id={`ingredient-quantity-${index}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={ingredient.quantity || ''}
                  onChange={e =>
                    handleIngredientChange(index, 'quantity', e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end md:col-span-2">
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="w-full rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  Remove Ingredient
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Instructions</h2>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Instruction
            </button>
          </div>

          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label.Root
                  htmlFor={`instruction-${index}`}
                  className="text-sm font-medium"
                >
                  Step {index + 1}
                </Label.Root>
                <textarea
                  id={`instruction-${index}`}
                  value={instruction}
                  onChange={e => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(index)}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Remove step ${index + 1}`}
                >
                  Remove Step
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-4 border-t pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  )
}
