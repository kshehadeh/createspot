---
name: git-commit
description: A git commit specialist that analyzes current changes and creates properly separated commits following conventional commit format. Use this when the user wants to commit changes with clean, atomic commit messages following the conventional commit specification (feat, fix, docs, refactor, test, chore, etc.).
---

# Git Commit

This skill helps you create clean, atomic commits following the conventional commit format.

## When to Use This Skill

Use this skill when the user:

- Wants to commit current changes with proper git commit messages
- Asks for help committing changes
- Needs to separate mixed changes into logical commits
- Wants to follow conventional commit format
- Says "commit my changes" or "help me commit these changes"

## Conventional Commit Format

This skill creates commits with format:

```text
<type>(<scope>): <subject>

<body (optional)
```

### Common Types

| Type | Description |
|-------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semi colons, etc. |
| `refactor` | Code refactoring without feature change |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Changes that affect build system |
| `ci` | CI configuration changes |
| `chore` | Other changes that don't fit above |

## How to Help Users Commit Changes

### Step 1: Analyze Current Changes

Run these commands to understand what's changed:

```bash
git status --porcelain
git diff --stat
git diff
```

### Step 2: Identify Logical Groupings

Review the changes and identify related work:

**Look for:**

- Related files that should be committed together (e.g., a new feature's files)
- Logical units of work (new command, new droid, documentation update)
- Unrelated changes that should be separate commits

**Examples of logical groupings:**

- `scripts/review/*.ts` files together → one commit
- `docs/**/*.md` documentation changes together → one commit
- Configuration changes (`.markdownlint.json`) → separate commit
- Test files → separate commit

### Step 3: Stage Files Per Commit

For each logical grouping:

1. Stage the files:

   ```bash
   git add <file1> <file2>
   ```

2. Create commit with conventional message:

   ```bash
   git commit -m "<type>(<scope>): <subject>"
   ```

### Step 4: Write Good Commit Messages

**Rules:**

- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 50 characters
- Wrap body at 72 characters per line
- Include scope when it adds clarity
- Explain "what and why" in body, not "how"

**Examples:**

```text
feat(review): add stale document detection command

- Add CLI command to detect stale documentation by last_updated date
- Groups documents by owner for notification
- Supports multiple notifiers (console, email)
```

```text
refactor(cli): rename README to index files

- Rename all README.md to index.md for consistency
- Update all references across documentation
```

```text
docs(review): add CLI documentation with command reference

- Document all commands and options
- Include usage examples and setup instructions
```

## Common Patterns

### New Feature

```text
feat(cli): add new feature name

- Summary of what was added
- Any important implementation details
```

### Bug Fix

```text
fix(scope): description of bug fix

- Explains what was broken
- Explains the fix approach
```

### Documentation

```text
docs(scope): update description

- Summarize documentation changes
```

### Refactoring

```text
refactor(scope): description of refactoring

- Explain why refactoring was done
- Note if it's a breaking change
```

### Chore

```text
chore: remove package-lock.json

- Project uses bun.lock only
- Remove npm lock file
```

## Step-by-Step Process

1. Check git status: `git status --porcelain`
2. Review git diff: `git diff` or `git diff --staged`
3. Identify related file groups
4. For each group:
   - Stage files: `git add <files>`
   - Write commit message
   - Create commit: `git commit -m "message"`
5. Show final summary: `git log --oneline -n`

## Tips for Clean Commits

- **One logical change per commit** - don't mix featurerefactoring and bug fixes
- **Atomic commits** - make each commit the minimal but complete
- **Testable commits** - each commit should leave repo in working state
- **Message clarity** - commit message should explain the purpose, not implementation
- **Review staged changes** - use `git diff --staged` before committing

## If Changes Can't Be Separated

If changes are too intermingled:

```bash
# 1. Create patches for each logical unit
git diff HEAD > my-changes.patch

# 2. Create interactive patch for specific change
git add -p /path/to/files
git commit -m "type: message"

# 3. Keep staging and committing until done
```

## Environment Variables

When adding commits, always do:

```bash
git commit -m "message" \
  --author="Author Name <email@example.com>" \
  --date="YYYY-MM-DDTHH:MM:SS"
```

To include co-authorship:

```bash
git commit -m "message" \
  --author="Author Name <email@example.com>" \
  --date="YYYY-MM-DDTHH:MM:SS"

Co-authored-by: Co-Author Name <123456789+coauthor@users.noreply.github.com>
```
