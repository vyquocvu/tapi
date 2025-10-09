# vstack

A fullstack web application built with **TanStack Start**, **TanStack Router**, **TanStack Query**, **Prisma**, and **SQLite**, demonstrating modern React development with type-safe routing, efficient data fetching, and JWT-based authentication.

**✨ Now with Vercel serverless deployment support!** See [Quick Start Guide](./VERCEL_QUICK_START.md) for deployment instructions.

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Key Features Explained](#-key-features-explained)
- [Testing the Application](#-testing-the-application)
- [Database Management](#️-database-management)
- [Deployment](#-deployment)
  - [Deploy to Vercel](#deploy-to-vercel) ⭐
  - [Deploy to Node Server](#deploy-to-node-server)
- [Tech Stack](#️-tech-stack)

## 🚀 Features

- **TanStack Router** - Type-safe file-based routing with protected routes
- **TanStack Query** - Powerful data fetching and caching
- **Prisma + SQLite** - Type-safe database access with local SQLite for development
- **JWT Authentication** - Secure authentication with JSON Web Tokens
- **Protected Routes** - Dashboard route with authentication guards
- **API Routes** - Built-in API endpoints via Vite middleware
- **TypeScript** - Full type safety throughout the stack
- **Vite** - Lightning-fast development experience
- **React 18** - Latest React features
- **DevTools** - Built-in Router and Query DevTools for debugging

## 📁 Project Structure

```
/vstack
├── prisma/
│   ├── schema.prisma        # Database schema (User, Post models)
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Database migrations
├── src/
│   ├── routes/
│   │   ├── __root.tsx       # Root layout with navigation and providers
│   │   ├── index.tsx        # Home page
│   │   ├── about.tsx        # About page
│   │   ├── login.tsx        # Login page
│   │   └── dashboard/
│   │       └── index.tsx    # Protected dashboard route
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── db/
│   │   └── prisma.ts        # Prisma client instance
│   ├── server/
│   │   ├── auth.ts          # JWT authentication helpers
│   │   └── context.ts       # Request context helpers
│   ├── services/
│   │   ├── authService.ts   # Authentication business logic
│   │   └── postService.ts   # Post business logic
│   └── lib/
│       ├── types.ts         # Shared TypeScript types
│       ├── http.ts          # HTTP client utility
│       └── queryClient.ts   # TanStack Query client config
├── .env.example             # Environment variables template
├── vite.config.ts           # Vite config with API middleware
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Data fetching and caching
- **TypeScript** - Type safety

### Backend
- **Prisma** - Type-safe ORM
- **SQLite** - Database (local development)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Vite Middleware** - API routes

### Build Tools
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type checking

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vstack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following variables:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations and seed the database
   npm run prisma:migrate
   
   # Or run all database setup at once
   npm run db:setup
   ```

## 🚀 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. The API endpoints are handled by Vite middleware directly, so there's no need to run a separate server.

### Demo Credentials

Use these credentials to log in:
- **Email:** `demo@user.com`
- **Password:** `password`

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run start
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed the database
- `npm run db:setup` - Complete database setup (generate + migrate + seed)

## 🎯 Key Features Explained

### 1. JWT-Based Authentication

The application uses JWT tokens for secure authentication:

- **Login Flow**: User submits credentials → Server validates against database → JWT token generated → Token stored in sessionStorage
- **Protected Routes**: Dashboard route checks for token before loading
- **API Security**: Token sent with API requests via Authorization header
- **Service Layer**: `authService.ts` handles login logic with bcrypt password verification

### 2. Protected Routes

The `/dashboard` route demonstrates route protection:

```typescript
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardComponent,
})
```

### 3. Database with Prisma + SQLite

- **Prisma Schema**: Defines `User` and `Post` models with relations
- **Type Safety**: Generated Prisma Client provides fully typed database access
- **Migrations**: Version-controlled database schema changes
- **Seeding**: Automatic creation of demo user and posts

### 4. API Routes via Vite Middleware

API endpoints are implemented in `vite.config.ts`:

- `POST /api/login` - User authentication
- `GET /api/posts` - Fetch all posts
- `GET /api/me` - Get current user (protected)
- `GET /api/health` - Health check

### 5. Type-Safe Data Fetching

TanStack Query provides automatic caching and state management:

```typescript
const { data: posts, isLoading, error } = useQuery<Post[]>({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

### 6. Service Layer Architecture

Business logic is separated into service modules:

- `authService.ts` - Authentication logic
- `postService.ts` - Post CRUD operations

This keeps routes and components clean and focused on presentation.

## 🧪 Testing the Application

### Test Login Flow

1. Navigate to `http://localhost:5173/login`
2. Enter credentials: `demo@user.com` / `password`
3. Click "Login"
4. You should be redirected to `/dashboard`
5. Dashboard should display user info and posts from database

### Test Protected Route

1. Open a new incognito/private browser window
2. Try to access `http://localhost:5173/dashboard` directly
3. You should be redirected to `/login`
4. After logging in, you'll be redirected back to `/dashboard`

### Test API Endpoints

You can test API endpoints directly:

```bash
# Health check
curl http://localhost:5173/api/health

# Login
curl -X POST http://localhost:5173/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'

# Get posts (requires token from login response)
curl http://localhost:5173/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🗄️ Database Management

### Prisma Studio

Open a GUI to view and edit your database:

```bash
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555`

### Creating Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

### Resetting the Database

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Run all migrations
4. Run the seed script

## 🚢 Deployment

> 🌟 **NEW**: Full Vercel serverless deployment support with dedicated API functions!

### Deploy to Vercel

This application is configured to work seamlessly with Vercel's serverless platform.

#### Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A production database (PostgreSQL recommended - use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres))

#### Step 1: Prepare Your Database

**Switch from SQLite to PostgreSQL** for production. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Set Up Environment Variables

In your Vercel project dashboard, add these environment variables:

- **`DATABASE_URL`** - Your PostgreSQL connection string
  ```
  postgresql://username:password@host:5432/database?schema=public
  ```
- **`JWT_SECRET`** - A strong random secret (at least 32 characters)
  ```bash
  # Generate a secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **`NODE_ENV`** - Set to `production`

#### Step 3: Deploy

**Option A: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Option B: Deploy via Git Integration**

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel dashboard
3. Vercel will automatically detect the configuration and deploy

#### Step 4: Run Database Migrations

After deployment, run migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed
```

Or use Vercel CLI:

```bash
vercel env pull .env.production
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
```

#### How It Works

The application uses **Vercel Serverless Functions** for the API:

- `/api/login.ts` - Handles user authentication
- `/api/posts.ts` - Fetches posts from database
- `/api/me.ts` - Returns authenticated user info
- `/api/health.ts` - Health check endpoint

The frontend is served as a static site with client-side routing via TanStack Router.

#### Troubleshooting Vercel Deployment

**Issue: API endpoints return 404**
- Ensure the `/api` directory exists in your repository
- Check that serverless functions have `.ts` extension
- Verify `vercel.json` configuration is present

**Issue: Database connection errors**
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure your database allows connections from Vercel's IP addresses
- Check that `prisma generate` ran successfully during build
- Run `npx prisma migrate deploy` to apply migrations

**Issue: JWT authentication fails**
- Verify `JWT_SECRET` environment variable is set
- Ensure the secret is the same across all deployments
- Check that the Authorization header is being sent correctly

**Logs and Debugging**
- View real-time logs: `vercel logs <deployment-url>`
- Check build logs in Vercel dashboard
- All API endpoints include detailed error logging for troubleshooting

**📖 For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**



### Deploy to Node Server

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production database**
   ```bash
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   ```

3. **Start the server**
   ```bash
   npm run start
   ```

### Environment Variables for Production

Make sure to set strong secrets in production:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="use-a-strong-random-secret-at-least-32-characters"
NODE_ENV="production"
```

## 📚 Architecture Overview

### Authentication Flow

```
1. User submits login form
2. POST /api/login with credentials
3. authService validates against Prisma database
4. bcrypt verifies password hash
5. JWT token generated with user info
6. Token returned to client
7. Client stores token in sessionStorage
8. Token sent with subsequent API requests
9. Server validates token for protected routes
```

### Data Flow

```
Client → TanStack Query → API Route → Service Layer → Prisma → SQLite
                                                              ↓
Client ← JSON Response ← Middleware ← Business Logic ← Query ← Database
```

### Route Protection

```
User navigates to /dashboard
        ↓
beforeLoad hook executes
        ↓
Check for auth token in sessionStorage
        ↓
Token exists? → Load dashboard
        ↓
No token? → Redirect to /login
```

## 🆚 TanStack Start vs Next.js

### TanStack Start (This Project)

**Pros:**
- Framework agnostic - works with any React setup
- More granular control over routing and data fetching
- Seamless TanStack Query integration
- Explicit data loading with loaders
- Type-safe routing with TypeScript
- Flexible SSR/SSG options

**Best for:**
- Teams already using TanStack libraries
- Projects requiring fine-grained control
- SPAs with optional SSR

### Next.js

**Pros:**
- More opinionated with strong conventions
- Larger ecosystem and community
- Built-in optimizations (Image, Font)
- Mature with extensive documentation
- Server Components (App Router)
- Optimized for Vercel deployment

**Best for:**
- Teams wanting rapid development
- Projects needing built-in features
- Full SSR/SSG from the start

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using TanStack ecosystem
