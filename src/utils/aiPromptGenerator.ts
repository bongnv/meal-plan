import { Ingredient } from '../types/ingredient'

/**
 * Generates a prompt for AI tools (ChatGPT, Claude) to parse recipes
 * and return structured JSON data that matches our recipe schema.
 *
 * The prompt includes the current ingredient library to help the AI
 * map ingredients to existing IDs, reducing manual work for the user.
 *
 * @param ingredients - Array of ingredients from the ingredient library
 * @returns A formatted prompt string ready to be copied and used with AI tools
 */
export function generateRecipeImportPrompt(ingredients: Ingredient[]): string {
  const ingredientList =
    ingredients.length > 0
      ? ingredients
          .map(
            ing =>
              `  - ID: ${ing.id}, Name: "${ing.name}", Category: ${ing.category}`
          )
          .join('\n')
      : '  (No ingredients in library yet - you will need to suggest new ingredients with categories)'

  return `Please parse the following recipe and convert it to JSON format matching this schema:

## Recipe JSON Schema

\`\`\`json
{
  "id": "string (generate a unique ID like 'recipe_1234567890')",
  "name": "string (recipe name)",
  "description": "string (brief description)",
  "ingredients": [
    {
      "ingredientId": "string (reference to ingredient ID from library below, or suggest new ingredient)",
      "quantity": "number (numeric quantity)",
      "unit": "string (REQUIRED - one of: cup, tablespoon, teaspoon, gram, kilogram, milliliter, liter, piece, whole, clove, slice, bunch, pinch, dash, can, package)",
      "displayName": "string (optional - recipe-specific name as it appears in the recipe, e.g., 'Truss Tomatoes' instead of 'Tomato')"
    }
  ],
  "instructions": ["string (step 1)", "string (step 2)", ...],
  "servings": "number (number of servings)",
  "prepTime": "number (preparation time in minutes)",
  "cookTime": "number (cooking time in minutes)",
  "tags": ["string (tag 1)", "string (tag 2)", ...],
  "imageUrl": "string (optional - URL to recipe image if available, OMIT this field entirely if no image URL is available - do not use empty string)"
}
\`\`\`

## Current Ingredient Library

${ingredientList}

## Instructions

1. Parse the recipe from the URL or text I provide
2. For each ingredient in the recipe:
   - Try to match it to an existing ingredient in the library by name (case-insensitive)
   - If found, use the existing ingredientId
   - If the recipe uses a different name (e.g., "Truss Tomatoes" vs "Tomato"), include it as displayName
   - Determine the appropriate unit from the recipe and convert unsupported units:
     * pound (lb) → gram (1 lb = 454 grams)
     * ounce (oz) → gram (1 oz = 28 grams)
     * fluid ounce (fl oz) → milliliter (1 fl oz = 30 ml)
     * pint → milliliter (1 pint = 473 ml)
     * quart → liter (1 quart = 0.95 liter)
     * gallon → liter (1 gallon = 3.8 liters)
   - If no match exists in the library, suggest a new ingredient with:
     - A unique sequential placeholder ID (like "new_1", "new_2", "new_3" - app will generate actual IDs)
     - An appropriate category from: Vegetables, Fruits, Meat, Poultry, Seafood, Dairy, Grains, Legumes, Nuts & Seeds, Herbs & Spices, Oils & Fats, Condiments, Baking, Other
3. IMPORTANT: Every recipe ingredient MUST include a unit field with one of these values: cup, tablespoon, teaspoon, gram, kilogram, milliliter, liter, piece, whole, clove, slice, bunch, pinch, dash, can, package
4. Extract quantities as numbers (convert fractions like "1/2" to 0.5, "1 1/2" to 1.5)
5. Break instructions into clear, sequential steps
6. Estimate prepTime (preparation time) and cookTime (cooking time) separately in minutes
7. Generate relevant tags (e.g., "Italian", "Quick", "Vegetarian")
8. Use placeholder 'temp' for recipe ID (app will generate actual ID)
9. If no image URL is available, OMIT the imageUrl field entirely - do not include it with an empty string
10. Return ONLY the JSON object, no additional text

## Example Output Format

\`\`\`json
{
  "id": "temp",
  "name": "Garlic Pasta",
  "description": "Simple and delicious pasta with garlic and olive oil",
  "ingredients": [
    { "ingredientId": "1", "quantity": 4, "unit": "tablespoon", "displayName": "olive oil" },
    { "ingredientId": "2", "quantity": 4, "unit": "clove" },
    { "ingredientId": "new_1", "quantity": 500, "unit": "gram", "displayName": "Homemade Pasta", "suggestedIngredient": { "id": "new_1", "name": "Pasta", "category": "Grains" } }
  ],
  "instructions": [
    "Boil water and cook pasta according to package directions",
    "Heat olive oil in a pan over medium heat",
    "Add minced garlic and sauté until fragrant",
    "Drain pasta and toss with garlic oil",
    "Season with salt and pepper, serve immediately"
  ],
  "servings": 4,
  "prepTime": 5,
  "cookTime": 15,
  "tags": ["Italian", "Quick", "Easy"],
  "imageUrl": "https://example.com/recipe-image.jpg"
}
\`\`\`

---

I will provide the recipe URL or recipe text in my next message. Please wait for it, then parse it according to the instructions above and return only the JSON object.`
}
