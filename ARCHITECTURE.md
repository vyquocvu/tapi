# Project Architecture

## Overview

A fullstack web application demonstrating modern React development with TanStack ecosystem, Prisma ORM, SQLite database, and JWT-based authentication.

## Tech Stack

### Frontend
- **React 18** - UI library with latest features
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Data fetching and caching
- **TypeScript** - Full type safety
- **Vite** - Build tool and dev server

### Backend
- **Prisma** - Type-safe ORM
- **SQLite** - Database (local development)
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Vite Middleware** - API routes without separate server

### DevTools
- **TanStack Router DevTools** - Debug routing
- **TanStack Query DevTools** - Inspect cache and queries
- **Prisma Studio** - Database GUI

## Folder Structure

```
/tapi
├── prisma/
│   ├── schema.prisma        # Database schema (User, Post models)
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Database migration history
├── src/
│   ├── routes/
│   │   ├── __root.tsx       # Root layout with providers
│   │   ├── index.tsx        # Home page
│   │   ├── about.tsx        # About page
│   │   ├── login.tsx        # Login page
│   │   └── dashboard/
│   │       └── index.tsx    # Protected dashboard route
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── db/
│   │   └── prisma.ts        # Prisma client instance
│   ├── server/
│   │   ├── auth.ts          # JWT helpers (generate, verify tokens)
│   │   └── context.ts       # Request context helpers
│   ├── services/
│   │   ├── authService.ts   # Authentication business logic
│   │   └── postService.ts   # Post CRUD operations
│   └── lib/
│       ├── types.ts         # Shared TypeScript types
│       ├── http.ts          # HTTP client with auth headers
│       └── queryClient.ts   # TanStack Query configuration
├── .env.example             # Environment variables template
├── vite.config.ts           # Vite config with API middleware
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
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

### 3. API Layer

**Location:** `vite.config.ts` (Vite middleware)

API endpoints are implemented as Vite middleware:

- `POST /api/login` - User authentication
- `GET /api/posts` - Fetch all posts
- `GET /api/me` - Get current user (protected)
- `GET /api/health` - Health check

**Why Vite Middleware?**
- No separate server needed for development
- Fast hot module replacement
- Easy to migrate to dedicated server later

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

### Why SQLite for Development?

- **Zero configuration**: No database server to install
- **Fast setup**: File-based database
- **Easy migration**: Switch to PostgreSQL/MySQL for production
- **Version control friendly**: Can commit schema easily

### Why Vite Middleware for API?

- **Simplicity**: No separate server process
- **Development speed**: HMR for API changes
- **Easy migration**: Can extract to Express/Fastify later
- **Type sharing**: Use same TypeScript types for client and server

### Why Service Layer?

- **Separation of concerns**: Business logic separate from routes
- **Reusability**: Services can be used by multiple endpoints
- **Testability**: Easier to unit test business logic
- **Maintainability**: Clear organization of code

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

### Manual Testing
- Use Prisma Studio to inspect database
- Use TanStack DevTools to debug queries
- Use Router DevTools to inspect routes
- Test API with curl or Postman

### Future Improvements
- Add unit tests for services
- Add integration tests for API endpoints
- Add E2E tests with Playwright
- Add test database setup

## Deployment Considerations

### Development (Current)
- SQLite database
- Vite middleware for API
- Development mode secrets

### Production (Recommendations)
- **Database**: Switch to PostgreSQL or MySQL
- **Server**: Extract API to Express/Fastify
- **Secrets**: Use environment variables
- **Hosting**: Vercel, Netlify, or Node server
- **SSL/TLS**: Enable HTTPS
- **CORS**: Configure for production domains

## Migration Path to TanStack Start

This project uses TanStack Router (client-side) but can be migrated to TanStack Start (SSR framework) when stable:

1. Install `@tanstack/start`
2. Move API routes to `src/api/` directory
3. Add SSR configuration
4. Update build scripts
5. Add server-side rendering logic

The current architecture (services, Prisma, auth) will work seamlessly with TanStack Start.

## Conclusion

This architecture provides:
- ✅ Type safety throughout the stack
- ✅ Clear separation of concerns
- ✅ Scalable folder structure
- ✅ Security best practices
- ✅ Developer-friendly tooling
- ✅ Production-ready patterns

The project demonstrates a complete fullstack application while remaining simple enough for learning and experimentation.
