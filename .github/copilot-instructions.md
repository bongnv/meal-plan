# GitHub Copilot Instructions

## Documentation Style

- Use simple and concise language for all documentation
- Keep explanations clear and to the point

## Product Requirements

- Refer to REQUIREMENTS.md for product requirements and specifications
- Follow the requirements defined in REQUIREMENTS.md when implementing features

## Architecture

**3-layer**: Components → Hooks → Services

### Components (`src/components/`) - Presentation Only
- Render UI, call hooks, handle events
- NO useState/useEffect (except trivial UI state like menu open)
- NO business logic, NO calculations, NO validation

### Hooks (`src/hooks/`) - UI Logic
**Structure**:
- `primitives/` - Generic patterns: `useFormState`, `useDialogState`, `useAsyncComputation`, `useFilterState`
- `[domain]/` - Domain hooks: `accounts/`, `transactions/`, `assets/`, `reports/`
- Don't include business logic (delegate to services)

### Services (`src/services/`) - Business Logic
- All calculations, validations, transformations, domain rules
- NO React imports, NO hooks, NO JSX
- Stateless, pure functions, constructor-injected dependencies

### Supporting
- **Utils** (`src/utils/`): Pure functions, no state
- **Database** (`src/db/`): Dexie schema, IndexedDB only

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Minimal comments (only for non-obvious logic)
- Respect layer boundaries (no cross-layer violations)
- Use path aliases (`@/components/`, `@/hooks/`, `@/services/`, etc.) instead of relative imports

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
