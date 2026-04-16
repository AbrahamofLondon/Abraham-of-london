# Design Migration Control Pack

This directory is the source of truth for the Abraham of London federated-surfaces rebuild.

It exists to constrain implementation drift. Any external agent or contributor working on the migration must treat these files as the governing brief unless a newer repo file explicitly supersedes them.

## Purpose

The migration is not a decorative redesign. It is a controlled rebuild of the platform's design system so that every surface becomes:

- legible
- stable
- premium without theatrical excess
- structurally consistent
- easier to extend without regression

The project must move from loosely related page-level styling toward:

1. foundation tokens
2. semantic tokens
3. surface contracts
4. tightly controlled primitives
5. thin composed surface-specific components

## What this pack governs

This pack governs:

- design-system architecture
- contrast rules
- gradient discipline
- surface identity rules
- component strategy
- migration order
- banned implementation patterns

This pack does **not** by itself authorize a destructive rewrite.

## Non-negotiable implementation stance

Do not attempt a one-shot redesign.

Do not replace the whole site at once.

Do not introduce a universal `ContentCard` abstraction that tries to solve every surface with one switch-heavy component.

Do not delete legacy systems before pilots are verified.

## Required migration model

The correct model is:

- one foundation design system
- one semantic token layer
- a small family of primitives
- thin surface compositions
- phased migration with rollback safety

## Required pilot-first sequence

The first implementation targets are:

1. foundation token layer
2. semantic token layer
3. CSS variable bridge
4. primitive components
5. Canon pilot
6. Vault pilot

No broader migration is authorized before Canon and Vault both pass review.

## Relationship to the existing repo

Existing components, layouts, and styling may contain hidden business logic, metadata assumptions, and one-off behavior. Treat them as live dependencies until replacements are verified.

The migration must be executed in parallel, not as blind deletion.

## Required output from any agent

Any agent working from this directory must return:

- changed files
- local verification notes
- unresolved risks/blockers
- no commit unless explicitly instructed
- no push unless explicitly instructed
- no deploy unless explicitly instructed

## File index

- `00-README.md` — control overview
- `01-principles.md` — governing design and architecture principles
- `02-surface-contracts.ts` — typed surface definitions and visual behavior contracts
- `03-token-model.ts` — foundation and semantic token model
- `04-component-map.md` — primitive/composition strategy and replacement map
- `05-migration-order.md` — execution phases and acceptance gates
- `06-ban-list.md` — forbidden patterns and anti-drift rules

## Operating instruction for external agents

Use the files in this directory as the migration brief. Do not infer architecture from scratch. Do not expand scope beyond the phases defined here. Implement in stages. Return for review after the pilot surfaces unless explicitly told to continue.
