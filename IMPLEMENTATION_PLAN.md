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

- [x] I1.12. Implement AI-Assisted Recipe Import (TDD) (R1.5)
  - [x] I1.12.1. Add AI Import entry point to Recipes page (TDD)
    - Write page tests in `src/pages/recipes/RecipesPage.test.tsx` for import button
    - Test cases: import button renders, clicking opens modal
    - Add "Import with AI" button to RecipesPage header (next to "New Recipe" button)
    - Add state for modal open/close
    - Create placeholder RecipeImportModal component that just renders "Coming soon"
    - Wire up button to open modal
    - Test import button visibility and modal open/close
    - Add keyboard shortcut (optional): Ctrl/Cmd + I for import
  
  - [x] I1.12.2. Build AI Recipe Import modal UI with stepper (TDD)
    - Write component tests in `src/components/recipes/RecipeImportModal.test.tsx`
    - Test cases: render modal, stepper navigation, step content rendering
    - Create `RecipeImportModal` component in `src/components/recipes/RecipeImportModal.tsx`
    - Implement 3-step Mantine Stepper:
      - Step 1: "Generate Prompt" - placeholder text and copy button (non-functional yet)
      - Step 2: "Paste Response" - textarea for JSON input with parse button (non-functional yet)
      - Step 3: "Review & Import" - placeholder for recipe preview and import button
    - Add navigation: Next/Back buttons, Close button
    - Add state management for current step and form data
    - Apply Mantine styling with responsive design
    - Test stepper navigation, modal close, step transitions
  
  - [x] I1.12.3. Implement prompt generator and wire to Step 1 (TDD)
    - Write unit tests in `src/utils/aiPromptGenerator.test.ts`
    - Test cases: generate prompt with ingredient library, JSON schema format, prompt structure
    - Create `generateRecipeImportPrompt()` function in `src/utils/aiPromptGenerator.ts`
    - Function accepts ingredient library from IngredientContext
    - Generate structured prompt that includes:
      - Instructions for AI to parse recipe from URL or text
      - Current ingredient library with full details: IDs, names, categories, and units
        - Minimal token overhead with significant matching improvement
      - JSON schema definition matching Recipe type
      - Example output format
      - Instructions to map ingredients to existing IDs or suggest new ingredients with category
    - Return copyable prompt string
    - Wire prompt generator to RecipeImportModal Step 1
    - Connect to IngredientContext to get current ingredients
    - Display generated prompt in read-only textarea
    - Implement copy to clipboard functionality
    - Add instructions: "Copy this prompt and paste it with a recipe URL or recipe text into your AI tool (ChatGPT, Claude, etc.)"
    - Test prompt generation and clipboard copy
  
  - [x] I1.12.4. Implement validator and complete import flow (TDD)
    - Write unit tests in `src/utils/recipeImportValidator.test.ts`
    - Test cases: validate JSON structure, validate ingredient references, error messages
    - Create `validateRecipeImport()` function in `src/utils/recipeImportValidator.ts`
    - Validate imported JSON matches Recipe schema using Zod
    - Check ingredient IDs exist in ingredient library
    - Validate required fields are present
    - Return validation result with errors or validated recipe object
    - Wire validator to RecipeImportModal Step 2:
      - Parse button validates pasted JSON
      - Show validation errors if any
      - On success, advance to Step 3 with parsed data
    - Implement Step 3 review UI:
      - Display parsed recipe details (name, ingredients, instructions)
      - Show ingredient mappings (existing IDs vs. new ingredients needing to be added)
      - Highlight new ingredients that need library addition
    - Connect to RecipeContext for import:
      - On confirm, add recipe to context
      - Handle new ingredients: connect to IngredientContext and auto-create using addIngredient()
      - Navigate to recipe detail page on success
    - Test complete flow: paste JSON → validate → review → import → navigate
    - Test error handling for invalid JSON and missing ingredients

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

- [x] I2.2. Create LocalStorage service for meal plans (TDD)
  - Write unit tests first in `src/utils/storage/mealPlanStorage.test.ts`
  - Add Zod schemas for validation in `src/types/mealPlan.ts`
  - Test cases: loadMealPlans, saveMealPlans, generateId, error handling
  - Implement `MealPlanStorageService` in `src/utils/storage/mealPlanStorage.ts`
  - Methods: `loadMealPlans()` - load all meal plans, `saveMealPlans(mealPlans)` - save entire collection
  - Note: React Context will manage in-memory CRUD operations for efficiency

- [x] I2.3. Set up Meal Plan Context (TDD)
  - Write unit tests first in `src/contexts/MealPlanContext.test.tsx`
  - Test cases: loadMealPlans on mount, addMealPlan, updateMealPlan, deleteMealPlan
  - Create `MealPlanContext` in `src/contexts/MealPlanContext.tsx`
  - Load meal plans once on mount using MealPlanStorageService
  - Maintain in-memory state: mealPlans array, loading state, error state
  - Actions operate on in-memory state and persist via MealPlanStorageService:
    - `addMealPlan(mealPlan)` - add to state + persist
    - `updateMealPlan(mealPlan)` - update state + persist (for adjusting servings, etc.)
    - `deleteMealPlan(id)` - remove from state + persist
  - Integrate with MealPlanStorageService for persistence

- [x] I2.4. Add routing for Meal Planning pages
  - Add "Meal Plans" navigation item to App.tsx navbar with Calendar icon
  - Create placeholder pages for meal planning views:
    - `src/pages/mealPlans/MealPlansPage.tsx` - Main meal planning page at `/meal-plans`
  - Add routes to App.tsx:
    - `/meal-plans` - Main meal planning page (calendar/list view)
  - Update navigation to include Meal Plans link
  - Test navigation between meal plans and other pages

- [x] I2.5. Build Calendar view component (TDD)
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
  - **Integrate CalendarView into MealPlansPage**:
    - Update `src/pages/mealPlans/MealPlansPage.tsx` to render CalendarView
    - Connect to MealPlanContext for data
    - Show calendar view as default view

