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
- When multiple approaches are possible, present options to the user
- Only proceed with changes after receiving user confirmation
- Avoid making assumptions about user preferences

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
