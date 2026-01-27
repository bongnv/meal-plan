# Meal Plan - Architecture

## Overview
Client-side web application with no backend server. All data stored locally in browser using IndexedDB and optionally synced via OneDrive.

## Storage Strategy

### IndexedDB with Dexie
- Primary data store using IndexedDB via Dexie.js library
- Stores recipes, ingredients, meal plans, and grocery lists
- Provides offline-first functionality with reactive data updates
- Data persists between sessions
- Better performance and structure than LocalStorage
- Built-in indexing for efficient queries and filtering

### OneDrive Sync (Optional)
- Syncs data across devices via OneDrive API
- Users authenticate with Microsoft account
- Data stored as JSON files in OneDrive app folder
- Cloud sync populates Dexie database on app initialization
- Conflict resolution: auto-merge with user prompt for conflicts

## Tech Stack

### Core Framework
- **React** with TypeScript for type safety and component architecture
- **Vite** for fast development and optimized builds

### State Management
- **React Context** with Dexie's reactive queries
- Dexie's `useLiveQuery` hook for automatic UI updates

### UI Components
- **Mantine** for comprehensive component library with built-in styling and form handling
  - Prefer native Mantine solutions (@mantine/modals, @mantine/notifications, etc.) over custom implementations
- **dnd-kit** for drag-and-drop meal planning

### Data & Storage
- **Dexie.js** - IndexedDB wrapper for client-side persistence
- **dexie-react-hooks** - React integration for reactive queries
- **Microsoft Graph API** for OneDrive integration
- **MSAL.js** for Microsoft authentication

### Utilities
- **Day.js** for date handling (required by Mantine Dates)
- **Zod** for data validation

## Architecture

### Application Layers (3-Layer Design)

The application follows a clean 3-layer architecture:

**Layer 1: UI (User Interface)**
- **Location:** `/src/components/`, `/src/pages/`, `/src/hooks/`
- **Responsibility:** User interaction, visual presentation, and routing
- Components use Mantine UI library
- Custom hooks for reusable UI logic
- React Context for state management and business logic
- Dexie's `useLiveQuery` for reactive data binding

**Layer 2: Services (Stateless Business Logic)**
- **Location:** `/src/services/`, `/src/utils/`
- **Responsibility:** Stateless operations, complex queries, and transformations
- Search and filter operations
- Data validation and transformation
- ID generation and utilities
- Does NOT manage state or database connections

**Layer 3: Database (Data Persistence)**
- **Location:** `/src/db/`
- **Responsibility:** Data schema and database configuration
- Dexie database instance with table definitions
- IndexedDB indexes for efficient queries
- No business logic or state management

### Data Flow
1. **User Action** → UI component event handler
2. **Context Method** → Called from UI, contains business logic
3. **Database Operation** → Direct Dexie API calls (`db.table.add()`, etc.)
4. **Service Call** → Optional, for complex queries/transformations
5. **Reactive Update** → `useLiveQuery` automatically updates UI

### Key Benefits of 3-Layer Design
- **Simplicity:** Direct database access eliminates unnecessary abstraction
- **Reactivity:** useLiveQuery provides automatic UI updates
- **Separation:** Business logic in services, not mixed with UI or DB
- **Maintainability:** Clear responsibilities for each layer
- **Performance:** Fewer layers means less overhead

### Data Access Patterns

**CRUD Operations (in Contexts):**
```typescript
// Create
const newRecipe = { ...data, id: generateId() }
await db.recipes.add(newRecipe)

// Read (reactive)
const recipes = useLiveQuery(() => db.recipes.toArray(), []) ?? []

// Update
await db.recipes.put(updatedRecipe)

// Delete
await db.recipes.delete(id)

// Bulk Operations
await db.recipes.bulkAdd(recipes)
await db.recipes.bulkDelete(ids)
```

**Complex Queries (in Services):**
```typescript
// Search
const results = await db.recipes
  .filter(r => r.name.toLowerCase().includes(query))
  .toArray()

// Indexed queries
const byTag = await db.recipes.where('tags').equals(tag).toArray()
```

### Error Handling
- Database layer does NOT catch errors - they propagate upward
- Context layer catches errors and manages user feedback
- UI layer displays error messages via context state

### Key Design Principles
- Offline-first: app works without internet connection
- Reactive data: UI automatically updates when database changes
- Progressive enhancement: OneDrive sync is optional
- Data ownership: user's data stays in their browser and OneDrive
- No server costs: completely client-side application