- [x] I2.6. Build Meal Plan form/editor component (TDD)
  - Write component tests first in `src/components/mealPlans/MealPlanForm.test.tsx`
  - Test cases: render, meal type toggle, recipe selection, custom entry, servings adjustment, form submission
  - Create `MealPlanForm` component in `src/components/mealPlans/MealPlanForm.tsx`
  - Meal type toggle: Recipe-based vs Custom entry
  - Recipe-based meal:
    - Recipe selector with autocomplete (search recipes by name)
    - Display recipe details (ingredients, cook time)
    - Servings adjustment input (default to recipe's servings)
  - Custom entry:
    - Autocomplete input with predefined options: Dining Out, Takeout, Leftovers, Skipping Meal
    - Show corresponding icon for each predefined option
    - If user types custom text not in predefined list, automatically set type to "other" with their text as customText
    - Support free-text entry (e.g., "Pizza Night", "Birthday Dinner") which falls into "other" category
    - Optional note field for all meal types (recipe and custom)
  - Meal slot selector: Lunch or Dinner
  - Date selector (defaults to selected date from calendar)
  - Form validation using Zod schema with zodResolver
  - Apply Mantine styling with modal or drawer presentation
  - Support both add and edit modes
  - **Integrate MealPlanForm into MealPlansPage**:
    - Update `src/pages/mealPlans/MealPlansPage.tsx` to manage form modal state
    - Connect to MealPlanContext for add/update operations
    - Open form on calendar cell click with date and meal slot pre-selected

- [x] I2.7. Implement drag-and-drop for meal planning with searchable recipe list (TDD)
  - Write interaction tests for drag-and-drop
  - Use `@dnd-kit/core` or `react-dnd` library for drag-and-drop
  - **Build recipe sidebar/list with search and filtering**:
    - Create draggable recipe list component in meal planning view
    - Integrate `useRecipeFilter` hook for filtering recipes
    - Add search input for filtering by recipe name
    - Add tag filter using MultiSelect component
    - Add ingredient filter using MultiSelect component
    - Add time range filter with SegmentedControl
    - Show filtered recipe count
    - Display recipes as draggable cards with recipe name, tags, and time
    - Collapsible sidebar on desktop, bottom sheet on mobile
  - Make recipes draggable from the filtered recipe list
  - Make calendar meal slots droppable targets
  - Visual feedback during drag (ghost element, drop zone highlighting)
  - Drop action creates new meal plan entry with recipe
  - Support dragging existing meals to different dates/slots (move operation)
  - Keyboard alternative for accessibility
  - Touch gesture support for mobile devices
  - Test drag from recipe list to calendar, drag between calendar slots
  - Test search/filter functionality works while dragging

- [ ] I2.7.1. Implement drag-to-remove meal plans (TDD)
  - Write interaction tests for dragging meals back to recipe list
  - Make recipe sidebar a droppable zone for meal plan removal
  - Detect when a meal plan (recipe-based) is dragged from calendar
  - Visual feedback when dragging meal over recipe list (removal indicator)
  - Drop action on recipe list removes meal plan from that date
  - Confirmation prompt (optional) before removing meal
  - Test dragging recipe meal to list, dragging custom meal (should not be removable via this method)
  - Test accessibility with keyboard alternative for removal

- [x] I2.8. Build Meal Plan list/timeline view (TDD)
  - Write component tests first in `src/components/mealPlans/MealPlanList.test.tsx`
  - Test cases: render meal plans, grouped by date, edit/delete actions
  - Create `MealPlanList` component in `src/components/mealPlans/MealPlanList.tsx`
  - Alternative view to calendar: linear timeline of planned meals
  - Group meals by date with date headers
  - Each meal entry shows:
    - Meal type icon (🥗 lunch, 🍽️ dinner)
    - Recipe name (with link to recipe detail) or custom meal type icon + text
    - Servings count (for recipe meals)
    - Action buttons: Edit, Delete
  - Filter/sort options: Show future meals only, show all, sort by date
  - Apply Mantine styling with responsive card/list layout
  - Empty state: "No meals planned yet" with CTA to add first meal
  - **Integrate MealPlanList into MealPlansPage**:
    - Update `src/pages/mealPlans/MealPlansPage.tsx` to conditionally render list view
    - Connect to MealPlanContext for data

- [x] I2.9. Add view switcher and finalize Meal Planning page (TDD)
  - Write page tests in `src/pages/mealPlans/MealPlansPage.test.tsx`
  - Test cases: view switching, calendar/list rendering, add meal button
  - Add view switcher to CalendarView (integrated):
    - Use Mantine SegmentedControl for Month/List toggle
    - Place in CalendarView header next to navigation controls
    - Persist view preference in component state
  - List view improvements:
    - Integrated into CalendarView with dynamic `maxHeight` scrolling
    - Each card shows: meal type icon, type badge, meal name, servings (for recipes), edit/delete actions
    - Fixed header keeps view switcher visible while scrolling content
  - Apply Mantine layout and responsive design polish
  - Test switching between views, navigation, and creating meals
  - Removed MealPlanList component (merged functionality into CalendarView list view)

- [x] I2.9.1. Make Today button work for list view (TDD)
  - Today button scrolls list view to show today's meals
  - Highlight today's date header in list view
  - Smooth scroll to today's section when button clicked
  - Work seamlessly in both month and list views
  - Test Today button in list view
  - Test Today button when today has no meals
  - Implementation: useEffect watches currentDate changes and scrolls to today in list view

- [x] I2.9.2. Add recipe detail view from meal plan card (TDD)
  - Click recipe name in meal plan cards to view recipe details
  - Navigate to recipe detail page (`/recipes/:id`)
  - Test clicking recipe names in both month and list views
  - Ensure recipe links work in all contexts
  - Implementation: Recipe names are Anchor components with onClick navigation

- [x] I2.9.3. Add edit action to month view meal cards (TDD)
  - Add edit button/icon to each meal in month view calendar cells
  - Click action opens MealPlanForm in edit mode
  - Show edit icon alongside meal in calendar cells (delete removed to save space)
  - Test edit action opens form with pre-filled data
  - Implementation: Small edit IconButton shown on hover/always visible in month view cells

- [x] I2.9.4. Add delete button to MealPlanForm (TDD)
  - Add delete button to meal plan edit form (only shown when editing existing meal)
  - Button should be positioned in form footer (e.g., left side, with Cancel/Save on right)
  - Click shows confirmation modal before deleting
  - After deletion, close form and refresh calendar view
  - Write tests for delete button visibility (edit mode only, not create mode)
  - Test delete confirmation flow
  - Test form closes after successful deletion

- [x] I2.9.5. Create Meal Plan Detail View page (TDD)
  - Create new page component: `src/pages/mealPlans/MealPlanDetailPage.tsx`
  - Route: `/meal-plans/:id`
  - Update CalendarView to navigate to meal plan detail when clicking on meal (not edit button)
  - Display meal plan information:
    - Date and meal type (Lunch/Dinner)
    - Notes field from meal plan
    - Recipe details (if recipe-based meal):
      - Recipe name, description
      - Servings from meal plan (not default recipe servings)
      - Ingredients scaled to meal plan servings
      - Instructions
      - Tags
    - Custom meal text (if non-recipe meal)
  - Show edit/delete action buttons
  - Back button to return to meal plans page
  - Similar layout to RecipeDetailPage but with meal plan context
  - Write tests for MealPlanDetailPage component
  - Test navigation from CalendarView to detail page
  - Test servings display from meal plan vs recipe
  - Test edit/delete actions from detail page

- [x] I2.10. Implement meal plan copy functionality with recurring patterns (TDD)
  - Add "Copy to..." action to meal entries (calendar and list views)
  - Modal/form with copy options:
    - Target date selection
    - Frequency options:
      - One-time (single date)
      - Weekly (every X weeks, e.g., every 1 week, every 2 weeks)
      - Specific weekday (every Monday, Tuesday, etc.)
      - Custom interval (every X days)
    - End condition (for recurring):
      - Until specific date
      - After X occurrences
    - Preview: Show list of all affected dates before confirming
  - Conflict handling:
    - Detect conflicts (dates/slots that already have meals)
    - Options: Replace existing, Skip conflicting dates, or Cancel entire operation
    - Show conflict summary before confirming
  - Update MealPlanContext with copy logic:
    - `copyMealPlan(id, targetDates)` - copy to multiple dates
    - Handle batch creation with conflict resolution
  - Test cases:
    - One-time copy to single date
    - Weekly recurring (every week for 4 weeks)
    - Bi-weekly recurring (every 2 weeks)
    - Specific weekday pattern (every Tuesday)
    - Custom interval (every 3 days)
    - End by date vs end after N occurrences
    - Conflict detection and resolution
    - Copy to past date, future date, same date
    - Preview accuracy before execution

- [x] I2.11. Add servings adjustment for planned meals (TDD)
  - Edit planned meal to adjust servings different from recipe default
  - Update meal plan entry with custom servings value
  - Display adjusted servings in calendar and list views
  - Ensure grocery list generation (future) uses adjusted servings
  - Test servings increase, decrease, fractional values

## I3. Cloud Storage Sync (R4.2)

### Cloud-First Design Philosophy

**File-as-Dataset Model:**
- Each file = separate dataset (like opening different Google Docs)
- Switching files = switching entire datasets (no merging)
- Auto-sync keeps current file updated in real-time
- Works offline with last-synced data cached locally
- Users can maintain multiple datasets (work meals, home meals, backups)

**User Experience:**
- Welcome screen prompts connection to OneDrive on first visit
- Offline mode available but not encouraged (error-prone)
- No "Disconnect" button in UI - promotes cloud-first usage
- "Change File" allows switching between datasets or creating new ones
- No conflict resolution needed - file switching replaces local data

### Implementation Steps

- [x] I3.1. Define cloud storage abstraction layer (TDD)
  - Write interface tests in `src/utils/storage/cloudStorage.test.ts`
  - Test cases: interface contract, provider registration, provider switching
  - Create `ICloudStorageProvider` interface in `src/utils/storage/ICloudStorageProvider.ts`
  - Interface methods:
    - `isAuthenticated()` - synchronous check if provider has valid authentication
    - `getAccountInfo()` - synchronous get user account info (name, email) from provider state
    - `uploadFile(filename, data)` - upload gzip-compressed JSON data to cloud
    - `downloadFile(filename)` - download and decompress JSON data from cloud
    - `listFoldersAndFiles(folderPath?)` - list folders and files for browsing
  - Create `CloudStorageContext` for managing provider lifecycle:
    - Handles `connect(provider)` - initiate MSAL authentication flow
    - Handles `disconnect()` - clear authentication state
    - Exposes `currentProvider`, `isAuthenticated`, `getAccountInfo()`
  - Create `SyncContext` for managing sync operations and file selection:
    - Handles `connectProvider(provider, file)` - sets file and triggers initial sync
    - Handles `disconnectProvider()` - clears file selection and provider connection
    - Exposes `selectedFile`, `syncStatus`, `lastSyncTime`
  - Two-layer architecture:
    - CloudStorageContext = infrastructure layer (provider auth, file operations)
    - SyncContext = business logic layer (sync operations, file selection)
  - Design for future providers: Google Drive, Dropbox, etc.
  - Document provider implementation requirements
  - Note: Connect/disconnect methods handled by CloudStorageContext using MSAL. Providers query authentication state.

- [x] I3.2. Create OneDrive storage provider implementation (TDD)
  - Install MSAL.js library (`@azure/msal-browser`) and MS Graph Client (`@microsoft/microsoft-graph-client`)
  - Create Azure AD app registration for the application
  - Write unit tests for OneDrive provider in `src/utils/storage/providers/OneDriveProvider.test.ts`
  - Test cases: upload data, download data, check for updates, interface compliance, error handling
  - Implement `OneDriveProvider` in `src/utils/storage/providers/OneDriveProvider.ts`
  - Implement `ICloudStorageProvider` interface
  - Use Microsoft Graph Client library for OneDrive operations (better retry logic, auth handling, TypeScript support)
  - **Support variable filenames** (UI for file selection implemented in I3.4.1):
    - Accept filename as parameter in uploadFile/downloadFile methods
    - Store files in OneDrive app folder (special app-specific folder)
    - No hardcoded filename - provider is filename-agnostic
  - File structure: `[filename].json.gz` containing:
    - `recipes` - array of all recipes
    - `mealPlans` - array of all meal plans
    - `ingredients` - array of all ingredients
    - `lastModified` - timestamp for conflict detection
    - `version` - data schema version
  - Implement interface methods using MS Graph Client:
    - `uploadFile()` - gzip compress JSON before upload using CompressionStream API
    - `downloadFile()` - download and decompress gzipped JSON using DecompressionStream API
    - `listFiles()` - list available data files in app folder for file selection
  - Use browser's native CompressionStream/DecompressionStream API
  - Handle API errors, network failures, rate limiting (Graph Client handles retry automatically)
  - Support offline mode with queued operations
  - Register with CloudStorageFactory

- [x] I3.3. Create Sync Context for state management (TDD)
  - Write unit tests for SyncContext in `src/contexts/SyncContext.test.tsx`
  - Test cases: connect/disconnect provider, file selection, auto sync, offline retry
  - Create `SyncContext` in `src/contexts/SyncContext.tsx`
  - State management:
    - `selectedFile` - currently selected file info (FileInfo | null)
    - `syncStatus` - idle | syncing | success | error
    - `lastSyncTime` - timestamp of last successful sync
  - Actions:
    - `connectProvider(provider, fileInfo)` - connect to provider with file selection (replaces local data with file data)
    - `disconnectProvider()` - disconnect from provider and clear file selection
    - `syncNow()` - trigger manual sync (auto-save to current file)
    - `importFromRemote()` - import data from selected file (used internally by connectProvider)
    - `uploadToRemote()` - upload local data to selected file
  - Work with CloudStorageContext for provider authentication state
  - Use CloudStorageContext file operations (uploadFile, downloadFile)
  - Implement automatic background sync (triggers after local data changes when file is selected)
  - Handle offline detection: retry sync when back online
  - Persist `selectedFile` in localStorage to restore on page load
  - Removed: `reset()`, `resolveConflict()`, `conflicts` state - no longer needed with file-switching model

- [x] I3.4. Implement sync logic with record-level three-way merge (TDD)
  - Write unit tests for sync logic in `src/utils/sync/syncManager.test.ts`
  - Test cases: initial sync, remote-only changes (create/delete/update), local-only changes (create/delete/update), non-conflicting changes on both sides (different records), conflicting changes (same record updated on both sides), conflict resolution
  - Create `SyncManager` in `src/utils/sync/syncManager.ts`
  - Work with `ICloudStorageProvider` interface (no provider-specific code)
  - Store base version (full snapshot of last synced state) in localStorage as `syncBase`:
    - Structure: `{ recipes: Recipe[], mealPlans: MealPlan[], ingredients: Ingredient[], lastModified: timestamp }`
    - Updated after every successful sync
  - Sync algorithm (timestamp-based conflict detection with record-level auto-merge):
    1. Get base version from localStorage (`syncBase` with `base.lastModified`)
    2. Get local data from React context state (`local.lastModified` = timestamp from state) - this is our snapshot
    3. Download file from OneDrive, decompress and parse remote data (`remote.lastModified`)
    4. **Check timestamps to detect changes**:
       - Remote changed: `base.lastModified < remote.lastModified`
       - Local changed: `base.lastModified < local.lastModified`
    5. **Simple cases (no record comparison needed)**:
       - If only remote changed: Use remote data → update local and `syncBase`
       - If only local changed: Upload local data → update `syncBase`
       - If neither changed: No action needed
    6. **Conflict case (both changed)**: Do record-level comparison to auto-merge:
       - Compare base vs remote records (by ID):
         - **Remote Created**: Record exists in remote but not in base
         - **Remote Deleted**: Record exists in base but not in remote
         - **Remote Updated**: Record exists in both but different
       - Compare base vs local records (by ID):
         - **Local Created**: Record exists in local but not in base
         - **Local Deleted**: Record exists in base but not in local
         - **Local Updated**: Record exists in both but different
       - **Auto-merge non-conflicting changes**:
         - Remote created → Add to merged
         - Remote deleted → Remove from merged
         - Remote updated (not updated locally) → Use remote version
         - Local created → Add to merged
         - Local deleted → Remove from merged
         - Local updated (not updated remotely) → Use local version
       - **Detect conflicts** (require manual resolution):
         - Same record updated on both local and remote
         - Same record deleted on one side, updated on other
    7. If conflicts detected:
       - Store partial merged data and conflicts in context state
       - Update syncStatus to 'error' and set conflicts array for UI display
       - Show ConflictResolutionModal (future enhancement)
       - User selects "Keep Local" or "Keep Remote" for all conflicts
       - For now: Throw error with conflict details for UI to handle
    8. Before applying merge:
       - **Race condition check**: Read current `state.lastModified` from React context state
       - If `state.lastModified > local.lastModified`: User made changes during sync
         - Abort current sync operation
         - Retry sync after debounce period (30 seconds)
       - If `state.lastModified == local.lastModified`: Safe to apply merge
    9. After validation passes:
       - Set `merged.lastModified = now`
       - Apply merged data to local state (React contexts)
       - Persist merged data to localStorage
       - Compress and upload merged data to OneDrive
       - Update `syncBase` with merged data (including `lastModified`)
  - Offline handling:
    - Detect when offline (no network)
    - Retry sync automatically when back online
    - Local changes persist in LocalStorage until synced
  - Test all merge scenarios:
    - Creation only (local/remote/both)
    - Deletion only (local/remote/both)
    - Update only (local/remote/same record/different records)
    - Mixed operations (create + update + delete)
  - Verify works with any ICloudStorageProvider implementation
  - Note: When user switches files via "Change File", import new file data and set it as new base version

- [x] I3.4.1. Build file/folder selection UI with multi-user support (TDD)
  - Write component tests in `src/components/sync/FileSelectionModal.test.tsx`
  - Test cases: render modal, list folders/files, create new file, select file, validation, shared files
  - Create `FileSelectionModal` component in `src/components/sync/FileSelectionModal.tsx`
  - **Triggered when user clicks "Connect to OneDrive"**
  - **Goal**: Support both app folder (single-user) and regular folders (multi-user sharing)
  - Update `ICloudStorageProvider` interface:
    - Add `listFoldersAndFiles(folderPath?)` - unified method to list both folders and files
    - Returns: `{ folders: FolderInfo[], files: FileInfo[] }`
    - `FolderInfo`: `{ id, name, path, isShared }`
    - `FileInfo`: `{ id, name, path, isShared }`
    - If `folderPath` not provided, lists from root
    - Include both owned items and items shared with user
    - **Note**: This method requires authentication, so modal must authenticate first before listing
  - Update `OneDriveProvider` implementation:
    - Implement `listFoldersAndFiles()` using MS Graph API
    - Query: `GET /me/drive/root:{folderPath}:/children` (or `/me/drive/root/children` for root)
    - Filter and separate folders vs files (`.json.gz` files only)
    - Add sharing metadata: `isShared` (based on `item.shared` property)
    - Support navigation into subfolders
  - Modal UI structure:
    - **Header**: Breadcrumb navigation showing current path (e.g., "OneDrive > Documents > MealPlanner")
    - **Folder Browser Section**:
      - List of folders in current location
      - Each folder shows: name, shared badge if applicable
      - Click folder → navigate into it, updates breadcrumb
      - "Up" button to go to parent folder
    - **File List Section** (in current folder):
      - List of `.json.gz` files
      - Each file shows: filename, sharing badge (if isShared)
      - Radio button selection or clickable list items
      - "Select" button (enabled when file selected)
      - Empty state: "No files in this folder"
    - **Create Modal** (collapsed by default):
      - Text input for filename (auto-append `.json.gz` extension)
      - Default suggestion: `meal-plan-data.json.gz`
      - Validation: non-empty, no special characters except hyphen/underscore, unique in folder
      - "Create" button creates `FileInfo` object for new file (doesn't actually create file yet)
    - **Footer**:
      - "Cancel" button - closes modal without connecting
      - "Select File" or "Create File" button - enabled when file selected/created
  - Workflow:
    - User clicks "Connect to OneDrive" button
    - Modal opens and immediately authenticates (triggers provider auth flow)
    - After auth success, loads folder/file list starting at root
    - User browses folders to find existing file or creates new file
    - User clicks "Select File"/"Create File" button
    - Modal calls `connectProvider(provider, fileInfo)` with both parameters
    - `connectProvider` stores connection state, account info, and file info in one atomic operation
    - Persist `FileInfo` to localStorage
    - Close modal
    - Trigger initial sync
  - Apply Mantine Modal, TextInput, Accordion, Button, Breadcrumbs components
  - Handle loading states: authentication, fetching folder/file list
  - Handle API errors gracefully (show error message, allow retry)
  - Test folder navigation, file selection, create file scenarios
  - Test shared file detection and display
  - Test authentication within modal before listing

- [x] I3.5. Build cloud storage sync settings UI (TDD)
  - Write component tests in `src/components/settings/CloudSyncSettings.test.tsx`
  - Test cases: render, connect to provider, account info display, file info display, change file
  - Create `CloudSyncSettings` component in `src/components/settings/CloudSyncSettings.tsx`
  - Add to settings page (create new settings page or add to existing)
  - UI elements:
    - **When not connected:**
      - "Connect to OneDrive" button - opens FileSelectionModal
      - Brief description of cloud sync benefits
    - **When connected:**
      - **Connected Account Card:**
        - Account info (name, email from `cloudStorage.getAccountInfo()`)
        - Provider name badge
      - **Sync File Card:**
        - Current file name and folder path
        - Last sync time
        - "Change File" button - opens FileSelectionModal to switch files
        - Note: Auto-sync is enabled
    - **No disconnect button** - promotes cloud-first usage
    - **No reset button** - user can create new files via "Change File"
  - Apply Mantine styling with Card/Paper components
  - Disable controls when sync is in progress
  - Removed: Disconnect button, Reset button, Danger Zone section

- [x] I3.6. Build sync status indicator in header (TDD)
  - Write component tests in `src/components/header/SyncStatusIndicator.test.tsx`
  - Test cases: render states, click to sync, tooltip display, error states, offline detection
  - Create `SyncStatusIndicator` component in `src/components/header/SyncStatusIndicator.tsx`
  - Add to app header/navigation bar
  - Visual states:
    - Idle: cloud icon (normal color) with "Last synced X minutes ago" tooltip
    - Syncing: cloud icon with spinner/animation
    - Success: cloud icon with checkmark (brief display)
    - Error: cloud icon with error indicator (red)
    - Offline/Not connected: cloud icon with offline indicator
  - **Clickable sync indicator**:
    - Click icon to trigger manual sync
    - Disabled/not clickable during active sync (shows spinner)
    - Tooltip shows: "Click to sync now" when idle, "Syncing..." when in progress
  - Sync error messages display in toast notification
  - Apply Mantine styling with IconButton
  - Test all state transitions and user interactions

- [x] I3.7. Build welcome screen with OneDrive prompt (TDD)
  - Write component tests in `src/components/welcome/WelcomeScreen.test.tsx`
  - Test cases: render on first visit, connect action, skip to offline, localStorage check
  - Create `WelcomeScreen` component in `src/components/welcome/WelcomeScreen.tsx`
  - **Display when:**
    - First visit (no localStorage data)
    - Not connected to cloud storage
  - **UI elements:**
    - Welcome message and app intro
    - "Connect to OneDrive" primary button
    - Opens FileSelectionModal for authentication and file selection
    - "Skip - Work Offline" secondary link (small, less prominent)
    - Warning text about offline limitations (data not synced, risk of loss)
  - **Logic:**
    - Check localStorage for existing data on mount
    - If has data OR connected to cloud, skip welcome screen
    - If no data AND not connected, show welcome screen
    - After connection, hide welcome screen permanently
  - Apply Mantine styling with Center layout
  - Use Mantine Modal or full-page overlay
  - Test localStorage persistence after connection
  - **Implementation Notes:**
    - Component fully implemented with 17 tests all passing
    - Uses fixed full-screen overlay with z-index: 1000
    - Checks for recipes, mealPlans, or ingredients in localStorage
    - Stores `welcomeScreenDismissed` flag when user clicks skip
    - Integrates with CloudStorageContext for authentication
    - Opens FileSelectionModal after successful authentication
    - Auto-dismisses when user has data or connects to cloud
    - Added to App.tsx as top-level component (renders before AppShell)

- [x] I3.8. Update FileSelectionModal for "Change File" flow (TDD)
  - Update component tests in `src/components/sync/FileSelectionModal.test.tsx`
  - Test cases: show warning modal, cancel change, confirm and replace data
  - Update `FileSelectionModal` component behavior:
    - **When opened from "Change File" button:**
      - Show warning before opening file browser: "Changing files will replace your current local data with data from the selected file"
      - Options: "Cancel" (close modal) or "Continue" (proceed to file browser)
    - **After file selection:**
      - Download and import data from selected file
      - REPLACE all local data (no merging)
      - Close modal
    - **When opened from "Connect to OneDrive" button:**
      - No warning needed (first-time connection)
      - Proceed directly to file browser
  - Add `mode` prop to distinguish between "connect" and "changeFile" modes
  - Apply Mantine Modal for warning overlay
  - Test warning display and data replacement flow
  - **Implementation Note:** Warning and data replacement logic handled by CloudSyncSettings via resetLocalState(), not in FileSelectionModal component itself. FileSelectionModal remains a simple file browser/selector.

- [x] I3.9. Integrate automatic background sync (TDD)
  - Write integration tests for auto-sync behavior
  - Test cases: sync after recipe add/update/delete, sync after meal plan changes, debouncing
  - Integrate sync triggers into existing contexts:
    - RecipeContext: trigger sync after addRecipe, updateRecipe, deleteRecipe
    - MealPlanContext: trigger sync after addMealPlan, updateMealPlan, deleteMealPlan
    - IngredientContext: trigger sync after addIngredient, updateIngredient, deleteIngredient
  - Implement debouncing to avoid excessive syncs:
    - Wait 1 minute after last change before syncing
    - User makes multiple changes → sync once after idle period
  - Only sync when file is selected (cloudStorage.isAuthenticated && selectedFile !== null)
  - Handle sync failures gracefully with retry logic
  - Show toast notification on sync errors
  - **No session expiry dialog** - simpler error handling with toast notifications
  - **Implementation Notes:**
    - Auto-sync implemented in SyncContext using throttled approach (immediate sync on first change, max once per minute)
    - Monitors lastModified timestamps from all three contexts (recipes, mealPlans, ingredients)
    - Errors are caught and logged but don't interrupt local data operations
    - Toast notifications implemented using @mantine/notifications for sync errors
    - Notifications show at top-right with red color for errors, auto-close after 5 seconds
    - Tests for auto-sync behavior not yet written (test coverage gap)

- [x] I3.10. Add sync status indicator to header (TDD)
  - Write component tests in `src/components/header/SyncStatusIndicator.test.tsx`
  - Test cases: render states, click to sync, tooltip display, error states, offline detection
  - Create `SyncStatusIndicator` component in `src/components/header/SyncStatusIndicator.tsx`
  - Add to app header/navigation bar
  - Visual states:
    - Idle: cloud icon (normal color) with "Last synced X minutes ago" tooltip
    - Syncing: cloud icon with spinner/animation
    - Success: cloud icon with checkmark (brief display)
    - Error: cloud icon with error indicator (red)
    - Offline: cloud icon with offline indicator
    - Not connected: cloud-off icon or no indicator shown
  - **Clickable sync indicator**:
    - Click icon to trigger manual sync
    - Disabled/not clickable during active sync (shows spinner)
    - Tooltip shows: "Click to sync now" when idle, "Syncing..." when in progress
  - Sync error messages display in toast notification
  - Right-click or long-press opens sync settings (optional)
  - Apply Mantine styling with ActionIcon
  - Test all state transitions and user interactions
  - **Implementation Notes:**
    - Component fully implemented with all required states (idle, syncing, success, error, offline, not connected)
    - Uses Mantine ActionIcon with Tooltip for user feedback
    - Positioned in app header on the right side (visible on all pages)
    - Format relative time helper function (just now, X minutes/hours/days ago)
    - All 23 tests passing with complete coverage of states, interactions, and edge cases
    - Error notifications handled by SyncContext via @mantine/notifications
    - No right-click functionality implemented (optional feature not added)
## I4. State Management Improvements

### Implementation Steps

- [ ] I4.1. Migrate to Zustand for state management
  - **Goal**: Replace React Context API with Zustand for better state management
  - **Benefits**:
    - **No race conditions**: `get()` returns latest state (not snapshot like useState)
    - **Simpler API**: No Context Provider boilerplate, direct imports
    - **Better performance**: Selective re-renders with automatic subscription management
    - **Built-in devtools**: Redux DevTools integration for debugging
  - **Migration Strategy**:
    - Migrate one context at a time (IngredientContext → RecipeContext → MealPlanContext)
    - Keep current API surface compatible (same function names/signatures)
    - Replace Context Provider pattern with Zustand store pattern
    - Update imports in components to use Zustand hooks
  - **Implementation Steps**:
    1. Install Zustand: `npm install zustand`
    2. Create `src/stores/ingredientStore.ts`:
       - Convert IngredientContext to Zustand store
       - Keep same actions: `addIngredient`, `addIngredients`, `updateIngredient`, `deleteIngredient`
       - Add devtools middleware: `devtools(store, { name: 'IngredientStore' })`
       - Test store in isolation (existing tests can be adapted)
    3. Update components using `useIngredients` hook:
       - Replace Context imports with store hook
       - Update tests to use store instead of Context wrapper
    4. Repeat for RecipeContext → `src/stores/recipeStore.ts`
    5. Repeat for MealPlanContext → `src/stores/mealPlanStore.ts`
    6. Update SyncContext to work with Zustand stores
    7. Verify all 450+ tests still pass
    8. Remove old Context files after full migration
  - **Note**: Batch operations (like `addIngredients`) still important for performance (1 save vs N saves)

## I6. Recipe-Specific Ingredient Names

### Feature Overview
Allow users to use different display names for the same ingredient in different recipes while maintaining proper ingredient linking for grocery list consolidation. For example:
- Recipe A uses "chicken breast" → links to ingredient "Chicken Breast"
- Recipe B uses "chicken" → links to same ingredient "Chicken Breast"
- Both consolidate correctly in grocery lists

### Implementation Steps

- [x] I6.1. Update RecipeIngredient data model (TDD)
  - Write tests first in `src/types/recipe.test.ts`
  - Test cases: RecipeIngredientSchema validation with new displayName field, backward compatibility
  - Update `RecipeIngredient` interface in `src/types/recipe.ts`:
    - Add optional `displayName?: string` field
    - When `displayName` is present, use it for display
    - When `displayName` is absent, fall back to ingredient library name (backward compatible)
  - Update `RecipeIngredientSchema` Zod schema to include optional displayName
  - Update all type exports and ensure existing code compiles
  - **Quality checks**: Run tests and type checks, save output to `tmp/`

- [x] I6.2. Update RecipeDetail component to display custom names (TDD)
  - ✅ Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - ✅ Test cases: 
    - Display custom displayName when provided
    - Fall back to ingredient library name when displayName not provided
    - Handle missing ingredient gracefully
  - ✅ Update `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`:
    - Modify ingredient rendering logic:
      ```typescript
      const ingredientData = getIngredientById(ingredient.ingredientId)
      const displayName = ingredient.displayName || ingredientData?.name || 'Unknown Ingredient'
      ```
    - Show displayName in ingredient list instead of always using library name
    - Keep quantity and unit display logic unchanged
  - ✅ Ensure responsive styling remains intact
  - ✅ **Quality checks**: Run tests and lint, save output to `tmp/`
  - **Results**: All 464 tests pass (25/25 RecipeDetail), lint clean, TypeScript compiles successfully

- [x] I6.3. Update RecipeForm to support custom ingredient names (TDD)
  - ✅ Write component tests first in `src/components/recipes/RecipeForm.test.tsx`
  - ✅ Test cases:
    - Display text input for custom name when ingredient selected
    - Pre-fill with existing displayName in edit mode
    - Allow clearing custom name to use library name
    - Submit form with displayName included
    - Show library name as placeholder/hint
  - ✅ Update `RecipeForm` component in `src/components/recipes/RecipeForm.tsx`:
    - Add displayName field to ingredient rows in form
    - Layout for each ingredient row:
      ```
      [Ingredient Select (2 flex)] [Quantity Input (1 flex)] [Unit (static)] [Custom Name Input (2 flex)] [Remove Button]
      ```
    - Custom name input:
      - TextInput with placeholder showing library ingredient name
      - Label: "Custom Name (optional)" on first row only
      - Optional field - can be left empty to use library name
      - Pre-populate in edit mode if displayName exists
    - Update form validation to include displayName field
    - Update handleSubmit to include displayName in recipe data
  - ✅ Update responsive layout for mobile (stack fields vertically)
  - ✅ **Integrate into RecipeForm immediately**: Wire form state and submission
  - ✅ Test complete flow: select ingredient → add custom name → submit → verify saved
  - ✅ **Quality checks**: Run tests and lint, save output to `tmp/`
  - **Results**: All 470 tests pass (24/24 RecipeForm with 6 new displayName tests), lint clean, TypeScript compiles successfully

- [x] I6.4. Update AI Recipe Import to support custom names (TDD)
  - ✅ Write component tests first in `src/components/recipes/RecipeImportModal.test.tsx`
  - ✅ Test cases:
    - Parse displayName from AI-generated JSON
    - Show displayName in review step (15/15 tests passing)
    - Import recipe with custom names correctly
  - ✅ Update AI prompt template in `src/utils/aiPromptGenerator.ts`:
    - Added displayName field to RecipeIngredient schema (11/11 tests passing)
    - Document that displayName is optional and should reflect how ingredient appears in source recipe
    - Update example output to show displayName usage
  - ✅ Update validation logic to handle optional displayName field:
    - Added displayName to `ImportedIngredientSchema` in `src/utils/recipeImportValidator.ts`
    - Fixed `cleanRecipe` mapping to preserve displayName field
  - ✅ Update review UI to show custom names when present:
    - Display: "chicken (Chicken Breast)" where first is displayName, parentheses show library name
    - Falls back to just library name when displayName absent
  - ✅ Test import flow with and without custom names
  - ✅ **Quality checks**: Run tests and lint, save output to `tmp/`
  - **Results**: All 475 tests pass (15/15 RecipeImportModal, 11/11 aiPromptGenerator), lint clean, build successful

- [x] I6.5. Update Recipe storage and migration (TDD)
  - ✅ Write migration tests in `src/utils/storage/recipeStorage.test.ts`
  - ✅ Test cases (16/16 tests passing):
    - Load old recipes without displayName successfully (backward compatible)
    - Save recipes with displayName correctly
    - Validate schema handles both formats
    - Handle mixed recipes with and without displayName
    - Preserve displayName through save/load cycles
  - ✅ Verify `RecipeStorageService` in `src/utils/storage/recipeStorage.ts`:
    - No changes needed - displayName is optional, schema already handles it
    - Backward compatibility with existing stored recipes confirmed
  - ✅ Data migration assessment:
    - Old format: `{ ingredientId: "1", quantity: 2 }` - still valid
    - New format: `{ ingredientId: "1", quantity: 2, displayName: "chicken" }` - supported
    - Migration: No action needed - old format remains valid
  - ✅ **Quality checks**: Run all storage tests, verify migration works, save output to `tmp/`
  - **Results**: All 479 tests pass (16/16 recipeStorage with 4 new displayName tests), no regressions

### Notes for Future Implementation
- **Grocery List Integration**: When implementing grocery list generation (R3), ensure it:
  - Consolidates ingredients by `ingredientId` (not displayName)
  - Shows all unique displayNames used for context: "Chicken Breast (as: chicken, chicken breast) - 800g"
  - Falls back to library name only if no custom names exist

## I7. Recipe Hero Images (R1.4)

### Implementation Steps

- [x] I7.1. Update Recipe data model for hero images (TDD)
  - Note: Recipe interface already includes optional `imageUrl?: string` field
  - Write tests in `src/types/recipe.test.ts` to verify:
    - Recipe with imageUrl validates correctly
    - Recipe without imageUrl remains valid (backward compatible)
    - Empty string imageUrl is invalid (must be valid URL or omitted)
    - Invalid URL formats are rejected
  - Update RecipeSchema Zod validation to enforce URL format when imageUrl is provided:
    - Use `z.string().url()` or custom URL validation
    - Keep field optional to maintain backward compatibility
  - **Quality checks**: Run type tests, save output to `tmp/`
  - ✅ **Results**: All 488 tests pass (18 new Recipe imageUrl validation tests), output saved to `tmp/all-tests-i7.1.txt`

- [x] I7.2. Update RecipeDetail to display hero image (TDD)
  - Write component tests first in `src/components/recipes/RecipeDetail.test.tsx`
  - Test cases:
    - Display hero image when imageUrl is provided
    - Show placeholder or no image area when imageUrl is absent
    - Handle broken/invalid image URLs gracefully (fallback image or icon)
    - Image should be responsive and maintain aspect ratio
    - Alt text uses recipe name for accessibility
  - Update `RecipeDetail` component in `src/components/recipes/RecipeDetail.tsx`:
    - Add hero image section at top of recipe detail
    - Use Mantine Image component with loading states
    - Implement error handling for failed image loads
    - Responsive design: full-width on mobile, constrained on desktop
    - Suggested max width: 800px, aspect ratio: 16:9 or 4:3
  - **Quality checks**: Run RecipeDetail tests, verify visual appearance, save output to `tmp/`
  - ✅ **Results**: All 500 tests pass (5 new RecipeDetail hero image tests), component displays hero images with responsive design and fallback handling

- [x] I7.3. Update RecipeForm to support image URL input (TDD)
  - Write component tests first in `src/components/recipes/RecipeForm.test.tsx`
  - Test cases:
    - Render image URL input field
    - Validate URL format on submission
    - Allow empty/undefined imageUrl (optional field)
    - Show validation error for invalid URLs
    - Preview image when valid URL is entered
    - Form submission includes imageUrl
  - Update `RecipeForm` component in `src/components/recipes/RecipeForm.tsx`:
    - Add imageUrl text input field (Mantine TextInput)
    - Add URL validation with zodResolver
    - Add optional image preview below input when URL is provided
    - Preview should handle loading/error states
    - Form should submit with imageUrl included
  - Apply Mantine styling with responsive design
  - **Quality checks**: Run RecipeForm tests, verify form behavior, save output to `tmp/`
  - ✅ **Results**: All 500 tests pass (7 new RecipeForm imageUrl tests), form includes imageUrl input field with live preview and validation, output saved to `tmp/all-tests-i7.2-i7.3-final.txt`

- [x] I7.4. Update RecipeList cards to show thumbnail images (TDD)
  - Write component tests first in `src/components/recipes/RecipeList.test.tsx`
  - Test cases:
    - Display thumbnail image when imageUrl exists
    - Show placeholder icon/image when imageUrl is absent
    - Handle broken image URLs gracefully
    - Thumbnails have consistent size across all cards
    - Maintain card layout integrity with/without images
  - Update `RecipeList` component in `src/components/recipes/RecipeList.tsx`:
    - Add image section to each recipe card
    - Use Mantine Image component with placeholder
    - Thumbnail size: ~150-200px height, full card width
    - Maintain aspect ratio with object-fit: cover
    - Position image at top of card
    - Fallback: cooking/recipe icon when no image
  - Update card layout to accommodate images without breaking existing design
  - **Quality checks**: Run RecipeList tests, verify grid layout, save output to `tmp/`
  - ✅ **Results**: All 505 tests pass (24 RecipeList tests), cards always show Image component with SVG fallback ("No image" text) for missing images, consistent 180px thumbnail height, output saved to `tmp/all-tests-i7.4-fixed.txt`

### Implementation Notes
- **AI Import & Storage**: imageUrl is already fully supported in AI prompt generator, validator, and storage - no additional work needed
- **URL Storage Only**: This implementation stores image URLs (external links), not file uploads
- **Future Enhancement**: Consider adding local file upload/storage in future iteration
- **Image Sources**: Users can link to images from:
  - Original recipe websites
  - Cloud storage services (Google Drive, Dropbox with public links)
  - Image hosting services (Imgur, etc.)
  - Personal web servers
- **Performance**: Images loaded on-demand, not bundled with app

## I8. Grocery List Generation (R3)

### Overview
Generate grocery lists from planned meals for a selected time period. The system consolidates ingredients by `ingredientId` across multiple recipes, scales quantities based on servings, and allows users to manually edit, add items, and check off items while shopping.

### Data Structure
```typescript
interface GroceryList {
  id: string
  name: string // e.g., "Week of Jan 23" or user-customized
  dateRange: { start: string; end: string } // ISO date strings (YYYY-MM-DD)
  createdAt: number // Unix timestamp
  items: GroceryItem[]
}

interface GroceryItem {
  id: string
  ingredientId: string | null // Null = manually added item, not from ingredient library
  quantity: number // User-adjustable (starts as auto-calculated & rounded)
  unit: Unit // From ingredient library or custom for manual items
  category: IngredientCategory // Denormalized from ingredient library for sorting/display
  checked: boolean
  mealPlanIds: string[] // Which meal plans need this ingredient (for traceability)
  notes?: string // Optional user notes (e.g., "Get organic", "Costco has sale")
}
```

### Generation Algorithm
1. User selects date range (e.g., "next 7 days", "Jan 23-30", custom dates)
2. Find all `RecipeMealPlan` entries in date range (ignore custom meal types like dining-out, takeout)
3. For each recipe-based meal plan:
   - Fetch recipe by `recipeId`
   - Scale ingredient quantities: `scaledQuantity = ingredient.quantity * (meal.servings / recipe.servings)`
   - Add to accumulator: `Map<ingredientId, AccumulatedData>`
   - Store: quantity, unit, mealPlanIds, category (from ingredient library)
4. Apply smart rounding based on unit type:
   - `piece`, `clove`, `slice`, `can`, `package`: Round up to whole number
   - `cup`, `tablespoon`, `teaspoon`: Round to nearest 0.25
   - `gram`, `kilogram`: Round to nearest 50g
   - `milliliter`, `liter`: Round to nearest 50ml
   - Others: Round to 1 decimal place
5. Convert accumulated data to flat `GroceryItem[]` with `checked = false`
6. Generate grocery list name (default: "Week of [start date]")

### Key Features
- **Consolidation by ingredientId**: Multiple recipes using same ingredient → single grocery item
- **Category grouping**: Items organized by ingredient category (Produce, Dairy, Meat, etc.) for better shopping flow
- **Recipe displayNames ignored**: Consolidation happens at ingredient library level
- **Traceability via mealPlanIds**: Users can see which meals need each ingredient
- **Manual editing**: Users can adjust quantities, add custom items, remove items
- **Checked state**: Track shopping progress (R3.5)
- **Smart rounding**: User-friendly quantities based on unit type

### Implementation Steps

**Following top-down, integrate-first approach:**

- [x] I8.1. Add Grocery Lists navigation entry point + define types (TDD)
  - **Entry Point First**: Add "Grocery Lists" to NavigationBar with shopping cart icon
  - Update routes in App.tsx: `/grocery-lists` and `/grocery-lists/:id`
  - **Define minimal types** needed for UI in `src/types/groceryList.ts`:
    - Create TypeScript interfaces (GroceryList, GroceryItem)
    - Include `category: IngredientCategory` field in GroceryItem (denormalized for sorting)
    - Add Zod schemas for validation
    - Write type tests in `src/types/groceryList.test.ts`
  - Test navigation to grocery lists routes
  - **Quality checks**: Run tests, save output to `tmp/`
  - ✅ **Results**: All 521 tests pass (16 new GroceryList type tests), navigation added with shopping cart icon, routes configured, output saved to `tmp/all-tests-i8.1.txt`

- [ ] I8.2. Build GroceryListsPage with stub data (TDD)
  - Write page tests in `src/pages/groceryLists/GroceryListsPage.test.tsx`
  - Create `GroceryListsPage` in `src/pages/groceryLists/GroceryListsPage.tsx`
  - **Use stub/mock data** for initial display:
    - Mock grocery list cards with: name, date range, item count, checked count
    - "Generate New List" button (opens modal - placeholder for now)
    - Empty state: "No grocery lists yet"
  - **Wire to App.tsx immediately** - page is navigable and visible
  - Apply Mantine styling with responsive card layout
  - Test page renders, navigation works, button shows modal (even if empty)
  - **Quality checks**: Run tests, verify in browser, save output to `tmp/`

- [ ] I8.3. Build GroceryListDetailPage with placeholder content (TDD)
  - Write page tests in `src/pages/groceryLists/GroceryListDetailPage.test.tsx`
  - Create `GroceryListDetailPage` in `src/pages/groceryLists/GroceryListDetailPage.tsx`
  - **Display stub grocery list data**:
    - List name and date range
    - Mock items with checkboxes, quantities, names
    - Edit/Delete action buttons (handlers empty for now)
  - **Wire to parent immediately**: Clicking list card on GroceryListsPage navigates to detail
  - Apply Mantine styling
  - **Quality checks**: Run tests, verify full navigation flow, save output to `tmp/`

- [ ] I8.4. Build Generator modal UI and wire to page (TDD)
  - Write component tests in `src/components/groceryLists/GroceryListGenerator.test.tsx`
  - Create `GroceryListGenerator` modal in `src/components/groceryLists/GroceryListGenerator.tsx`
  - UI elements with placeholders:
    - Date range picker (Mantine DatePicker)
    - Optional name input (defaults to "Week of [start date]")
    - Generate button → shows "Coming soon" toast for now
    - Meal count preview → shows "0 meals" placeholder
  - **Wire to GroceryListsPage immediately**: "Generate New List" button opens modal
  - Apply Mantine Modal styling
  - **Quality checks**: Run tests, verify modal opens/closes, save output to `tmp/`

- [ ] I8.5. Implement generation logic and connect to UI (TDD)
  - Write utility tests in `src/utils/generateGroceryList.test.ts`
  - Test cases:
    - Basic consolidation by ingredientId
    - Scaling quantities by servings
    - Smart rounding by unit type
    - MealPlanIds tracking
    - Category assignment from ingredient library
  - Implement `generateGroceryList(dateRange, mealPlans, recipes, ingredients)` in `src/utils/generateGroceryList.ts`
  - Accumulation strategy: key by ingredientId (unique per ingredient/unit)
  - Include category lookup from ingredient library for each item
  - Write smart rounding tests in `src/utils/quantityRounding.test.ts`
  - Implement `roundQuantity(quantity, unit)` in `src/utils/quantityRounding.ts`
  - **Connect to Generator modal immediately**:
    - Replace "Coming soon" with actual generation logic
    - Use existing MealPlanContext, RecipeContext, IngredientContext
    - Generate in-memory grocery list
    - Show in temporary state (not persisted yet)
  - Update meal count preview with real data from MealPlanContext
  - **Quality checks**: Run tests, verify generation works in UI, save output to `tmp/`

- [ ] I8.6. Build GroceryListView component and integrate (TDD)
  - Write component tests in `src/components/groceryLists/GroceryListView.test.tsx`
  - Create `GroceryListView` in `src/components/groceryLists/GroceryListView.tsx`
  - **Display items grouped by category**:
    - Group items by `category` field
    - Render category headers (e.g., "🥬 Produce", "🥛 Dairy", "🥩 Meat")
    - List items within each category section
    - Hide empty categories (no items in that category)
  - Display each item with:
    - Checkbox for checked state (local state only for now)
    - Ingredient name (from library or manual)
    - Quantity with unit (editable inline - local state only)
    - Meal plan references (show which meals need this)
    - Notes input (optional - local state only)
    - Remove button (works on local array)
  - "Add Manual Item" section at bottom (includes category selector)
  - Checked items: visual differentiation (strikethrough, dimmed)
  - **Replace stub content in GroceryListDetailPage immediately**
  - Wire Generator → GroceryListView for preview
  - Apply Mantine styling with category sections
  - **Quality checks**: Run tests, verify in browser, save output to `tmp/`

- [ ] I8.7. Add LocalStorage persistence and GroceryList Context (TDD)
  - Write storage tests in `src/utils/storage/groceryListStorage.test.ts`
  - Implement `GroceryListStorageService` in `src/utils/storage/groceryListStorage.ts`
  - Write context tests in `src/contexts/GroceryListContext.test.tsx`
  - Create `GroceryListContext` in `src/contexts/GroceryListContext.tsx`
  - Actions:
    - `generateGroceryList(dateRange, name)` - create and persist new list
    - `updateGroceryList(list)` - update existing list
    - `deleteGroceryList(id)` - remove list
    - `addGroceryItem(listId, item)` - add manual item
    - `updateGroceryItem(listId, itemId, updates)` - modify item
    - `removeGroceryItem(listId, itemId)` - remove item
  - **Wire to existing UI immediately**:
    - Replace mock data in GroceryListsPage with context data
    - Replace local state in GroceryListView with context actions
    - Generator saves to context instead of temp state
  - **Quality checks**: Run tests, verify persistence works, save output to `tmp/`

- [ ] I8.8. Add CRUD operations and finalize UI (TDD)
  - Add edit name functionality to GroceryListDetailPage
  - Add delete list with confirmation modal
  - Wire all GroceryListView interactions to context:
    - Check/uncheck items → persist immediately
    - Adjust quantities → debounced save
    - Add/remove items → persist immediately
    - Add/edit notes → debounced save
  - Add meal plan reference display (clickable links to meals)
  - Test complete CRUUses `ingredientId + unit` as key (same ingredient + same unit = consolidated)
- **Unit Mismatch**: Same ingredient with different units = separate items (no conversion)
- **Category Grouping**: Items stored with category field, UI groups by category for shopping flow
- **Recipe displayNames**: Ignored during consolidation (uses ingredient library name)
- **Meal Traceability**: `mealPlanIds` allows users to see context for each ingredient
- **Manual Items**: `ingredientId = null` indicates user-added items not from library
- **Manual Item Category**: User selects category when adding manual items
- **No Live Sync**: Lists are static snapshots; changes to meal plans don't auto-update lists
- **Future Enhancements**:
  - Nested grouping by ingredient name within categories (show "Bananas" with unit variants grouped)
  - Unit conversion suggestions (optional hints, non-blocking)
  - Frequent items (R3.6): Save commonly bought items for quick access
  - List templates: Save/reuse common grocery lists
  - Multiple active lists: Allow concurrent lists for different purposes
  - Export/Print: Generate printable shopping list
  - Collapsible category sections
  - Custom category ordering