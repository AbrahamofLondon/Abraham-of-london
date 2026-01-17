# Hybrid Migration Strategy

## Current Structure
- **Pages Router**: All existing pages (`pages/`) and APIs (`pages/api/`)
- **App Router**: Experimental features (`app/`)

## Migration Path
1. Keep all existing functionality in Pages Router
2. New features can use App Router
3. APIs stay in Pages Router for now
4. Complex pages can be migrated to App Router incrementally

## URL Structure
- `/api/*` → Pages Router APIs (v1)
- `/api/v2/*` → App Router APIs
- `/app/*` → App Router pages (optional prefix)
- `/*` → Pages Router pages

## Build Command
Works with both routers simultaneously.