---
name: react-component-similarity-audit
description: Audits React code to find components that are very similar, then produces a plan for shared components that reduce duplication and improve consistency. Use when auditing React components for similarity, reducing duplication, consolidating similar components, or planning shared component extraction.
---

# React Component Similarity Audit

## Goal

Identify similar React components and produce a plan for **shared components** that:
- Reduce code duplication
- Increase consistency from a user perspective

**Do not** aim for a single component with many unrelated variants. Only recommend merges where the shared abstraction is clear and the combined component stays focused.

## Workflow

### 1. Discover candidate components

- Search the codebase for React components (e.g. `components/`, `app/`, `.tsx`/`.jsx`).
- List components with their file paths and approximate size (lines or logical blocks).
- From naming, structure, and usage, identify **candidate pairs or groups** that look similar (same UI role, same props shape, similar JSX structure).

### 2. Analyze each candidate pair or group

For each pair/group:

- **Diff the implementations**: Compare props, state, JSX structure, styling, and behavior.
- **Estimate sizes**:
  - `A` = size of component(s) being replaced
  - `B` = estimated size of the new shared component (including props, variants, and minimal branching)
- **Apply the size heuristic**: If `B` is close to the sum of the replaced components (e.g. `B ≥ ~80%` of total), a single shared component likely does **not** pay off—flag as "merge likely not beneficial" unless the user confirms the differences are trivial.
- **Classify differences**: List what differs (copy, layout, props, behavior). For each material difference, note whether it can be **normalized** (one consistent behavior or prop) or is **intentional product variation**.

### 3. Ask the user when it matters

When differences are non-trivial and could be normalized in multiple ways:

- **Ask**: "These components differ in [X, Y, Z]. Are these differences intentional (different features/UX) or can we normalize to one behavior for consistency?"
- Use the answer to decide: one shared component with a clear API vs. keeping components separate or only extracting shared primitives (e.g. one shared sub-component).

### 4. Decide which shared components to implement

For each candidate merge:

- **Recommend implementing** when:
  - The shared component is meaningfully smaller than the sum of the originals (e.g. `B` clearly &lt; combined size), and
  - Differences are either small or can be normalized (with user confirmation), and
  - The shared component has a clear, narrow responsibility (no "kitchen sink" component).
- **Recommend against** when:
  - `B ≈` combined size of originals, or
  - Differences are important and hard to normalize without many variants, or
  - Merging would create one component with several unrelated behaviors.

### 5. Produce the audit deliverable

Output:

**1. Similarity matrix (or list)**

- Each component (with path and size).
- For each, list the component(s) it is "very similar to" and a one-line reason (e.g. "Same card layout and props, different title placement").

**2. Recommended shared components**

- **Name** and **one-sentence purpose**.
- **Consumers**: which existing components will be refactored to use it.
- **Estimated size** of the shared component vs. total size of current implementations.
- **Normalizations**: what behavior or API is unified (and any user-confirmed choices).

**3. Pairs/groups not recommended for merge**

- Component names and why (e.g. "Shared size would be ~90% of combined; little duplication saved" or "Different UX requirements; keep separate").

**4. Optional: shared primitives**

- If a full merge is not recommended but a small shared piece is (e.g. shared hook or sub-component), list it here with consumers and scope.

## Rule of thumb

- **Merge is likely not beneficial** when the new shared component would be almost as large as the sum of the components it replaces. Prefer asking the user whether the differences are important before recommending a merge in borderline cases.
- **Merge is beneficial** when there is clear duplication, the shared API is simple, and normalizing differences (with user input) still yields one coherent component.

## Summary checklist

Before finalizing the audit:

- [ ] Every "similar" pair/group has an explicit size comparison (shared vs. combined).
- [ ] Material differences are listed and tagged as "normalizable" or "intentional."
- [ ] User was asked about importance of differences where normalization is ambiguous.
- [ ] Recommended shared components are few and focused (no single component with many unrelated variants).
- [ ] Deliverable includes: similarity list, recommended shared components with consumers, and non-recommended pairs with reasons.
