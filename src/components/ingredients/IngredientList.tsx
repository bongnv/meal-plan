import React from 'react'

import type { IngredientItem } from '../../types/recipe'

interface IngredientListProps {
  ingredients: IngredientItem[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onEdit,
  onDelete,
}) => {
  if (ingredients.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <p className="mb-2 text-xl font-semibold text-gray-700">
          No ingredients yet
        </p>
        <p className="text-gray-500">
          Add your first ingredient to get started
        </p>
      </div>
    )
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      produce: 'bg-green-100 text-green-800',
      dairy: 'bg-blue-100 text-blue-800',
      meat: 'bg-red-100 text-red-800',
      pantry: 'bg-yellow-100 text-yellow-800',
      frozen: 'bg-cyan-100 text-cyan-800',
      bakery: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {ingredients.map(ingredient => (
        <div
          key={ingredient.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {ingredient.name}
            </h3>
          </div>

          <div className="mb-4 space-y-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getCategoryColor(
                ingredient.category
              )}`}
            >
              {ingredient.category.charAt(0).toUpperCase() +
                ingredient.category.slice(1)}
            </span>
            <p className="text-sm text-gray-600">
              Unit: {ingredient.standardUnit}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(ingredient.id)}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Edit ${ingredient.name}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(ingredient.id)}
              className="flex-1 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={`Delete ${ingredient.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default IngredientList
