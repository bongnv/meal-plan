# Meal Plan - Implementation Plan

## I1. Create, Edit, and Delete Recipes (R1.1)

### Implementation Steps

- [x] I1.I1.1. Define Recipe data types
  - Create TypeScript interfaces for Recipe structure in `src/types/recipe.ts`
  - Include fields: id, name, description, ingredients, instructions, servings, prepTime, cookTime, tags, imageUrl (optional)
  - Define Ingredient interface with name, quantity, unit fields

- [x] I1.2. Create LocalStorage service for recipes (TDD)
  - Write unit tests first in `src/utils/storage/recipeStorage.test.ts`
  - Test cases: loadRecipes, saveRecipes, generateId, error handling
  - Implement `RecipeStorageService` in `src/utils/storage/recipeStorage.ts`
  - Methods: `loadRecipes()` - load all recipes from localStorage, `saveRecipes(recipes)` - save entire collection
  - Note: React Context will manage in-memory CRUD operations for efficiency

- [x] I1.I1.3. Set up Recipe Context (TDD)
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

- [x] I1.I1.4. Build Recipe form component (TDD)
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

- [x] I1.I1.5. Build Recipe list component (TDD)
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
  - Apply Mantine CSS with responsive grid classes
  - Future-ready: include placeholder area for recipe images
  - Routing: `/recipes` for list view, navigate to create/edit/detail routes

- [x] I1.I1.6. Implement Navigation Bar (TDD)
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

- [x] I1.I1.7. Build Recipe detail view (TDD)
  - Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - Test cases: render recipe details, edit action, delete action
  - Create `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`
  - Create `RecipeDetailPage` in `src/pages/recipes/RecipeDetailPage.tsx`
  - Display full recipe information
  - Show ingredients list, instructions, cooking times
  - Include edit and delete action buttons
  - Apply Mantine CSS styling with responsive design
  - Routing: `/recipes/:id` for detail view (added to App.tsx)
  - Card click navigation: clicking recipe card navigates to detail view

- [x] I1.8. Implement delete confirmation for recipes and ingredients
  - Use Mantine Modal component for confirmation dialogs
  - Show confirmation message before deleting recipe
  - Show confirmation message before deleting ingredient
  - Handle cancel and confirm actions
  - Apply Mantine styling
  
- [x] I1.9. Build Ingredient Library Management (TDD) (R4.1)
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

- [x] I1.10. Integrate Recipe form with Ingredient Library (TDD)
  - Update RecipeForm tests to handle ingredient autocomplete
  - Replace text input with Mantine Select/Autocomplete for ingredient selection
  - Connect RecipeForm to IngredientContext to fetch available ingredients
  - Display ingredient name with autocomplete dropdown
  - Support creating new ingredients inline from the form
  - Update form validation to ensure ingredient selection
  - Show ingredient unit alongside the autocomplete
  - Update RecipeForm to map ingredient IDs to names when displaying
  - Test ingredient selection, search, and inline creation flows

- [x] I1.11. Implement Recipe search and filter (TDD) (R1.3)
  - Write tests for search and filter functionality
  - Add search input to RecipesPage for filtering by recipe name
  - Implement tag-based filtering with Mantine MultiSelect or Chip components
  - Add ingredient-based search/filter capability
  - Add time-based filtering with range selector or predefined options (e.g., "< 30 min", "30-60 min", "> 60 min")
  - Create useRecipeFilter hook or utility function for filtering logic
  - Support multiple simultaneous filters (name + tags + ingredients + totalTime)
  - Show filter results count and "Clear filters" option
  - Persist filter state in URL query parameters (optional)
  - Empty state when no recipes match filters
  - Test all filter combinations and edge cases
## I2. Meal Planning (R2)

### Implementation Steps

- [x] I2.1. Define Meal Plan data types
  - Create TypeScript interfaces for Meal Plan structure in `src/types/mealPlan.ts`
  - Include fields: id, date, mealType ('lunch' | 'dinner'), type (MealPlanType), note (optional)
  - MealPlanType: 'recipe' | 'dining-out' | 'takeout' | 'leftovers' | 'skipping' | 'other'
  - For recipe-based meals: recipeId (recipe name fetched from RecipeContext), servings
  - For custom meals (dining-out, takeout, leftovers, skipping, other): 
    - customText (optional free-form string for additional details)
    - Icon mapping: dining-out (🍽️), takeout (🥡), leftovers (♻️), skipping (⏭️), other (📝)

- [ ] I2.2. Create LocalStorage service for meal plans (TDD)
  - Write unit tests first in `src/utils/storage/mealPlanStorage.test.ts`
  - Add Zod schemas for validation in `src/types/mealPlan.ts`
  - Test cases: loadMealPlans, saveMealPlans, generateId, date-based queries, error handling
  - Implement `MealPlanStorageService` in `src/utils/storage/mealPlanStorage.ts`
  - Methods: `loadMealPlans()` - load all meal plans, `saveMealPlans(mealPlans)` - save entire collection
  - Helper methods: `getMealPlansByDateRange(startDate, endDate)`, `getMealPlansByDate(date)`
  - Note: React Context will manage in-memory CRUD operations for efficiency

