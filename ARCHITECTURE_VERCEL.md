# Vercel Deployment Architecture

## Development vs Production Architecture

### Development (Local)

```
┌─────────────────────────────────────────────────────────┐
│                    Vite Dev Server                       │
│                   http://localhost:5173                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   React App      │         │  API Middleware  │     │
│  │  (Frontend)      │◄────────┤  vite.config.ts  │     │
│  │                  │         │                  │     │
│  │ • TanStack Router│         │ • /api/login     │     │
│  │ • TanStack Query │         │ • /api/posts     │     │
│  │ • React 18       │         │ • /api/me        │     │
│  └──────────────────┘         │ • /api/health    │     │
│                                └──────────────────┘     │
│                                         │                │
│                                         ▼                │
│                                ┌──────────────────┐     │
│                                │    Services      │     │
│                                │ authService.ts   │     │
│                                │ postService.ts   │     │
│                                └──────────────────┘     │
│                                         │                │
│                                         ▼                │
│                                ┌──────────────────┐     │
│                                │  Prisma + SQLite │     │
│                                │   (dev.db file)  │     │
│                                └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Production (Vercel)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel Platform                         │
│                    https://your-app.vercel.app                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │   Static Frontend (CDN)   │   │ Serverless API Functions  │
    │                           │   │                           │
    │  • React App (built)      │   │  /api/login.ts            │
    │  • TanStack Router        │   │  /api/posts.ts            │
    │  • TanStack Query         │   │  /api/me.ts               │
    │  • All static assets      │   │  /api/health.ts           │
    │                           │   │                           │
    │  Served from:             │   │  Each function is an      │
    │  /dist directory          │   │  isolated serverless      │
    │                           │   │  Node.js instance         │
    └───────────────────────────┘   └───────────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │      Services         │
                                    │  (shared code)        │
                                    │  • authService.ts     │
                                    │  • postService.ts     │
                                    │  • auth.ts (JWT)      │
                                    │  • context.ts         │
                                    └───────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  PostgreSQL Database  │
                                    │  (Neon/Supabase/etc)  │
                                    │                       │
                                    │  Prisma ORM           │
                                    └───────────────────────┘
```

## Request Flow

### Frontend Request (SPA Routing)

```
User visits /dashboard
        │
        ▼
Vercel Edge Network
        │
        ▼
Check vercel.json rewrites
        │
        ▼
Serve /dist/index.html (Static)
        │
        ▼
React loads & TanStack Router handles /dashboard
```

### API Request Flow

```
Browser makes request to /api/login
        │
        ▼
Vercel Edge Network
        │
        ▼
Check vercel.json rewrites → /api/login
        │
        ▼
Invoke /api/login.ts serverless function
        │
        ├─→ Parse request body
        ├─→ Import authService
        ├─→ Validate credentials
        ├─→ Query PostgreSQL via Prisma
        ├─→ Generate JWT token
        └─→ Return JSON response
        │
        ▼
Response sent to browser
```

## File Structure Mapping

```
Local Repository          →    Vercel Deployment
═══════════════════════════════════════════════════════════

/src/routes/              →    /dist/index.html
  - index.tsx                  (Static React app)
  - login.tsx                  All routes handled
  - dashboard/                 by TanStack Router
    - index.tsx                client-side

/api/                     →    Serverless Functions
  - login.ts                   Each file becomes an
  - posts.ts                   isolated function:
  - me.ts                      /api/login
  - health.ts                  /api/posts
                               /api/me
                               /api/health

/src/services/            →    Bundled with functions
  - authService.ts             Shared code imported
  - postService.ts             by serverless functions

/src/server/              →    Bundled with functions
  - auth.ts                    JWT utilities
  - context.ts                 Request context

prisma/                   →    Used during build
  - schema.prisma              Generates Prisma Client
  - migrations/                Applied post-deployment
```

## Environment Variables Flow

```
Local Development:
.env file → process.env → Application

Vercel Production:
Vercel Dashboard → Environment Variables → Serverless Functions
                                         ↓
                                    process.env
```

## Cold Start Behavior

```
First Request to Function:
User Request → Vercel spins up container → Load Node.js runtime
                                         → Import dependencies
                                         → Initialize Prisma
                                         → Execute function
                                         → Return response
                                         (2-5 seconds)

Subsequent Requests (Warm):
User Request → Use existing container → Execute function → Response
                                      (50-200ms)
```

## Database Connection Pooling

```
Without Pooling (❌ Not recommended):
Each function → New DB connection → Query → Close connection
(Slow, can exhaust connections)

With Pooling (✅ Recommended):
Each function → Connection pool → Reuse connection → Query
(Fast, efficient)

Implementation:
- Use Neon/Supabase connection pooling URLs
- Prisma singleton pattern (already implemented in src/db/prisma.ts)
```

## Deployment Process

```
1. Push to GitHub
        ↓
2. Vercel detects changes
        ↓
3. Build Process:
   ├─→ npm install
   ├─→ npm run build (tsc + vite build)
   ├─→ npx prisma generate
   └─→ Create serverless function bundles
        ↓
4. Deploy:
   ├─→ Upload static files to CDN
   ├─→ Deploy serverless functions
   └─→ Update edge network routing
        ↓
5. Live at https://your-app.vercel.app
        ↓
6. Post-deployment:
   └─→ Run: npx prisma migrate deploy
```

## Scaling

```
Vercel Automatic Scaling:

Low Traffic:
Frontend (CDN) → Always available
API Functions  → Minimal instances (cold starts possible)

High Traffic:
Frontend (CDN) → Always available (global CDN)
API Functions  → Auto-scale to 100s of instances
                → No configuration needed
                → Pay per execution

Database:
PostgreSQL provider handles scaling
- Neon: Auto-scaling compute
- Supabase: Connection pooling
- Vercel Postgres: Managed scaling
```

## Error Handling Flow

```
Error occurs in serverless function
        ↓
Caught by try-catch block
        ↓
Logged with context:
- console.error('[API /endpoint] Error message')
- Includes request details
- Stack trace
        ↓
Return JSON error response:
{
  success: false,
  error: "User-friendly message",
  details: "Technical details"
}
        ↓
Frontend catches error
        ↓
Display to user or retry
```

## Monitoring Architecture

```
Vercel Dashboard:
├─→ Build Logs (deployment issues)
├─→ Function Logs (runtime errors)
├─→ Analytics (traffic, performance)
└─→ Deployment History (rollback)

CLI Monitoring:
vercel logs <url> --follow
        ↓
Real-time function execution logs
with our custom logging format:
[API /endpoint] Action: details
```

## Security Layers

```
1. Edge Network (Vercel)
   ├─→ DDoS protection
   ├─→ SSL/TLS encryption
   └─→ Rate limiting (Pro plan)

2. API Layer (Serverless Functions)
   ├─→ CORS headers
   ├─→ Request validation
   └─→ JWT verification

3. Database Layer
   ├─→ Connection encryption
   ├─→ Environment variable secrets
   └─→ Prisma parameterized queries

4. Application Layer
   ├─→ Password hashing (bcrypt)
   ├─→ JWT tokens
   └─→ Protected routes
```

---

**Legend:**
- `→` Flow direction
- `├─→` Branch/parallel flow
- `▼` Vertical flow
- `↓` Sequential step
- ✅ Recommended
- ❌ Not recommended
