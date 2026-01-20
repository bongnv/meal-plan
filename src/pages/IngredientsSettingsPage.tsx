import React, { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import IngredientForm from '../components/ingredients/IngredientForm'
import IngredientList from '../components/ingredients/IngredientList'
import { useIngredients } from '../contexts/IngredientContext'

import type { IngredientItem } from '../types/recipe'

export const IngredientsSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getIngredientById,
  } = useIngredients()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingIngredient = editingId ? getIngredientById(editingId) : undefined

  const handleSubmit = (
    ingredient: IngredientItem | Omit<IngredientItem, 'id'>
  ) => {
    if ('id' in ingredient) {
      updateIngredient(ingredient)
    } else {
      addIngredient(ingredient)
    }
    setShowForm(false)
    setEditingId(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      deleteIngredient(id)
    }
  }

  const handleAddNew = () => {
    setEditingId(null)
    setShowForm(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/recipes')}
            className="mb-2 text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Recipes
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Ingredient Library
          </h1>
          <p className="mt-2 text-gray-600">Manage your ingredient database</p>
        </div>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Add Ingredient
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
          </h2>
          <IngredientForm
            ingredient={editingIngredient}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <IngredientList
          ingredients={ingredients}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
