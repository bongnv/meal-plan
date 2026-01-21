# Mean Plan - Requirements

## Overview
A client-side web application for managing recipes, planning meals, and organizing grocery lists. No backend required - all data stored locally in browser LocalStorage or synced via OneDrive.

## Core Features

### R0. Dashboard/Home Page
- [ ] R0.1. Overview dashboard as the landing page
- [ ] R0.2. Display quick stats:
  - Total number of recipes
  - Upcoming meals this week
  - Active grocery lists
- [ ] R0.3. Quick actions:
  - Create new recipe
  - Plan a meal
  - View recipes
  - Generate grocery list
- [ ] R0.4. Recent activity feed:
  - Recently added recipes
  - Recently planned meals
- [ ] R0.5. This week's meal plan preview (if available)
- [ ] R0.6. Navigation links to main sections (Recipes, Meal Plans, Grocery Lists)

### R1. Recipe Management
- [x] R1.1. Create, edit, and delete recipes
- [x] R1.2. Store recipe details:
  - Name and description
  - Ingredients with quantities (selected from ingredient library with autocomplete)
  - Preparation instructions
  - Servings
  - Prep/cook time
  - Tags/categories (e.g., breakfast, vegetarian, quick)
- [x] R1.3. Search and filter recipes by name, ingredient, or tag
- [ ] R1.4. Image support (optional)

### R2. Meal Planning
- [ ] R2.1. Plan meals for extended periods: week, month, quarter, or year ahead
- [ ] R2.2. Calendar view with flexible date range display
- [ ] R2.3. Drag-and-drop recipes onto specific days/meals
- [ ] R2.4. Multiple meal slots per day (lunch, dinner)
- [ ] R2.6. Support two meal entry types:
  - Recipe-based meals (from recipe library)
  - Custom entries (free-form text for dining out, takeout, etc.)
- [ ] R2.7. Adjust servings for planned meals
- [x] R2.8. Copy/duplicate meal plans to other days

### R3. Grocery Planning
- [ ] R3.1. Auto-generate shopping list from planned meals for a selected time period (next week, next 2 weeks, custom date range)
- [ ] R3.2. Combine duplicate ingredients across multiple recipes
- [ ] R3.3. Manually add/remove items from shopping list
- [ ] R3.4. Organize items by category (produce, dairy, meat, pantry, etc.)
- [ ] R3.5. Check off items while shopping
- [ ] R3.6. Save frequently bought items for quick access

### R4. Settings/Configuration
- [x] R4.1. Ingredient Library Management:
  - View all defined ingredients
  - Add new ingredients with name, category, and standard unit
  - Edit existing ingredients
  - Delete unused ingredients
  - Categories: produce, dairy, meat, pantry, frozen, bakery, other
- [ ] R4.2. Data Management (OneDrive Sync):
  - Microsoft account authentication using MSAL.js
  - Enable/disable sync in settings
    - Manual sync trigger (sync now button)
    - Automatic background sync
    - Sync status indicator (last synced time, sync in progress, errors)
    - Conflict resolution:
      - Auto-merge when possible (non-conflicting changes to different records)
      - Show conflicts when local and OneDrive data differ for same records
      - Manual resolution options: Keep local or Keep OneDrive
    - Offline capability: queue changes for sync when online
    - Reset and re-import: clear local data and re-import from OneDrive
- [ ] R4.3. Application Settings:
  - Default servings for new recipes

### R5. Welcome/Onboarding
- [ ] R5.1. First-time user experience:
  - Show welcome screen on first visit
  - Initial setup options:
    - Start fresh with empty data
    - Load existing data from OneDrive (requires authentication)
  - Skip welcome screen after initial setup complete
