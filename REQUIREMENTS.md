# Mean Plan - Requirements

## Overview
A client-side web application for managing recipes, planning meals, and organizing grocery lists. No backend required - all data stored locally in browser LocalStorage or synced via OneDrive.

## Core Features

### 1. Recipe Management
- Create, edit, and delete recipes
- Store recipe details:
  - Name and description
  - Ingredients with quantities
  - Preparation instructions
  - Servings
  - Prep/cook time
  - Tags/categories (e.g., breakfast, vegetarian, quick)
- Search and filter recipes by name, ingredient, or tag
- Image support (optional)

### 2. Meal Planning
- Plan meals for extended periods: week, month, quarter, or year ahead
- Calendar view with flexible date range display
- Drag-and-drop recipes onto specific days/meals
- Multiple meal slots per day (breakfast, lunch, dinner, snacks)
- Support different plan types:
  - Recipe-based meals
  - Dine out
  - Pizza/takeout
  - Custom entries
- Adjust servings for planned meals
- Copy/duplicate meal plans to other days
- View nutritional summaries (if recipe data includes it)

### 3. Grocery Planning
- Auto-generate shopping list from planned meals for a selected time period (next week, next 2 weeks, custom date range)
- Combine duplicate ingredients across multiple recipes
- Manually add/remove items from shopping list
- Organize items by category (produce, dairy, meat, pantry, etc.)
- Check off items while shopping
- Save frequently bought items for quick access