import React, { useState } from 'react'

import { Label } from '@radix-ui/react-label'

import {
  IngredientCategory,
  IngredientItemSchema,
  StandardUnit,
  type IngredientItem,
} from '../../types/recipe'

interface IngredientFormProps {
  ingredient?: IngredientItem
  onSubmit: (ingredient: IngredientItem | Omit<IngredientItem, 'id'>) => void
  onCancel: () => void
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  ingredient,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(ingredient?.name ?? '')
  const [category, setCategory] = useState<IngredientCategory | ''>(
    ingredient?.category ?? ''
  )
  const [standardUnit, setStandardUnit] = useState<StandardUnit | ''>(
    ingredient?.standardUnit ?? ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const formData = ingredient
      ? { id: ingredient.id, name, category, standardUnit }
      : { name, category, standardUnit }

    const result = IngredientItemSchema.omit(
      ingredient ? {} : { id: true }
    ).safeParse(formData)

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        const field = err.path[0] as string
        newErrors[field] = err.message
      })
      setErrors(newErrors)
      return
    }

    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          Category
        </Label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value as IngredientCategory)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          {Object.values(IngredientCategory).map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="standardUnit" className="text-sm font-medium">
          Standard Unit
        </Label>
        <select
          id="standardUnit"
          value={standardUnit}
          onChange={e => setStandardUnit(e.target.value as StandardUnit)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a unit</option>
          <optgroup label="Weight">
            <option value={StandardUnit.Gram}>g (gram)</option>
            <option value={StandardUnit.Kilogram}>kg (kilogram)</option>
          </optgroup>
          <optgroup label="Volume">
            <option value={StandardUnit.Milliliter}>ml (milliliter)</option>
            <option value={StandardUnit.Liter}>l (liter)</option>
          </optgroup>
          <optgroup label="Count">
            <option value={StandardUnit.Piece}>piece</option>
          </optgroup>
          <optgroup label="Recipe Measurements">
            <option value={StandardUnit.Tablespoon}>tbsp (tablespoon)</option>
            <option value={StandardUnit.Teaspoon}>tsp (teaspoon)</option>
            <option value={StandardUnit.Cup}>cup</option>
          </optgroup>
          <optgroup label="Specific">
            <option value={StandardUnit.Clove}>clove</option>
            <option value={StandardUnit.Slice}>slice</option>
            <option value={StandardUnit.Bunch}>bunch</option>
            <option value={StandardUnit.Pinch}>pinch</option>
          </optgroup>
        </select>
        {errors.standardUnit && (
          <p className="text-sm text-red-600">{errors.standardUnit}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {ingredient ? 'Update Ingredient' : 'Create Ingredient'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default IngredientForm
