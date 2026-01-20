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
- Use IMPLEMENTATION_PLAN.md to plan feature implementations
- When a feature is planned in IMPLEMENTATION_PLAN.md, mark the corresponding checkbox in REQUIREMENTS.md as completed
- Break down features into numbered, actionable implementation steps
- Each implementation step should have a checkbox to track completion

## Decision Making
- When multiple approaches are possible, present options to the user
- Only proceed with changes after receiving user confirmation
- Avoid making assumptions about user preferences

## Development Approach
- Follow Test-Driven Development (TDD) methodology:
  - Write tests first before implementing features
  - Present the test code to the user for confirmation
  - Only proceed with implementation after tests are approved

## Quality Assurance
- After completing each task, run quality checks and save output to `tmp/` folder
- Save test/lint/build output to files for examination to avoid running multiple times
- Read from the saved log files to examine results instead of re-running commands
- Only re-run commands when requires fresh output
- Fix any issues before marking the task as complete
