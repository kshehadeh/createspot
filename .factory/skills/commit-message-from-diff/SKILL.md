---
name: commit-message-from-diff
description: Generates Conventional Commits-style messages from git diffs. Use when users ask for commit message suggestions or to review staged changes.
---

# Commit Message From Diff

## Purpose
Draft descriptive **Conventional Commits** messages based on the current git diff. This skill **does not run `git commit`** unless explicitly asked.

## Inputs
- **Repo path** (absolute)
- **Diff target**: staged only (default) or include unstaged
- **Preferred scope** (optional): e.g. `header`, `auth`, `i18n`
- **Audience** (optional): user-facing vs internal

## Instructions
1. Run `git status --porcelain` to see staged vs unstaged state.
2. If there are staged changes, read `git diff --staged`.
   - If **no staged changes**, ask whether to use unstaged (`git diff`) or abort.
3. Identify:
   - **Type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`.
   - **Scope**: infer from top-level folder or feature area; use user-provided scope if given.
   - **Summary**: present tense, <= 72 chars, user-visible when possible.
4. Draft **1–3 candidate commit messages** in this format:
   - `type(scope): summary`
   - Optional body bullets if multiple changes or rationale is important.
5. If the repo uses co-authorship, optionally provide a variant with a `Co-authored-by:` line **but do not run `git commit`**.

## Heuristics
- **Docs-only changes** → `docs(scope)`.
- **Formatting or lint-only** → `chore(scope)` or `style(scope)` (prefer `chore` unless the repo uses `style`).
- **Dependency updates** → `chore(deps)` or `build(deps)`.
- **Tests only** → `test(scope)`.
- **Mixed changes** → pick the dominant user-visible change; add a short body list for secondary changes.

## Output
Provide:
1. A short bullet summary of the diff (1–3 bullets).
2. 1–3 Conventional Commits message candidates.

## Verification
- Confirm the diff was read (`git diff --staged` or `git diff`).
- Ensure each message is <= 72 characters for the subject line.
- Ensure message uses `type(scope): summary` and is in present tense.

## Constraints
- Do not run `git commit` unless explicitly requested.
