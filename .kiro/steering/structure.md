# Project Structure

## Root Directory
```
├── src/                    # Source code
├── static/                 # Static assets (robots.txt, etc.)
├── migrations/             # Database migration files
├── .kiro/                  # Kiro configuration and specs
├── build/                  # Production build output
└── node_modules/           # Dependencies
```

## Source Code Organization (`src/`)

### Routes (`src/routes/`)
- **File-based routing** following SvelteKit conventions
- `+page.svelte` - Page components
- `+page.server.ts` - Server-side load functions
- `+layout.svelte` - Layout components
- `+layout.ts` - Layout load functions
- `+error.svelte` - Error boundary components

### Library Code (`src/lib/`)
```
src/lib/
├── components/             # Reusable Svelte components
├── server/                 # Server-only modules
├── stores/                 # Svelte stores for state management
├── utils/                  # Utility functions and helpers
└── types.ts               # TypeScript type definitions
```

### Component Organization
- **One component per file** with `.svelte` extension
- **Co-located tests** using `.test.ts` suffix
- **Descriptive naming** (e.g., `SongList.svelte`, `ErrorNotification.svelte`)
- **Export from components** for reusability

### Server Code (`src/lib/server/`)
- **Server-only modules** that don't get bundled for client
- Database clients and API integrations
- Server-side utilities and helpers

## Database Migrations (`migrations/`)
- **Sequential numbering** with format `NNN_description.sql`
- **PostgreSQL syntax** for all migrations
- **Idempotent operations** that can run multiple times safely
- **Single responsibility** - one change per migration

## Configuration Files
- `svelte.config.js` - SvelteKit configuration
- `vite.config.ts` - Vite build configuration  
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Naming Conventions
- **PascalCase** for components (`SongList.svelte`)
- **camelCase** for functions and variables
- **kebab-case** for file names and routes
- **SCREAMING_SNAKE_CASE** for environment variables
- **Descriptive names** that reflect purpose

## Import Patterns
- Use `$lib/` alias for library imports
- Use `$app/` for SvelteKit app imports
- Use `$env/` for environment variables
- Relative imports for same-directory files

## Testing Structure
- **Co-located tests** next to source files
- Test files use `.test.ts` or `.spec.ts` suffix
- Setup file at `src/test-setup.ts`
- Tests follow Arrange-Act-Assert pattern