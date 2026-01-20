# Mean Plan - Requirements

## Overview
A client-side web application for managing recipes, planning meals, and organizing grocery lists. No backend required - all data stored locally in browser LocalStorage or synced via OneDrive.

## Core Features

### 0. Dashboard/Home Page
- [ ] 0.1. Overview dashboard as the landing page
- [ ] 0.2. Display quick stats:
  - Total number of recipes
  - Upcoming meals this week
  - Active grocery lists
- [ ] 0.3. Quick actions:
  - Create new recipe
  - Plan a meal
  - View recipes
  - Generate grocery list
- [ ] 0.4. Recent activity feed:
  - Recently added recipes
  - Recently planned meals
- [ ] 0.5. This week's meal plan preview (if available)
- [ ] 0.6. Navigation links to main sections (Recipes, Meal Plans, Grocery Lists)

### 1. Recipe Management
- [x] 1.1. Create, edit, and delete recipes
- [ ] 1.2. Store recipe details:
  - Name and description
  - Ingredients with quantities (selected from ingredient library with autocomplete)
  - Preparation instructions
  - Servings
  - Prep/cook time
  - Tags/categories (e.g., breakfast, vegetarian, quick)
- [ ] 1.3. Search and filter recipes by name, ingredient, or tag
- [ ] 1.4. Image support (optional)

### 2. Meal Planning
- [ ] 2.1. Plan meals for extended periods: week, month, quarter, or year ahead
- [ ] 2.2. Calendar view with flexible date range display
- [ ] 2.3. Drag-and-drop recipes onto specific days/meals
- [ ] 2.4. Multiple meal slots per day (breakfast, lunch, dinner, snacks)
- [ ] 2.5. Meal plans can be saved and reused for future planning periods
- [ ] 2.6. Support two meal entry types:
  - Recipe-based meals (from recipe library)
  - Custom entries (free-form text for dining out, takeout, etc.)
- [ ] 2.7. Adjust servings for planned meals
- [ ] 2.8. Copy/duplicate meal plans to other days
- [ ] 2.9. View nutritional summaries (if recipe data includes it)

### 3. Grocery Planning
- [ ] 3.1. Auto-generate shopping list from planned meals for a selected time period (next week, next 2 weeks, custom date range)
- [ ] 3.2. Combine duplicate ingredients across multiple recipes
- [ ] 3.3. Manually add/remove items from shopping list
- [ ] 3.4. Organize items by category (produce, dairy, meat, pantry, etc.)
- [ ] 3.5. Check off items while shopping
- [ ] 3.6. Save frequently bought items for quick access

### 4. Settings/Configuration
- [x] 4.1. Ingredient Library Management:
  - View all defined ingredients
  - Add new ingredients with name, category, and standard unit
  - Edit existing ingredients
  - Delete unused ingredients
  - Categories: produce, dairy, meat, pantry, frozen, bakery, other
- [ ] 4.2. Data Management:
  - Export all data (recipes, meal plans, ingredients)
  - Import data from backup
  - Clear all data with confirmation
- [ ] 4.3. Application Settings:
  - Default servings for new recipes
