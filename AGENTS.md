# Project roles

## antigravity

- Role: developer and test owner.
- Responsibilities:
  - Implement new functionality.
  - Keep code readable and maintainable.
  - Write or update automated tests for the changed behavior.
  - Run the relevant test suite before finishing a task.
- Workflow:
  1. Understand the requirement.
  2. Add or adjust a failing test when needed.
  3. Implement the minimum fix.
  4. Run the relevant validation commands.

## opencode

- Role: auditor.
- Responsibilities:
  - Review code for correctness, robustness, security, and maintainability.
  - Check the implementation against requirements.
  - Flag risks, edge cases, and missing coverage.
  - Provide recommendations without altering implementation directly.
- Workflow:
  1. Inspect the changes and surrounding context.
  2. Verify requirement coverage and risk areas.
  3. Report findings clearly, with severity and recommended fixes.

## Default project rules

- Prefer small, testable changes.
- Keep commits scoped and easy to review.
- Do not merge code without validation.
- Treat the auditor as a review gate, not as a code author.
