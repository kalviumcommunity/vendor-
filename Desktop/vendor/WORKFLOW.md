# Team GitHub Workflow

## Branching Strategy

- Main branch contains releasable code only.
- Feature branches follow the `feature/[description]` naming convention.
- Branches are deleted after merging.

## Commit Message Convention

We use the following commit types:

- feat
- fix
- docs
- refactor
- chore

Format:

`[type]: [description]`

This provides a clear and consistent project history.

## Pull Request Review Process

- Every PR requires at least one approval before merging.
- Code review focuses on correctness, clarity, data integrity, and test coverage.
- Commit messages are reviewed as part of code review.

## GitHub Issue Tracking

- Every feature or fix starts with a GitHub issue.
- Issues contain labels, assignees, and descriptions.
- Issues are closed when the related PR is merged.
