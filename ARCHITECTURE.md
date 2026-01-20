# Meal Plan - Architecture

## Overview
Client-side web application with no backend server. All data stored locally in browser and optionally synced via OneDrive.

## Storage Strategy

### Local Storage
- Primary data store using browser LocalStorage
- Stores recipes, meal plans, and grocery lists
- Provides offline-first functionality
- Data persists between sessions

### OneDrive Sync (Optional)
- Syncs data across devices via OneDrive API
- Users authenticate with Microsoft account
- Data stored as JSON files in OneDrive app folder
- Conflict resolution: auto-merge with user prompt for conflicts

## Tech Stack

### Core Framework
- **React** with TypeScript for type safety and component architecture
- **Vite** for fast development and optimized builds

### State Management
- **React Context** for state management
- LocalStorage persistence layer

### UI Components
- **Mantine** for comprehensive component library with built-in styling and form handling
- **dnd-kit** for drag-and-drop meal planning

### Data & Storage
- LocalStorage API for client-side persistence
- **Microsoft Graph API** for OneDrive integration
- **MSAL.js** for Microsoft authentication

### Utilities
- **date-fns** for date handling
- **Zod** for data validation

## Architecture

### Application Layers

**Layer 1: UI Components**
- React components with Tailwind CSS and shadcn/ui
- User interaction and dMantine component library

**Layer 2: State Management**
- React Context for application state
- Manages recipes, meal plans, and grocery lists

**Layer 3: Storage Layer**
- LocalStorage Manager: immediate persistence
- OneDrive Sync: background sync across devices

### Data Flow
1. User interacts with UI components
2. Actions update state management
3. State changes trigger storage layer updates
4. LocalStorage saves data immediately
5. OneDrive sync runs in background (if enabled)

### Key Design Principles
- Offline-first: app works without internet connection
- Progressive enhancement: OneDrive sync is optional
- Data ownership: user's data stays in their browser and OneDrive
- No server costs: completely client-side application
