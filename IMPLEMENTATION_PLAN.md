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
  - Dynamic ingredient list with add/remove buttons
  - Dynamic instruction steps with add/remove/reorder
  - Form validation using Zod schema
  - Apply Tailwind CSS styling with responsive design

- [ ] 5. Build Recipe list component (TDD)
  - Write component tests first in `src/components/recipes/RecipeList.test.tsx`
  - Test cases: render recipes, empty state, edit button, delete button
  - Create `RecipeList` component in `src/components/recipes/RecipeList.tsx`
  - Display recipes in a grid or list view
  - Show recipe card with name, description, tags, and action buttons
  - Include edit and delete buttons for each recipe
  - Handle empty state when no recipes exist
  - Apply Tailwind CSS styling with responsive design

- [ ] 6. Build Recipe detail view (TDD)
  - Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - Test cases: render recipe details, edit action, delete action
  - Create `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`
  - Display full recipe information
  - Show ingredients list, instructions, cooking times
  - Include edit and delete action buttons
  - Apply Tailwind CSS styling with responsive design

- [ ] 7. Implement delete confirmation (TDD)
  - Write component tests first in `src/components/common/ConfirmDialog.test.tsx`
  - Test cases: render dialog, cancel action, confirm action
  - Create `ConfirmDialog` component in `src/components/common/ConfirmDialog.tsx`
  - Use Radix UI Dialog component
  - Show confirmation message before deleting recipe
  - Handle cancel and confirm actions
  - Apply Tailwind CSS styling

- [ ] 8. Add routing and integration tests
  - Configure routes for recipe list, create, edit, and detail views
  - Use React Router or similar routing solution
  - Handle navigation between views
  - Write integration tests for full recipe CRUD flow