- [ ] I2.3. Set up Meal Plan Context (TDD)
  - Write unit tests first in `src/contexts/MealPlanContext.test.tsx`
  - Test cases: loadMealPlans on mount, getMealPlansByDate, addMealPlan, updateMealPlan, deleteMealPlan, copyMealPlan
  - Create `MealPlanContext` in `src/contexts/MealPlanContext.tsx`
  - Load meal plans once on mount using MealPlanStorageService
  - Maintain in-memory state: mealPlans array, loading state, error state
  - Actions operate on in-memory state and persist via MealPlanStorageService:
    - `getMealPlansByDateRange(startDate, endDate)` - filter in memory
    - `addMealPlan(mealPlan)` - add to state + persist
    - `updateMealPlan(mealPlan)` - update state + persist (for adjusting servings, etc.)
    - `deleteMealPlan(id)` - remove from state + persist
    - `copyMealPlan(id, targetDate)` - duplicate to another date + persist
  - Integrate with MealPlanStorageService for persistence

- [ ] I2.4. Build Calendar view component (TDD)
  - Write component tests first in `src/components/mealPlans/CalendarView.test.tsx`
  - Test cases: render calendar, date navigation, view modes (week/month/quarter/year), date selection
  - Create `CalendarView` component in `src/components/mealPlans/CalendarView.tsx`
  - Use Mantine DatePicker or custom calendar grid for date selection
  - Support flexible date range display modes:
    - Week view (7 days)
    - Month view (28-31 days)
    - Quarter view (3 months)
    - Year view (12 months, simplified)
  - Navigation controls: Previous/Next period, Today button, date range selector
  - Each calendar day cell shows:
    - Date number
    - Meal slots for lunch and dinner
    - For recipe meals: recipe name (truncated)
    - For custom meals: meal type icon + custom text (truncated)
    - Empty slots show "+ Add Meal" affordance
  - Highlight today's date
  - Apply Mantine CSS styling with responsive grid layout
  - Mobile: vertical scrolling list view instead of grid for better usability

- [ ] I2.5. Build Meal Plan form/editor component (TDD)
  - Write component tests first in `src/components/mealPlans/MealPlanForm.test.tsx`
  - Test cases: render, meal type toggle, recipe selection, custom entry, servings adjustment, form submission
  - Create `MealPlanForm` component in `src/components/mealPlans/MealPlanForm.tsx`
  - Meal type toggle: Recipe-based vs Custom entry
  - Recipe-based meal:
    - Recipe selector with autocomplete (search recipes by name)
    - Display recipe details (ingredients, cook time)
    - Servings adjustment input (default to recipe's servings)
  - Custom entry:
    - Category selector with predefined options: Dining Out, Takeout, Leftovers, Skipping Meal, Other
    - Show corresponding icon for each option
    - Optional text input for additional details (e.g., restaurant name, notes)
    - Text input placeholder adapts to selected category
  - Meal slot selector: Lunch or Dinner
  - Date selector (defaults to selected date from calendar)
  - Form validation using Zod schema with zodResolver
  - Apply Mantine styling with modal or drawer presentation
  - Support both add and edit modes

- [ ] I2.6. Implement drag-and-drop for meal planning (TDD)
  - Write interaction tests for drag-and-drop
  - Use `@dnd-kit/core` or `react-dnd` library for drag-and-drop
  - Make recipes draggable from recipe list or sidebar
  - Make calendar meal slots droppable targets
  - Visual feedback during drag (ghost element, drop zone highlighting)
  - Drop action creates new meal plan entry with recipe
  - Support dragging existing meals to different dates/slots (move operation)
  - Keyboard alternative for accessibility
  - Touch gesture support for mobile devices
  - Test drag from recipe list to calendar, drag between calendar slots

- [ ] I2.7. Build Meal Plan list/timeline view (TDD)
  - Write component tests first in `src/components/mealPlans/MealPlanList.test.tsx`
  - Test cases: render meal plans, grouped by date, edit/delete actions, copy action
  - Create `MealPlanList` component in `src/components/mealPlans/MealPlanList.tsx`
  - Alternative view to calendar: linear timeline of planned meals
  - Group meals by date with date headers
  - Each meal entry shows:
    - Meal type icon (🥗 lunch, 🍽️ dinner)
    - Recipe name (with link to recipe detail) or custom meal type icon + text
    - Servings count (for recipe meals)
    - Action buttons: Edit, Delete, Copy to another date
  - Filter/sort options: Show future meals only, show all, sort by date
  - Apply Mantine styling with responsive card/list layout
  - Empty state: "No meals planned yet" with CTA to add first meal

- [ ] I2.8. Create Meal Planning page (TDD)
  - Write page tests in `src/pages/mealPlans/MealPlansPage.test.tsx`
  - Create `MealPlansPage` in `src/pages/mealPlans/MealPlansPage.tsx`
  - Page layout with view switcher: Calendar view or List view (tabs/toggle)
  - Integrate CalendarView and MealPlanList components
  - Add floating action button or header button to create new meal plan
  - Connect to MealPlanContext for data
  - Apply Mantine layout and responsive design
  - Routing: `/meal-plans` for main page
  - Add navigation link to Meal Plans in main navigation

- [ ] I2.9. Implement meal plan copy functionality (TDD)
  - Add "Copy to..." action to meal entries
  - Modal or popover with date picker to select target date
  - Option to copy single meal or entire day's meals
  - Prevent overwriting existing meals (show warning/confirmation)
  - Update MealPlanContext with copy logic
  - Test copying to same date, future date, past date, with conflicts

- [ ] I2.10. Add servings adjustment for planned meals (TDD)
  - Edit planned meal to adjust servings different from recipe default
  - Update meal plan entry with custom servings value
  - Display adjusted servings in calendar and list views
  - Ensure grocery list generation (future) uses adjusted servings
  - Test servings increase, decrease, fractional values