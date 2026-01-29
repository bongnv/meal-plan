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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        name: 'Garlic',
        category: 'Vegetables',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        name: 'Basil',
        category: 'Herbs & Spices',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
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
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should mention JSON format
    expect(prompt).toContain('JSON')

    // Should include recipe structure fields
    expect(prompt).toContain('name')
    expect(prompt).toContain('description')
    expect(prompt).toContain('ingredients')
    expect(prompt).toContain('instructions')
    expect(prompt).toContain('servings')
    expect(prompt).toContain('prepTime')
    expect(prompt).toContain('cookTime')
    expect(prompt).toContain('tags')

    // Should mention ingredient fields
    expect(prompt).toContain('quantity')
    expect(prompt).toContain('unit')
  })

  it('should include instructions for AI', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should have clear instructions
    expect(prompt).toContain('Parse')
    expect(prompt.toLowerCase()).toMatch(/recipe|url|text/)

    // Should instruct about ingredient mapping
    expect(prompt.toLowerCase()).toMatch(/map|match/)
    expect(prompt.toLowerCase()).toContain('ingredient')
  })

  it('should include example output format', () => {
    const ingredients: Ingredient[] = []

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
    const ingredients: Ingredient[] = []

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
      'prepTime',
      'cookTime',
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

  it('should instruct to omit imageUrl when not available', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should instruct to omit field when no URL is available
    expect(prompt).toContain('omit')
    expect(prompt).toContain('imageUrl')
  })

  it('should include displayName field in ingredient schema', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should mention displayName field
    expect(prompt).toContain('displayName')
  })

  it('should document displayName as optional field', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should indicate displayName is optional
    expect(prompt.toLowerCase()).toMatch(/displayname.*optional/)
  })

  it('should explain displayName purpose in instructions', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should explain displayName reflects recipe-specific naming
    const lowerPrompt = prompt.toLowerCase()
    expect(lowerPrompt).toContain('displayname')
    expect(lowerPrompt).toMatch(/recipe.{0,50}(appears|shown|name|specific)/)
  })

  it('should instruct AI to convert units when different from library', () => {
    const ingredients: Ingredient[] = [
      {
        id: '1',
        name: 'Olive Oil',
        category: 'Oils & Fats',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should mention unit handling
    expect(prompt.toLowerCase()).toMatch(/unit/)

    // Should instruct to convert unsupported units
    expect(prompt.toLowerCase()).toContain('convert')
    expect(prompt).toMatch(/lb.*gram/i)
  })

  it('should provide unit conversion examples in instructions', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should mention units in available options
    expect(prompt.toLowerCase()).toContain('unit')
  })

  it('should demonstrate unit conversion in example output', () => {
    const ingredients: Ingredient[] = []

    const prompt = generateRecipeImportPrompt(ingredients)

    // Should show unit in example
    expect(prompt.toLowerCase()).toContain('unit')
  })

  it('should include sub-recipes example in output format', () => {
    const prompt = generateRecipeImportPrompt([])

    expect(prompt).toContain('Chicken Pho')
    expect(prompt).toContain('Chocolate Chip Cookies')
    expect(prompt).toContain('"ingredients":')
    expect(prompt).toContain('"instructions":')
})
})
