# Project Architecture

## Overview

tapi is a production-ready serverless CMS platform built with the TanStack ecosystem, Prisma ORM, and JWT authentication. Unlike traditional CMS platforms that require dedicated servers, tapi operates entirely serverless - deployable to Vercel, AWS, Azure, GCP, or any Node.js environment without server infrastructure management.

## Tech Stack

### Frontend
- **React 18** - UI library with latest features
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Data fetching and caching
- **TypeScript** - Full type safety
- **Vite** - Build tool and dev server

### Backend
- **Prisma** - Type-safe ORM with PostgreSQL/MySQL/SQLite support
- **PostgreSQL** - Production database (SQLite for local development)
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Serverless Architecture** - No dedicated server required
- **Multi-Runtime Support** - Vite dev server, Vercel serverless, Node.js Express

### DevTools
- **TanStack Router DevTools** - Debug routing
- **TanStack Query DevTools** - Inspect cache and queries
- **Prisma Studio** - Database GUI

## Folder Structure

```
/tapi
├── prisma/
│   ├── schema.prisma        # Database schema (auto-generated from content types)
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Database migration history
├── api/                     # Vercel serverless functions (production)
│   ├── login.ts             # Authentication endpoint
│   ├── content.ts           # Content Manager API
│   ├── content-types.ts     # Content Type Builder API
│   ├── media.ts             # Media Manager API
│   └── me.ts                # User info endpoint
├── server/
│   └── index.ts             # Node.js Express server (optional traditional hosting)
├── src/
│   ├── routes/
│   │   ├── __root.tsx       # Root layout with providers
│   │   ├── index.tsx        # Home page
│   │   ├── login.tsx        # Login page
│   │   └── dashboard/       # Protected CMS dashboard
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── db/
│   │   └── prisma.ts        # Prisma client instance
│   ├── server/
│   │   ├── auth.ts          # JWT helpers (generate, verify tokens)
│   │   └── context.ts       # Request context helpers
│   ├── services/
│   │   ├── authService.ts           # Authentication business logic
│   │   ├── contentManagerService.ts # Dynamic CRUD for all content
│   │   ├── contentTypeService.ts    # Content type management
│   │   └── mediaService.ts          # Multi-provider media storage
│   ├── storage/             # Storage provider implementations
│   │   ├── local.ts         # Local file storage
│   │   ├── s3.ts            # AWS S3 storage
│   │   └── gcs.ts           # Google Cloud Storage
│   ├── middleware/          # API middleware (validation, auth)
│   ├── plugins/             # Plugin system and extensions
│   └── lib/
│       ├── types.ts         # Shared TypeScript types
│       ├── http.ts          # HTTP client with auth headers
│       └── queryClient.ts   # TanStack Query configuration
├── content-types/
│   ├── definitions.json     # Content type definitions (like Strapi)
│   ├── examples/            # Example content types
│   └── migrations/          # Content type migration history
├── .env.example             # Environment variables template
├── vite.config.ts           # Vite config with dev API middleware
├── vercel.json              # Vercel serverless configuration
└── package.json             # Dependencies and scripts
```

## Architecture Layers

### 1. Presentation Layer (Routes & Components)

**Location:** `src/routes/`

- File-based routing with TanStack Router
- Each route file exports a Route configuration
- Components handle UI rendering and user interactions
- Use TanStack Query hooks for data fetching

**Example:**
```typescript
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    // Route guard logic
  },
  component: DashboardComponent,
})
```

### 2. State Management

**Location:** `src/contexts/`

- **AuthContext**: Global authentication state
- Session token management
- Login/logout functionality
- User information

### 3. API Layer (Multi-Runtime)

**Locations:** 
- `vite.config.ts` - Development middleware
- `api/` - Vercel serverless functions
- `server/index.ts` - Node.js Express server

API endpoints available across all runtime environments:

- `POST /api/login` - User authentication
- `GET /api/content` - Dynamic content manager (CRUD for all content types)
- `GET /api/content-types` - Content type definitions
- `POST /api/media` - Multi-provider media upload
- `GET /api/posts` - Posts API
- `GET /api/me` - Current user info (protected)
- `GET /api/health` - Health check

