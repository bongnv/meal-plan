import { describe, expect, it } from 'vitest'

import { Ingredient } from '../types/ingredient'

import { generateRecipeImportPrompt } from './aiPromptGenerator'

describe('generateRecipeImportPrompt', () => {
  it('should generate a prompt with ingredient library', () => {
    const ingredients: Ingredient[] = [
      {
        id: '1',
        name: 'Olive Oil',
        category: 'Oils & Fats',
        unit: 'tablespoon',
      },
      { id: '2', name: 'Garlic', category: 'Vegetables', unit: 'clove' },
      { id: '3', name: 'Basil', category: 'Herbs & Spices', unit: 'bunch' },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should include ingredient library
    expect(prompt).toContain('Olive Oil')
    expect(prompt).toContain('Garlic')
    expect(prompt).toContain('Basil')

    // Should include ingredient IDs
    expect(prompt).toContain('1')
    expect(prompt).toContain('2')
    expect(prompt).toContain('3')

    // Should include categories
    expect(prompt).toContain('Oils & Fats')
    expect(prompt).toContain('Vegetables')
    expect(prompt).toContain('Herbs & Spices')

    // Should include units
    expect(prompt).toContain('tablespoon')
    expect(prompt).toContain('clove')
    expect(prompt).toContain('bunch')
  })

  it('should include JSON schema definition', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Tomato', category: 'Vegetables', unit: 'piece' },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should mention JSON format
    expect(prompt).toContain('JSON')

    // Should include recipe structure fields
    expect(prompt).toContain('name')
    expect(prompt).toContain('description')
    expect(prompt).toContain('ingredients')
    expect(prompt).toContain('instructions')
    expect(prompt).toContain('servings')
    expect(prompt).toContain('totalTime')
    expect(prompt).toContain('tags')

    // Should mention ingredient mapping
    expect(prompt).toContain('ingredientId')
    expect(prompt).toContain('quantity')
  })

  it('should include instructions for AI', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Salt', category: 'Condiments', unit: 'pinch' },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should have clear instructions
    expect(prompt).toContain('parse')
    expect(prompt.toLowerCase()).toMatch(/recipe|url|text/)

    // Should instruct about ingredient mapping
    expect(prompt.toLowerCase()).toMatch(/map|match/)
    expect(prompt.toLowerCase()).toContain('ingredient')
  })

  it('should include example output format', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', category: 'Baking', unit: 'cup' },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should include an example or template
    expect(prompt.toLowerCase()).toMatch(/example|format|template/)
  })

  it('should handle empty ingredient library', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should still generate a valid prompt
    expect(prompt).toBeTruthy()
    expect(prompt.length).toBeGreaterThan(100)

    // Should mention empty library
    expect(prompt.toLowerCase()).toMatch(/no ingredients|empty|add new/)
  })

  it('should instruct AI to suggest new ingredients with category', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Butter', category: 'Dairy', unit: 'tablespoon' },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should instruct to suggest new ingredients
    expect(prompt.toLowerCase()).toMatch(/new ingredient|suggest|category/)
  })

  it('should include all required recipe fields in schema', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Check all required recipe fields are mentioned
    const requiredFields = [
      'id',
      'name',
      'description',
      'ingredients',
      'instructions',
      'servings',
      'totalTime',
      'tags',
    ]

    requiredFields.forEach(field => {
      expect(prompt).toContain(field)
    })
  })

  it('should mention optional imageUrl field', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    expect(prompt).toContain('imageUrl')
    expect(prompt.toLowerCase()).toMatch(/optional/)
  })
})
