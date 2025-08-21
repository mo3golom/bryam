# Technology Stack

## Core Framework
- **SvelteKit 2.x** - Full-stack web framework with SSR
- **Svelte 5** - Component framework with runes
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Build tool and dev server

## Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **PostCSS** - CSS processing with autoprefixer
- **bits-ui** - Accessible component primitives

## Database & Backend
- **Supabase** - PostgreSQL database with real-time features
- **@supabase/supabase-js** - JavaScript client library
- **Node.js adapter** - Production deployment target

## Testing
- **Vitest** - Unit testing framework
- **@testing-library/svelte** - Component testing utilities
- **jsdom** - DOM environment for tests
- **happy-dom** - Alternative DOM implementation

## Development Tools
- **svelte-check** - TypeScript checking for Svelte
- **ESLint** (implied) - Code linting
- **Git** - Version control

## Common Commands

### Development
```bash
npm run dev          # Start development server with host binding
npm run dev -- --open # Start dev server and open browser
```

### Building & Deployment
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run check        # Type check with svelte-check
npm run check:watch  # Watch mode type checking
npm run prepare      # Sync SvelteKit (used in CI/CD)
```

### Testing
```bash
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once and exit
npm run test:ui      # Run tests with UI interface
```

## Environment Variables
Required environment variables (see `.env.example`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Build Configuration
- Uses `@sveltejs/adapter-node` for server deployment
- Vite preprocessing for Svelte components
- TypeScript strict mode enabled
- Module resolution set to "bundler"