import { useState } from 'react'

import type { RecipeSection } from '@/types/recipe'

export interface RecipeSectionManagerReturn {
  sections: RecipeSection[]
  addSection: () => void
  removeSection: (index: number) => void
  updateSectionName: (index: number, name: string) => void
  addIngredient: (sectionIndex: number) => void
  removeIngredient: (sectionIndex: number, ingredientIndex: number) => void
  updateIngredient: (
    sectionIndex: number,
    ingredientIndex: number,
    field: string,
    value: any
  ) => void
  addInstruction: (sectionIndex: number) => void
  removeInstruction: (sectionIndex: number, instructionIndex: number) => void
  updateInstruction: (
    sectionIndex: number,
    instructionIndex: number,
    value: string
  ) => void
}

/**
 * Custom hook for managing recipe sections, ingredients, and instructions
 * Extracts complex state management logic from RecipeForm component
 * @param initialSections Initial sections (from existing recipe or default)
 * @returns Section state and management actions
 */
export function useRecipeSectionManager(
  initialSections?: RecipeSection[]
): RecipeSectionManagerReturn {
  const [sections, setSections] = useState<RecipeSection[]>(
    initialSections ?? [
      { name: undefined, ingredients: [], instructions: [] },
    ]
  )

  // Section management
  const addSection = () => {
    setSections([
      ...sections,
      { name: undefined, ingredients: [], instructions: [] },
    ])
  }

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSectionName = (index: number, name: string) => {
    const newSections = [...sections]
    newSections[index].name = name || undefined
    setSections(newSections)
  }

  // Ingredient management within sections
  const addIngredient = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].ingredients.push({
      ingredientId: '',
      quantity: 0,
      unit: 'whole',
      displayName: '',
    })
    setSections(newSections)
  }

  const removeIngredient = (sectionIndex: number, ingredientIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].ingredients.splice(ingredientIndex, 1)
    setSections(newSections)
  }

  const updateIngredient = (
    sectionIndex: number,
    ingredientIndex: number,
    field: string,
    value: any
  ) => {
    const newSections = [...sections]
    ;(newSections[sectionIndex].ingredients[ingredientIndex] as any)[field] =
      value
    setSections(newSections)
  }

  // Instruction management within sections
  const addInstruction = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].instructions.push('')
    setSections(newSections)
  }

  const removeInstruction = (
    sectionIndex: number,
    instructionIndex: number
  ) => {
    const newSections = [...sections]
    newSections[sectionIndex].instructions.splice(instructionIndex, 1)
    setSections(newSections)
  }

  const updateInstruction = (
    sectionIndex: number,
    instructionIndex: number,
    value: string
  ) => {
    const newSections = [...sections]
    newSections[sectionIndex].instructions[instructionIndex] = value
    setSections(newSections)
  }

  return {
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
  }
}
