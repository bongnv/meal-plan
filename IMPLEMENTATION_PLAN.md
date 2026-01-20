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
  - Use Mantine UI components for form elements
  - Support both create and edit modes
  - Form fields: name, description, servings, totalTime, tags
  - Dynamic ingredient list with add/remove buttons:
    - Use simple text input for ingredient name (temporary until ingredient management is built)
    - Quantity input with decimal support
    - Add/remove ingredient buttons
  - Dynamic instruction steps with add/remove buttons
  - Form validation using Zod schema with zodResolver
  - Apply Mantine styling with responsive design
  - Routing: `/recipes/new` for create, `/recipes/:id/edit` for edit
  - Note: Full ingredient autocomplete will be implemented after ingredient management is built

- [ ] 5. Build Recipe list component (TDD)
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

- [ ] 6. Implement Navigation Bar (TDD)
  - Write tests for NavigationBar component
  - Create persistent navigation bar component with links:
    - Home/Dashboard (/)
    - Recipes (/recipes)
    - Ingredients (/settings/ingredients)
  - Add active route highlighting (different style for current page)
  - Make responsive:
    - Desktop: Horizontal navigation with full labels
    - Mobile: Bottom navigation bar or hamburger menu
  - Integrate into App.tsx layout
  - Style with Mantine CSS
  - Test navigation between all routes
  - Ensure accessibility (keyboard navigation, ARIA labels)

- [ ] 7. Build Recipe detail view (TDD)
  - Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - Test cases: render recipe details, edit action, delete action
  - Create `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`
  - Display full recipe information
  - Show ingredients list, instructions, cooking times
  - Include edit and delete action buttons
  - Apply Tailwind CSS styling with responsive design
  - Routing: `/recipes/:id` for detail view

- [ ] 8. Implement delete confirmation (TDD)
  - Write component tests first in `src/components/common/ConfirmDialog.test.tsx`
  - Test cases: render dialog, cancel action, confirm action
  - Create `ConfirmDialog` component in `src/components/common/ConfirmDialog.tsx`
  - Use Mantine Modal component
  - Show confirmation message before deleting recipe
  - Handle cancel and confirm actions
  - Apply Mantine styling
  
- [ ] 9. Complete Mantine Migration
  - [ ] Migrate RecipeList, IngredientList, HomePage, RecipesPage to use Mantine components
  - [ ] Migrate IngredientForm to use @mantine/form hook and components
  - [ ] Replace NavigationBar with Mantine NavLink components
  - [ ] Update component tests to use MantineProvider wrapper
  - [ ] Quality checks (lint passing, build successful)
  
- [x] 10. Build Ingredient Library Management (TDD)
  - Write unit tests for IngredientStorage service
  - Create `IngredientStorageService` similar to RecipeStorageService
  - Write tests for IngredientContext
  - Create `IngredientContext` for managing ingredient library
  - Write component tests for IngredientList and IngredientForm
  - Build IngredientList component with responsive card layout:
    - Desktop (≥1024px): Table layout with columns [Name | Category | Unit | Actions]
    - Mobile (<1024px): Stacked card view showing all fields vertically
    - Table features: hover effects, sortable columns (optional), edit/delete action buttons
    - Empty state: message with "Add Your First Ingredient" CTA button
    - Include search/filter bar above table for large ingredient libraries
    - Touch-friendly tap targets for mobile cards
  - Build IngredientForm component (add/edit ingredient with name, category, unit)
  - Create settings page at `/settings/ingredients`
  - Apply Mantine styling with responsive design

- [x] 11. Integrate Recipe form with Ingredient Library (TDD)
  - Update RecipeForm tests to handle ingredient autocomplete
  - Replace text input with Mantine Select/Autocomplete for ingredient selection
  - Connect RecipeForm to IngredientContext to fetch available ingredients
  - Display ingredient name with autocomplete dropdown
  - Support creating new ingredients inline from the form
  - Update form validation to ensure ingredient selection
  - Show ingredient unit alongside the autocomplete
  - Update RecipeForm to map ingredient IDs to names when displaying
  - Test ingredient selection, search, and inline creation flows