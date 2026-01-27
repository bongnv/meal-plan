import { Ingredient } from '../types/ingredient'

/**
 * Generates a prompt for AI tools (ChatGPT, Claude) to parse recipes
 * and return structured JSON data that matches our recipe schema.
 *
 * The prompt includes the current ingredient library to help the AI
 * match ingredients to existing ones. New ingredients are created automatically
 * with the category specified by the AI.
 *
 * @param ingredients - Array of ingredients from the ingredient library
 * @returns A formatted prompt string ready to be copied and used with AI tools
 */
export function generateRecipeImportPrompt(ingredients: Ingredient[]): string {
  const ingredientList =
    ingredients.length > 0
      ? ingredients.map(ing => `  - ${ing.name}`).join('\n')
      : '  (No ingredients in library yet - any ingredients you include will be added automatically)'

  return `Please parse the following recipe and convert it to JSON format matching this schema:

## Recipe JSON Schema

\`\`\`json
{
  "name": "string (recipe name)",
  "description": "string (brief description)",
  "ingredients": [
    {
      "name": "string (ingredient name - will be matched to library or created as new)",
      "quantity": "number (numeric quantity)",
      "unit": "string (REQUIRED - one of: cup, tablespoon, teaspoon, gram, kilogram, milliliter, liter, piece, whole, clove, slice, bunch, pinch, dash, can, package)",
      "category": "string (REQUIRED for new ingredients - one of: Vegetables, Fruits, Meat, Poultry, Seafood, Dairy, Grains, Legumes, Nuts & Seeds, Herbs & Spices, Oils & Fats, Condiments, Baking, Other)",
      "displayName": "string (optional - recipe-specific name as it appears in the recipe, e.g., 'Boneless Chicken Breast' instead of just 'Chicken')"
    }
  ],
  "subRecipes": [
    {
      "recipe": {
        "name": "string (sub-recipe name)",
        "description": "string",
        "ingredients": [...],
        "instructions": [...],
        "servings": "number",
        "prepTime": "number",
        "cookTime": "number",
        "tags": [...],
        "subRecipes": []
      },
      "servings": "number (how many servings of this sub-recipe to use in the main recipe)",
      "displayName": "string (optional - custom name for this component)"
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
   - Use the generic ingredient name (e.g., "Chicken", "Tomato", "Rice")
   - The app will automatically match to existing ingredients or create new ones
   - If the ingredient is NOT in the library, include a category (choose the best match from the list in schema above)
   - If the recipe uses a specific variety (e.g., "Boneless Chicken Breast"), put the generic name in 'name' and the specific variety in 'displayName'
   - Determine the appropriate unit from the recipe and convert unsupported units:
     * pound (lb) → gram (1 lb = 454 grams)
     * ounce (oz) → gram (1 oz = 28 grams)
     * fluid ounce (fl oz) → milliliter (1 fl oz = 30 ml)
     * pint → milliliter (1 pint = 473 ml)
     * quart → liter (1 quart = 0.95 liter)
     * gallon → liter (1 gallon = 3.8 liters)
3. Every recipe ingredient MUST include a unit field from the list in step 2 (cup, tablespoon, teaspoon, gram, kilogram, milliliter, liter, piece, whole, clove, slice, bunch, pinch, dash, can, package)
4. For sub-recipes (recipes that are components of this main recipe):
   - Identify sub-recipes mentioned in instructions (e.g., "Make cilantro rice", "Prepare the sauce")
   - Add them to the subRecipes array with the FULL recipe object inline:
     * recipe: Complete recipe object with name, description, ingredients, instructions, servings, prepTime, cookTime, tags, subRecipes (see schema above)
     * Do NOT include IDs - the app will generate them automatically
     * servings: how many servings of that sub-recipe to use in the main recipe
     * displayName: optional descriptive name (e.g., "Cilantro Rice", "Special Sauce")
   - IMPORTANT: Include sub-recipe ingredients WITHIN the sub-recipe object, NOT in the main recipe ingredients
   - Sub-recipes can also have sub-recipes (nesting is allowed)
   - If no sub-recipes, use empty array: "subRecipes": []
5. Extract quantities as numbers (convert fractions like "1/2" to 0.5, "1 1/2" to 1.5). If quantity is missing, omit the ingredient.
6. Break instructions into clear, sequential steps. Keep each step concise and actionable.
7. Estimate prepTime (preparation time) and cookTime (cooking time) separately in minutes. Both must be positive numbers.
8. Generate relevant tags (e.g., "Italian", "Quick", "Vegetarian")
9. Only include imageUrl if you have found a valid image URL. Omit entirely if not available - do NOT use empty string or null.
10. CRITICAL: Validate the JSON structure is complete and valid before returning.
11. Return ONLY the JSON object, no additional text, no explanations.

## Example Output Format

\`\`\`json
{
  "name": "Burrito Bowl",
  "description": "Fresh burrito bowl with cilantro rice and beans",
  "ingredients": [
    { "name": "Black Beans", "quantity": 200, "unit": "gram", "category": "Legumes" },
    { "name": "Cheese", "quantity": 50, "unit": "gram", "category": "Dairy", "displayName": "Cheddar Cheese" }
  ],
  "subRecipes": [
    {
      "recipe": {
        "name": "Cilantro Rice",
        "description": "Fresh cilantro-infused rice",
        "ingredients": [
          { "name": "Rice", "quantity": 200, "unit": "gram", "category": "Grains" },
          { "name": "Cilantro", "quantity": 20, "unit": "gram", "category": "Herbs & Spices", "displayName": "Fresh Cilantro" },
          { "name": "Lime Juice", "quantity": 1, "unit": "tablespoon", "category": "Condiments" }
        ],
        "instructions": [
          "Cook rice according to package directions",
          "Chop cilantro finely",
          "Mix cooked rice with cilantro and lime juice"
        ],
        "servings": 4,
        "prepTime": 5,
        "cookTime": 15,
        "tags": ["Side", "Mexican"],
        "subRecipes": []
      },
      "servings": 2,
      "displayName": "Cilantro Rice"
    }
  ],
  "instructions": [
    "Make cilantro rice using the sub-recipe",
    "Heat black beans in a pot",
    "Assemble bowl with rice, beans, and cheese",
    "Top with your favorite toppings"
  ],
  "servings": 4,
  "prepTime": 10,
  "cookTime": 15,
  "tags": ["Mexican", "Bowls", "Vegetarian"],
  "imageUrl": "https://example.com/burrito-bowl.jpg"
}
\`\`\`

---

## Important Notes

- **Quality**: Return well-structured, valid JSON with no errors or omissions
- **Consistency**: Use consistent naming and formatting throughout
- **Clarity**: Ingredient names should be singular and generic ("Tomato" not "Tomatoes")
- **Categories**: Only use the exact categories listed in the schema
- **Sub-recipes**: Only create sub-recipes for distinct recipe components mentioned explicitly in instructions

---

I will provide the recipe URL or recipe text in my next message. Please wait for it, then parse it according to the instructions above and return only the JSON object.`
}