**Why Multi-Runtime?**
- **Serverless-First**: Deploy without servers (Vercel, AWS Lambda)
- **Flexibility**: Traditional hosting available when needed
- **Development Speed**: Vite HMR for rapid development
- **Production-Ready**: Battle-tested across all major platforms

### 4. Service Layer

**Location:** `src/services/`

Business logic separated from routes and API endpoints:

- **authService.ts**: Login validation, password verification
- **postService.ts**: Post CRUD operations

**Benefits:**
- Reusable business logic
- Easier to test
- Clean separation of concerns
- Can be used by multiple API endpoints

### 5. Data Access Layer

**Location:** `src/db/`

- **Prisma Client**: Type-safe database access
- Singleton pattern to prevent multiple instances
- Automatic connection management

### 6. Server Utilities

**Location:** `src/server/`

Server-side helper functions:

- **auth.ts**: JWT token generation and verification
- **context.ts**: Request context creation, authentication checks

### 7. Shared Utilities

**Location:** `src/lib/`

- **types.ts**: Shared TypeScript interfaces
- **http.ts**: HTTP client with automatic auth headers
- **queryClient.ts**: TanStack Query configuration

## Data Flow

### Authentication Flow

```
User Form Input
    ↓
AuthContext.login()
    ↓
POST /api/login
    ↓
authService.loginUser()
    ↓
Prisma → SQLite (verify user)
    ↓
bcrypt.compare(password)
    ↓
generateToken() → JWT
    ↓
Response with token
    ↓
Store in sessionStorage
    ↓
Include in subsequent requests
```

### Protected Route Flow

```
Navigate to /dashboard
    ↓
beforeLoad hook
    ↓
Check sessionStorage for token
    ↓
Token exists? 
    ├─ Yes → Load component
    └─ No → Redirect to /login
```

### Data Fetching Flow

```
Component renders
    ↓
useQuery hook
    ↓
Check TanStack Query cache
    ↓
Cache hit? 
    ├─ Yes → Return cached data
    └─ No → Fetch from API
            ↓
        GET /api/posts
            ↓
        postService.getAllPosts()
            ↓
        Prisma query → SQLite
            ↓
        Return data
            ↓
        Cache in TanStack Query
            ↓
        Update component
```

## Security Features

### 1. Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Never store plain-text passwords
- Password verification on server-side only

### 2. JWT Authentication
- Tokens signed with secret key
- 7-day expiration
- Stored in sessionStorage (cleared on logout)
- Sent via Authorization header

### 3. Route Protection
- `beforeLoad` guards prevent unauthorized access
- Automatic redirect to login page
- Token verification on protected API endpoints

### 4. Type Safety
- TypeScript throughout the stack
- Prisma generates types from schema
- TanStack Router generates route types
- Compile-time error catching

## Database Schema

### User Model
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   # Hashed
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}
```

### Post Model
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
```

## Key Design Decisions

### Why Multiple Database Support?

- **SQLite for Development**: Zero configuration, fast setup, file-based
- **PostgreSQL for Production**: Robust, scalable, serverless-compatible (Neon, Supabase, Vercel Postgres)
- **MySQL Support**: Enterprise compatibility
- **Seamless Migration**: Switch databases without code changes
- **Serverless-Optimized**: Connection pooling and efficient resource usage

### Why Serverless-First Architecture?

- **No Server Management**: Deploy without infrastructure setup
- **Auto-Scaling**: Automatically handles traffic spikes
- **Cost-Efficient**: Pay only for actual usage
- **Multiple Runtime Options**: 
  - Vite middleware (development)
  - Vercel serverless functions (production serverless)
  - Node.js Express (traditional hosting if needed)
- **Type Sharing**: Same TypeScript types across all runtimes

### Why Service Layer?

