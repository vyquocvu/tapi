# Copilot Instructions for vstack

## Project Overview
vstack is a fullstack web application showcasing the TanStack ecosystem (Router, Query) with Prisma ORM, JWT authentication, and a Content Type Builder inspired by Strapi. It supports multiple runtime environments: development (Vite), Node.js server, and Vercel serverless.

## Key Architecture Patterns

### Runtime Environment System
The project uses a `RUNTIME` environment variable to determine deployment target:
- `dev` - Vite development server with middleware (default)
- `node` - Express production server (`server/index.ts`)
- `vercel` - Serverless functions in `/api` directory

Use `npm start` (reads `RUNTIME` from `.env`) or specific scripts: `npm run start:node`, `npm run start:vercel`.

### API Layer Structure
**Development/Node.js**: API routes handled by Vite middleware in `vite.config.ts` using dynamic imports
**Vercel**: Separate serverless functions in `/api` directory (e.g., `api/login.ts`)

Both implementations share the same service layer (`src/services/`) for business logic.

### Content Type Builder System
Core feature allowing JSON/TypeScript-defined database models with automatic Prisma schema generation:
- Define content types in `content-types/definitions.json`
- Use `npm run content-type:generate` for manual generation
- Development mode auto-watches and regenerates schemas
- Migration tracking in `content-types/migrations/`

### Authentication Flow
JWT-based authentication with sessionStorage:
1. Login via `authService.loginUser()` → JWT token
2. Token stored in sessionStorage, sent via Authorization header
3. Protected routes use `beforeLoad` hooks with redirect
4. Context restoration on app load via `/api/me` endpoint

## Development Workflows

### Database Management
```bash
npm run db:setup          # Complete setup (generate + migrate + seed)
npm run prisma:migrate     # Run migrations only
npm run prisma:studio      # Open database GUI
```

### Content Type Development
```bash
npm run dev                # Starts with auto content-type watching
cp content-types/examples/blog-example.json content-types/definitions.json
# Schema auto-generates, then run: npm run prisma:migrate
```

### Environment-Specific Development
```bash
# Set in .env: RUNTIME=dev|node|vercel
npm start                  # Starts based on RUNTIME variable
npm run start:node         # Force Node.js server mode
```

## File Organization Conventions

### Route Structure (TanStack Router)
- `src/routes/__root.tsx` - Root layout with providers (Auth, Query)
- File-based routing with protected routes using `beforeLoad` hooks
- Navigation state managed in root component with `useAuth()` context

### Service Layer Pattern
- `src/services/` - Business logic (auth, posts)
- `src/server/` - Utilities (JWT helpers, context)
- `src/lib/` - Shared utilities (HTTP client, types)

### Prisma Integration
- Schema at `prisma/schema.prisma` (may be auto-generated)
- Client instance in `src/db/prisma.ts`
- Seed script with demo data: `prisma/seed.ts`

## Key Files and Their Roles

- `vite.config.ts` - Dev server API middleware + content-type watcher plugin
- `scripts/start.mjs` - Runtime environment dispatcher
- `src/contexts/AuthContext.tsx` - JWT session management
- `content-types/definitions.json` - Active content type definitions
- `api/` directory - Vercel serverless functions (production alternative to Vite middleware)
- `server/index.ts` - Express server for Node.js deployment

## Integration Points

### TanStack Query Configuration
Global config in `__root.tsx` with 5min staleTime, 10min gcTime for efficient caching.

### Cross-Environment API Compatibility
Services use relative paths (`/api/*`) that work across all runtime environments through routing configuration.

### Content Type Schema Generation
Triggered by file watching in dev mode or manual commands, outputs to `prisma/schema.prisma` with migration tracking.