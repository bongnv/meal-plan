# Meal Plan - Implementation Plan

## 1.1 Create, Edit, and Delete Recipes

### Implementation Steps

- [x] 1. Define Recipe data types
  - Create TypeScript interfaces for Recipe structure in `src/types/recipe.ts`
  - Include fields: id, name, description, ingredients, instructions, servings, prepTime, cookTime, tags, imageUrl (optional)
  - Define Ingredient interface with name, quantity, unit fields

- [x] 2. Create LocalStorage service for recipes (TDD)
  - Write unit tests first in `src/utils/storage/recipeStorage.test.ts`
  - Test cases: loadRecipes, saveRecipes, generateId, error handling
  - Implement `RecipeStorageService` in `src/utils/storage/recipeStorage.ts`
  - Methods: `loadRecipes()` - load all recipes from localStorage, `saveRecipes(recipes)` - save entire collection
  - Note: React Context will manage in-memory CRUD operations for efficiency

- [x] 3. Set up Recipe Context (TDD)
  - Write unit tests first in `src/contexts/RecipeContext.test.tsx`
  - Test cases: loadRecipes on mount, getRecipeById (in-memory), addRecipe, updateRecipe, deleteRecipe, state updates
  - Create `RecipeContext` in `src/contexts/RecipeContext.tsx`
  - Load recipes once on mount using RecipeStorageService
  - Maintain in-memory state: recipes list, loading state, error state
  - Actions operate on in-memory state and persist via RecipeStorageService:
    - `getRecipeById(id)` - find in memory
    - `addRecipe(recipe)` - add to state + persist
    - `updateRecipe(recipe)` - update state + persist
    - `deleteRecipe(id)` - remove from state + persist
  - Integrate with RecipeStorageService for persistence

- [x] 4. Build Recipe form component (TDD)
  - Write component tests first in `src/components/recipes/RecipeForm.test.tsx`
  - Test cases: render, create mode, edit mode, validation, form submission
  - Create `RecipeForm` component in `src/components/recipes/RecipeForm.tsx`
  - Use Radix UI components for form elements
  - Support both create and edit modes
  - Form fields: name, description, servings, totalTime, tags
  - Dynamic ingredient list with add/remove buttons:
    - Use autocomplete/combobox to select from IngredientItem library
    - Display ingredient name with quantity input
    - Allow adding new ingredients on-the-fly (creates temporary ingredient)
  - Dynamic instruction steps with add/remove/reorder
  - Form validation using Zod schema
  - Apply Tailwind CSS styling with responsive design
  - Routing: `/recipes/new` for create, `/recipes/:id/edit` for edit
  - Note: Full ingredient autocomplete will be implemented after ingredient management is built

- [x] 5. Build Recipe list component (TDD)
  - Write component tests first in `src/components/recipes/RecipeList.test.tsx`
  - Test cases: render recipes, empty state, card interactions, edit/delete buttons
  - Create `RecipeList` component in `src/components/recipes/RecipeList.tsx`
  - Use responsive card grid layout:
    - 3 columns on desktop (lg: 1024px+)
    - 1 column on mobile (< 1024px)
  - Each recipe card displays:
    - Recipe name (prominent heading)
    - Brief description (truncated to 2-3 lines)
    - Tags as colored badge pills
    - Meta info: servings (👤 icon) and total time (⏱ icon)
    - Action buttons: View, Edit, Delete (accessible icon buttons)
  - Card interactions:
    - Hover effects: subtle elevation/shadow
    - Click card to view recipe details
    - Touch-friendly tap targets for mobile
  - Empty state: centered message with "Create Your First Recipe" CTA button
  - Apply Tailwind CSS with responsive grid classes
  - Future-ready: include placeholder area for recipe images
  - Routing: `/recipes` for list view, navigate to create/edit/detail routes

- [ ] 6. Build Recipe detail view (TDD)
  - Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - Test cases: render recipe details, edit action, delete action
  - Create `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`
  - Display full recipe information
  - Show ingredients list, instructions, cooking times
  - Include edit and delete action buttons
  - Apply Tailwind CSS styling with responsive design
  - Routing: `/recipes/:id` for detail view

- [ ] 7. Implement delete confirmation (TDD)
  - Write component tests first in `src/components/common/ConfirmDialog.test.tsx`
  - Test cases: render dialog, cancel action, confirm action
  - Create `ConfirmDialog` component in `src/components/common/ConfirmDialog.tsx`
  - Use Radix UI Dialog component
  - Show confirmation message before deleting recipe
  - Handle cancel and confirm actions
  - Apply Tailwind CSS styling
- [ ] 8. Build Ingredient Library Management (TDD)
  - Write unit tests for IngredientStorage service
  - Create `IngredientStorageService` similar to RecipeStorageService
  - Write tests for IngredientContext
  - Create `IngredientContext` for managing ingredient library
  - Write component tests for IngredientList and IngredientForm
  - Build IngredientList component (table/list view with edit/delete)
  - Build IngredientForm component (add/edit ingredient with name, category, unit)
  - Create settings page at `/settings/ingredients`
  - Apply Tailwind CSS styling with responsive design

- [ ] 9. Update Recipe form with ingredient autocomplete
  - Install Radix UI Combobox/Select component (if not already installed)
  - Update RecipeForm to use autocomplete for ingredient selection
  - Connect to IngredientContext to fetch available ingredients
  - Update tests to handle autocomplete interactions
  - Allow creating new ingredients inline (optional)
  - Display ingredient name instead of ID in the form