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

  return `Parse this recipe and return VALID JSON matching this schema:

\`\`\`json
{
  "name": "string",
  "description": "string",
  "sections": [
    {
      "name": "string (optional - omit for simple recipes)",
      "ingredients": [
        {
          "name": "string (ingredient name to Buy)",
          "quantity": "number",
          "unit": "cup | tablespoon | teaspoon | gram | kilogram | milliliter | liter | piece | whole | clove | slice | bunch | pinch | dash | can | package",
          "category": "Vegetables | Fruits | Meat | Poultry | Seafood | Dairy | Grains | Legumes | Nuts & Seeds | Herbs & Spices | Oils & Fats | Condiments | Baking | Other",
          "displayName": "string (optional)"
        }
      ],
      "instructions": ["step 1", "step 2", ...]
    }
  ],
  "servings": "number",
  "prepTime": "number (minutes)",
  "cookTime": "number (minutes)",
  "tags": ["tag1", "tag2", ...],
  "imageUrl": "string (optional - omit if unavailable)"
}
\`\`\`

## Ingredient Library
${ingredientList}

## Guidelines

**Sections:**
- Simple: ONE section, omit "name" property
- Complex: Multiple named sections ("Broth", "Assembly", etc.)

**Ingredients:**
- name: Generic ingredient to BUY (e.g., "Banana", "Cilantro", "Chicken Breast")
- displayName: Ingredient description shown in recipe (replaces 'name') - NO quantity, just preparation/adjectives (e.g., "Fresh cilantro, chopped", "Ripe bananas, mashed")
- Match library ingredients by name (case-insensitive)
- Avoid vague: "Fresh Herbs", "Spices", "Meat" - Use specific: "Cilantro", "Cumin", "Chicken Breast"
- New ingredients: include category

**Units & Conversions:**
- Convert: lb→gram (454g), oz→gram (28g), fl oz→ml (30ml), pint→ml (473ml), quart→L (0.95L)
- Fractions: "1/2" → 0.5

**Other:**
- Break instructions into clear steps
- Estimate prep/cook times separately
- Generate relevant tags
- Omit imageUrl if no valid URL available

Return ONLY the JSON object.

## Examples

**Simple Recipe:**
\`\`\`json
{
  "name": "Chocolate Chip Cookies",
  "description": "Classic homemade cookies",
  "sections": [{
    "ingredients": [
      { "name": "Flour", "quantity": 2, "unit": "cup", "category": "Baking", "displayName": "All-purpose flour" },
      { "name": "Sugar", "quantity": 1, "unit": "cup", "category": "Baking" },
      { "name": "Butter", "quantity": 0.5, "unit": "cup", "category": "Dairy", "displayName": "Unsalted butter, softened" },
      { "name": "Chocolate Chips", "quantity": 2, "unit": "cup", "category": "Baking" }
    ],
    "instructions": ["Mix ingredients", "Bake at 350°F for 12 minutes"]
  }],
  "servings": 24,
  "prepTime": 15,
  "cookTime": 12,
  "tags": ["Dessert", "Baking"]
}
\`\`\`

**Complex Recipe:**
\`\`\`json
{
  "name": "Chicken Pho",
  "description": "Vietnamese soup",
  "sections": [
    {
      "name": "Broth",
      "ingredients": [
        { "name": "Chicken Breast", "quantity": 1000, "unit": "gram", "category": "Poultry", "displayName": "Bone-in chicken breast" },
        { "name": "Onion", "quantity": 2, "unit": "whole", "category": "Vegetables" },
        { "name": "Ginger", "quantity": 50, "unit": "gram", "category": "Herbs & Spices", "displayName": "Fresh ginger, sliced" },
        { "name": "Star Anise", "quantity": 3, "unit": "whole", "category": "Herbs & Spices" }
      ],
      "instructions": ["Char onion and ginger", "Simmer 2 hours"]
    },
    {
      "name": "Assembly",
      "ingredients": [
        { "name": "Rice Noodles", "quantity": 400, "unit": "gram", "category": "Grains", "displayName": "Flat rice noodles (banh pho)" },
        { "name": "Cilantro", "quantity": 0.5, "unit": "bunch", "category": "Herbs & Spices" },
        { "name": "Lime", "quantity": 2, "unit": "whole", "category": "Fruits", "displayName": "Lime, cut into wedges" }
      ],
      "instructions": ["Cook noodles", "Assemble bowls", "Pour hot broth"]
    }
  ],
  "servings": 4,
  "prepTime": 30,
  "cookTime": 120,
  "tags": ["Vietnamese", "Soup", "Main Course"]
}
\`\`\`

I'll provide the recipe in my next message.`
}