- **Runtime Independence**: Same business logic across Vite, Vercel, and Node.js
- **Separation of Concerns**: Business logic isolated from API routing
- **Reusability**: Services shared across multiple endpoints and runtimes
- **Testability**: Comprehensive unit testing of core functionality
- **Maintainability**: Clear, organized, production-grade code structure

### Why TanStack Router over React Router?

- **Type safety**: Full TypeScript support for routes and params
- **File-based routing**: Automatic route generation
- **Loaders**: Built-in data fetching pattern
- **DevTools**: Powerful debugging capabilities
- **TanStack ecosystem**: Seamless Query integration

### Why TanStack Query?

- **Automatic caching**: Reduces API calls
- **Background refetching**: Keeps data fresh
- **Loading states**: Built-in loading/error handling
- **DevTools**: Inspect cache and queries
- **Optimistic updates**: Better UX for mutations

## Development Workflow

### 1. Database Changes

```bash
# Edit prisma/schema.prisma
npm run prisma:migrate  # Create and apply migration
npm run prisma:generate # Regenerate Prisma Client
```

### 2. Adding Routes

```bash
# Create file: src/routes/my-route.tsx
# TanStack Router plugin auto-generates route
npm run dev  # Route tree regenerated automatically
```

### 3. Adding API Endpoints

Edit `vite.config.ts` and add middleware handler:

```typescript
if (req.url === '/my-endpoint' && req.method === 'GET') {
  // Handle request
  res.end(JSON.stringify({ data: ... }))
  return
}
```

### 4. Adding Services

Create file in `src/services/` with business logic:

```typescript
export async function myService() {
  const data = await prisma.model.findMany()
  return data
}
```

## Testing Strategy

### Automated Testing
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow validation with Playwright
- **Type Checking**: Compile-time validation with TypeScript

### Development Tools
- **Prisma Studio**: Database inspection and management
- **TanStack DevTools**: Query and route debugging
- **Vitest**: Fast unit and integration testing
- **Playwright**: Reliable E2E testing

## Deployment Architecture

### Development (Local)
- **Database**: SQLite for fast local development
- **Runtime**: Vite dev server with API middleware
- **Hot Reload**: Instant updates for code changes
- **DevTools**: Full debugging capabilities

### Production (Serverless - Vercel)
- **Database**: PostgreSQL (Neon, Supabase, Vercel Postgres)
- **Runtime**: Vercel serverless functions
- **Auto-Scaling**: Automatic traffic handling
- **Edge Network**: Global CDN distribution
- **Zero Config**: No server setup required

### Production (Node.js Server)
- **Database**: PostgreSQL or MySQL
- **Runtime**: Express.js server
- **Hosting**: AWS, Azure, GCP, DigitalOcean, any VPS
- **Process Management**: PM2 or systemd
- **Flexible**: Traditional hosting when needed

## Future Extensibility

### Framework Compatibility

tapi's service layer architecture ensures compatibility with future frameworks:

- **Current**: TanStack Router with multiple runtime options
- **Future-Ready**: Architecture supports migration to TanStack Start (SSR) when needed
- **Framework Agnostic**: Core services work with any frontend or backend framework
- **API Standards**: RESTful APIs work with any client technology

## Conclusion

This serverless CMS architecture provides:
- ✅ **Production-Ready**: Enterprise-grade CMS platform
- ✅ **Serverless-First**: No server infrastructure to manage
- ✅ **Type Safety**: Full TypeScript throughout the stack
- ✅ **Scalable**: Auto-scaling serverless architecture
- ✅ **Secure**: JWT authentication, bcrypt hashing, input validation
- ✅ **Flexible**: Deploy anywhere - Vercel, AWS, Azure, GCP, or Node.js
- ✅ **Developer Experience**: Hot reload, DevTools, comprehensive tooling
- ✅ **CMS Features**: Content Type Builder, Content Manager, Media Manager
- ✅ **API-First**: RESTful API with complete CRUD operations
- ✅ **Extensible**: Plugin system for custom functionality

tapi delivers the full power of a headless CMS like Strapi, without the complexity of managing servers.
