# GitHub Copilot Instructions

## Documentation Style

- Use simple and concise language for all documentation
- Keep explanations clear and to the point

## Product Requirements

- Refer to REQUIREMENTS.md for product requirements and specifications
- Follow the requirements defined in REQUIREMENTS.md when implementing features

## Architecture & Tech Stack

- Refer to ARCHITECTURE.md for technical architecture and technology decisions
- Follow the architecture guidelines and tech stack defined in ARCHITECTURE.md for all implementations

### 3-Layer Architecture

The application follows a clean 3-layer architecture:

**Layer 1: UI (User Interface)**

- Location: `/src/pages/`, `/src/components/`, `/src/hooks/`
- React components for presentation and user interaction
- Custom hooks for managing UI state and calling services
- Keep components focused on rendering and user events
- No business logic in components

**Layer 2: Services (Business Logic)**

- Location: `/src/services/`, `/src/utils/`
- **Stateless** services with pure business logic
- All dependencies should be **injected** (db instance, other services)
- Services handle CRUD operations, validation, transformations
- Services are testable without React
- No React hooks or components in services

**Layer 3: Database**

- Location: `/src/db/`
- Dexie database instance and schema definitions
- No business logic, just data persistence

### Context Usage

- React Context should **only** be used for:
  - Global UI state (theme, auth status, modals)
  - Sharing services across components
- Business logic belongs in **services**, not contexts
- Avoid "XxxContext" that duplicate service functionality

## Implementation Planning

- Use IMPLEMENTATION_PLAN.md to plan features; mark REQUIREMENTS.md checkboxes when planned
- Break down features into numbered, actionable implementation steps
- Follow **top-down, integrate-first approach**:
  1. Add UI entry point (button, link, etc.)
  2. Build UI with placeholders and wire to parent pages/contexts immediately
  3. Implement logic and connect to UI as you build
- Track completion with checkboxes for each step
- Integrate continuously - no isolated components or separate "wiring" phase

## Decision Making

- **Always present multiple options** when there are different approaches to solve a problem
- Discuss trade-offs, pros/cons of each option clearly
- **Only proceed with implementation after user confirms** which approach to use
- Avoid making assumptions about user preferences
- When asked to make changes, first propose solutions and wait for user approval

## Development Approach

- Follow Test-Driven Development (TDD) methodology, write tests first before implementing features

## Quality Assurance

- After completing each task, run quality checks and save output to `tmp/` folder
- Save test/lint/build output to files for examination to avoid running multiple times
- Read from the saved log files to examine results instead of re-running commands
- Only re-run commands when requires fresh output
- Fix any issues before marking the task as complete
- Check test coverage after implementing features:
  - Ensure new code has adequate test coverage (aim for >80% coverage)
  - Write additional tests if coverage is insufficient
