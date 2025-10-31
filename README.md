# vstack

A serverless CMS and fullstack web application built with **TanStack Start**, **TanStack Router**, **TanStack Query**, **Prisma**, and **SQLite**, demonstrating modern React development with type-safe routing, efficient data fetching, JWT-based authentication, and a Strapi-inspired content type builder.

**✨ Deploy anywhere!** Run on **Vercel** (serverless), **any cloud provider** (AWS, Azure, GCP), or your own **Node.js server**. See [Quick Start Guide](./VERCEL_QUICK_START.md) for deployment instructions.

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Key Features Explained](#-key-features-explained)
- [Testing the Application](#-testing-the-application)
- [Database Management](#️-database-management)
- [Deployment](#-deployment)
  - [Deploy to Vercel (Serverless)](#deploy-to-vercel-serverless) ⭐
  - [Deploy to Any Cloud (Node.js Server)](#deploy-to-any-cloud-nodejs-server) ☁️
- [Tech Stack](#️-tech-stack)


## Environment Variables

```
DATABASE_URL=
DATABASE_PROVIDER=postgresql
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5173
NODE_ENV=development
RUNTIME=dev

# Storage Configuration
STORAGE_PROVIDER=local  # Options: local, s3, gcs
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:5173

# For S3: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
# For GCS: GCS_PROJECT_ID, GCS_BUCKET, GCS_KEY_FILE
```

### DATABASE_PROVIDER
Specifies the database provider for Prisma. Example values: `sqlite`, `postgresql`, `mysql`.
Make sure this matches your migration history and database setup.

### STORAGE_PROVIDER
Specifies the storage backend for media files. Options: `local`, `s3`, `gcs`.
See [MEDIA_MANAGER.md](./MEDIA_MANAGER.md) for detailed configuration.

- **TanStack Router** - Type-safe file-based routing with protected routes
- **TanStack Query** - Powerful data fetching and caching
- **Prisma + PostgreSQL** - Type-safe database access with PostgreSQL
- **Enhanced CMS** - Complete content management system with:
  - **Content Type Builder** - Strapi-inspired content type builder with automatic Prisma schema generation
  - **Content Manager** - Dynamic CRUD API for managing content entries of any type
  - **Media Manager** - Multi-provider file storage system (Local, S3, GCS) with upload, delete, and preview
  - **Content Metadata** - SEO and metadata management for any content type
  - **Content Revisions** - Full audit trail and version history
  - **Content Tags** - Flexible tagging system with visual categorization
  - **Content Relations** - Generic relationships between any content items
- **Enhanced REST API** - Comprehensive REST API with validation, standardized responses, and error handling
- **API Controller Dashboard** - Comprehensive REST API management and monitoring interface
- **Plugin System** - Extensible plugin architecture for customizing and extending core functionality
  - **Lifecycle Hooks** - onRegister, onBeforeRequest, onAfterRequest, onError hooks
  - **Middleware Support** - Express-style middleware with priority-based execution
  - **Route Matching** - Apply plugins to specific routes with wildcard support
  - **Example Plugins** - Logger, performance monitor, request ID, response transformer
- **JWT Authentication** - Secure authentication with JSON Web Tokens
- **Input Validation** - Robust validation middleware for all API endpoints
- **Rate Limiting** - Built-in rate limiting support for API protection
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
│   ├── schema.prisma        # Database schema (auto-generated from content types)
│   ├── schema.original.prisma # Base system schema (User, Post, CMS tables)
│   ├── seed.ts              # Database seeding script with CMS examples
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
│   │   ├── postService.ts   # Post business logic
│   │   ├── contentTypeService.ts   # Content type definitions management
│   │   ├── contentManagerService.ts   # Content entries CRUD operations
│   │   └── mediaService.ts  # Media file management service
│   ├── storage/
│   │   ├── types.ts         # Storage provider interface
│   │   ├── index.ts         # Storage provider factory
│   │   └── providers/
│   │       ├── local.ts     # Local filesystem provider
│   │       ├── s3.ts        # AWS S3 provider
│   │       └── gcs.ts       # Google Cloud Storage provider
│   ├── middleware/
│   │   ├── validation.ts    # Input validation utilities
│   │   ├── rateLimit.ts     # Rate limiting middleware
│   │   ├── authorization.ts # Authorization middleware
│   │   └── permissionEnforcement.ts # Permission enforcement
│   ├── lib/
│   │   ├── types.ts         # Shared TypeScript types
│   │   ├── http.ts          # HTTP client utility
│   │   ├── queryClient.ts   # TanStack Query client config
│   │   └── plugin-system/   # Extensible plugin system
│   │       ├── types.ts     # Plugin type definitions
│   │       ├── registry.ts  # Plugin registration & management
│   │       ├── executor.ts  # Plugin execution engine
│   │       └── index.ts     # Main export
│   ├── plugins/
│   │   ├── examples/        # Example plugins
│   │   │   ├── logger.ts              # Request logging plugin
│   │   │   ├── request-id.ts          # Request ID plugin
│   │   │   ├── performance-monitor.ts # Performance monitoring
│   │   │   └── response-transformer.ts # Response transformation
│   │   └── templates/       # Plugin & middleware templates
│   │       ├── plugin-template.ts     # Plugin starter template
│   │       └── middleware-template.ts # Middleware starter template
├── api/
│   ├── content.ts           # Content Manager API endpoints
│   ├── content-types.ts     # Content Type Builder endpoints
│   ├── media.ts             # Media Manager API endpoints
│   ├── login.ts             # Authentication endpoint
│   └── api-dashboard.ts     # API Dashboard endpoints
├── docs/
│   ├── CMS_DATABASE_STRUCTURE.md       # Complete CMS database reference
│   ├── CMS_IMPROVEMENTS.md             # CMS features and usage guide
│   ├── PLUGIN_SYSTEM_ARCHITECTURE.md   # Plugin system architecture
│   ├── PLUGIN_DEVELOPMENT_GUIDE.md     # How to create plugins
│   ├── MIDDLEWARE_GUIDE.md             # Middleware development guide
│   └── PLUGIN_API_REFERENCE.md         # Complete API reference
├── examples/
│   └── plugin-integration-example.ts   # Plugin integration examples
├── tests/
│   └── api-validation.test.ts  # API validation tests
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

> 🌟 **NEW**: Configure your runtime environment in `.env` file! Run on Node.js server or deploy to Vercel by setting the `RUNTIME` variable.

### Quick Start - Configure Your Environment

Set the `RUNTIME` environment variable in your `.env` file:

```env
# Choose one of: dev (default), node, vercel
RUNTIME=dev
```

Then start the application:

```bash
npm start
```

**Or use convenience scripts:**

```bash
# Run on Node.js server (production)
npm run start:node

# Deploy to Vercel (serverless)
npm run start:vercel

# Start development server (Vite)
npm run dev
```

📖 **For detailed environment documentation, see [RUN_ENVIRONMENTS.md](./RUN_ENVIRONMENTS.md)**

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

Run the production build (runtime determined by `RUNTIME` env variable):

```bash
npm start
```

### Available Scripts

- `npm start` - **Start application (runtime based on RUNTIME env variable)**
- `npm run start:node` - **Run on Node.js server**
- `npm run start:vercel` - **Deploy to Vercel**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed the database
- `npm run db:setup` - Complete database setup (generate + migrate + seed)
- `npm run content-type:generate` - Generate Prisma schema from content type definitions (manual)
- `npm run content-type:watch` - Watch content types and auto-generate schemas (standalone)
- `npm run content-type:test` - Test the content type builder functionality

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

### 4. Enhanced CMS Features

The vstack CMS provides a complete content management system with enterprise-grade features:

#### Content Type Builder

Define database models using JSON or TypeScript and automatically generate Prisma schemas - **just like Strapi**:

- **Auto-generation in dev mode**: Schemas regenerate automatically when you save changes
- **Define content types** in `content-types/definitions.json`
- **Multiple field types**: strings, numbers, dates, relations, enums, JSON
- **Relationship support**: one-to-one, one-to-many, many-to-one, many-to-many
- **Migration tracking**: Track and manage schema changes

Quick example:
```bash
# Start dev server (includes auto-generation watcher)
npm run dev

# In another terminal, use the blog example
cp content-types/examples/blog-example.json content-types/definitions.json

# Schema is automatically generated! Apply to database:
npm run prisma:migrate
```

#### CMS Metadata System

Add SEO and metadata to any content type:

- **SEO Optimization**: Meta titles, descriptions, keywords
- **Social Sharing**: Open Graph metadata for Twitter, Facebook, etc.
- **Custom Metadata**: Flexible JSON field for any custom data
- **Per-Content**: One metadata record per content item

```typescript
// Add SEO metadata to an article
await prisma.contentMetadata.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    metaTitle: 'Best TypeScript Practices',
    metaDescription: 'Learn TypeScript best practices',
    customData: { readingTime: '8 min' }
  }
})
```

#### Content Revisions & Audit Trail

Track all changes with complete version history:

- **Full History**: Every content change is tracked
- **Snapshots**: Complete content snapshots as JSON
- **Change Logs**: Optional descriptions of what changed
- **User Tracking**: Know who made each change
- **Rollback**: Restore previous versions

```typescript
// Create a revision on content update
await prisma.contentRevision.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    revisionNumber: 5,
    data: articleSnapshot,
    changeLog: 'Updated title and added examples'
  }
})
```

#### Flexible Tagging System

Categorize and filter content with tags:

- **Reusable Tags**: Create tags once, use anywhere
- **Visual Categorization**: Color-coded tags for UI
- **Multi-Tag Support**: Tag content with multiple tags
- **Cross-Content**: Works with any content type

```typescript
// Tag an article as "featured"
await prisma.contentTagRelation.create({
  data: {
    tagId: featuredTag.id,
    contentType: 'api::article.article',
    contentId: articleId
  }
})
```

#### Content Relationships

Create relationships between any content items:

- **Generic Relations**: Link any content types together
- **Named Types**: "related", "parent", "child", etc.
- **Bidirectional**: Set up two-way relationships
- **Cross-Type**: Article → Product, Page → Section, etc.

```typescript
// Create "related articles" relationship
await prisma.contentRelation.create({
  data: {
    sourceType: 'api::article.article',
    sourceId: article1.id,
    targetType: 'api::article.article',
    targetId: article2.id,
    relationType: 'related'
  }
})
```

**📖 CMS Documentation:**
- [CMS Database Structure](./docs/CMS_DATABASE_STRUCTURE.md) - Complete database schema reference
- [CMS Improvements Guide](./docs/CMS_IMPROVEMENTS.md) - Features and usage examples
- [Content Type Builder](./CONTENT_TYPE_BUILDER.md) - Full content type documentation
- [Content Manager](./CONTENT_MANAGER.md) - CRUD API documentation
- [Media Manager](./MEDIA_MANAGER.md) - File storage and management documentation

### 5. Enhanced REST API

The platform provides a comprehensive REST API with enterprise-grade features:

**Core Features:**
- ✅ **Standardized Responses** - Consistent JSON response format across all endpoints
- ✅ **Input Validation** - Robust validation with detailed error messages
- ✅ **Error Handling** - Comprehensive error codes and meaningful error responses
- ✅ **Authentication** - JWT-based authentication for protected endpoints
- ✅ **Rate Limiting** - Built-in rate limiting support to prevent abuse
- ✅ **Pagination** - Efficient pagination with skip/take parameters
- ✅ **Filtering & Sorting** - Advanced query capabilities for all content types

**API Endpoints:**
- `POST /api/login` - User authentication
- `GET /api/content` - Dynamic CRUD for all content types
- `GET /api/content-types` - Content type management
- `GET /api/api-dashboard` - API analytics and monitoring
- `GET /api/me` - Current user information (protected)
- `GET /api/health` - System health check

**Example Usage:**
```bash
# Get all articles with filtering and pagination
curl "http://localhost:5173/api/content?contentType=api::article.article&where={\"published\":true}&take=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a new article
curl -X POST "http://localhost:5173/api/content?contentType=api::article.article" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Article","slug":"new-article","content":"Article content","authorId":1}'
```

See [API Reference](./API_REFERENCE.md) for complete API documentation with examples.

### 6. API Routes via Vite Middleware

API endpoints are implemented in `vite.config.ts`:

- `POST /api/login` - User authentication
- `GET /api/posts` - Fetch all posts
- `GET /api/me` - Get current user (protected)
- `GET /api/health` - Health check

### 7. Type-Safe Data Fetching

TanStack Query provides automatic caching and state management:

```typescript
const { data: posts, isLoading, error } = useQuery<Post[]>({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

### 8. Service Layer Architecture

Business logic is separated into service modules:

- `authService.ts` - Authentication logic
- `postService.ts` - Post CRUD operations

This keeps routes and components clean and focused on presentation.

### 9. Plugin System & Extensibility

The plugin system provides a powerful way to extend and customize core functionality:

**Key Features:**
- **Lifecycle Hooks**: Intercept requests at multiple points (onRegister, onBeforeRequest, onAfterRequest, onError)
- **Middleware Support**: Express-style middleware with priority-based execution
- **Route Matching**: Apply plugins to specific routes with wildcard patterns
- **State Management**: Share data between plugin hooks via context
- **Error Handling**: Graceful error handling with dedicated error hooks

**Quick Example:**
```typescript
import { pluginManager } from '@/lib/plugin-system'
import { requestLoggerPlugin } from '@/plugins/examples/logger'

// Register a plugin
await pluginManager.register(requestLoggerPlugin, {
  priority: 20,
  routes: ['/api/*'],
  excludeRoutes: ['/api/health'],
  options: {
    logHeaders: false,
    logResponse: false,
  }
})
```

**Built-in Example Plugins:**
- **Request Logger**: Logs all API requests with timing information
- **Request ID**: Adds unique IDs to requests for tracing
- **Performance Monitor**: Tracks slow requests and memory usage
- **Response Transformer**: Standardizes API response formats

**Documentation:**
- [Plugin System Architecture](./docs/PLUGIN_SYSTEM_ARCHITECTURE.md) - Complete architectural overview
- [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT_GUIDE.md) - How to create custom plugins
- [Middleware Guide](./docs/MIDDLEWARE_GUIDE.md) - Middleware development patterns
- [API Reference](./docs/PLUGIN_API_REFERENCE.md) - Complete API documentation
- [Integration Examples](./examples/plugin-integration-example.ts) - Real-world usage examples

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

# Get all articles (Content Manager)
curl http://localhost:5173/api/content?contentType=api::article.article \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a category (Content Manager)
curl -X POST http://localhost:5173/api/content?contentType=api::category.category \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tech","slug":"tech","description":"Technology articles"}'
```

For detailed Content Manager API documentation, see [CONTENT_MANAGER.md](./CONTENT_MANAGER.md).

### API Controller Dashboard

Access the comprehensive API management dashboard at `/api-dashboard` after logging in. The dashboard provides:

- **API Statistics**: View endpoint counts and usage metrics
- **Endpoint Documentation**: Complete API reference grouped by category
- **Content Type APIs**: Manage and configure endpoints for each content type
- **Documentation Generation**: Auto-generate API docs from content type schemas

For detailed API Dashboard documentation, see [API_DASHBOARD.md](./API_DASHBOARD.md).

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

> 🌟 **Multi-Cloud Ready**: Deploy to **Vercel** (serverless), **any cloud provider** (AWS, Azure, GCP), or your own infrastructure!
> 🚀 **Flexible Runtime**: Serverless functions OR traditional Node.js server - your choice!

### Quick Deploy with Runtime Configuration

This serverless CMS can be deployed to **any cloud platform**:

```bash
# Deploy to Vercel (serverless)
npm run start:vercel

# Run on Node.js server (AWS, Azure, GCP, DigitalOcean, etc.)
npm run start:node
```

Or set `RUNTIME` in your `.env` file and use:
```bash
npm start
```

📖 **For detailed environment options, see [RUN_ENVIRONMENTS.md](./RUN_ENVIRONMENTS.md)**

### Deploy to Vercel (Serverless)

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

**📊 For architecture diagrams and flow charts, see [ARCHITECTURE_VERCEL.md](./ARCHITECTURE_VERCEL.md)**



### Deploy to Any Cloud (Node.js Server)

> 🚀 **Quick Start**: Set `RUNTIME=node` in your `.env` file and run `npm start`!
> ☁️ **Works on**: AWS, Azure, GCP, DigitalOcean, Heroku, Railway, Fly.io, or any VPS/Docker environment

The application includes a production-ready Express.js server for traditional hosting environments.

#### Option A: Using Runtime Environment Variable (Recommended)

1. Set runtime in your `.env` file:
   ```env
   RUNTIME=node
   NODE_ENV=production
   PORT=3000
   ```

2. Start the server:
   ```bash
   npm start
   ```

#### Option B: Using Convenience Script

```bash
npm run start:node
```

This automatically sets `RUNTIME=node` and starts the server.

#### Option C: Manual Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production database**
   ```bash
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   ```

3. **Start the server directly**
   ```bash
   NODE_ENV=production tsx server/index.ts
   # or with custom port
   PORT=8080 NODE_ENV=production tsx server/index.ts
   ```

#### Features

- **Full-stack server**: Handles both API routes and frontend serving
- **Express.js**: Production-ready, battle-tested framework
- **Flexible database**: Works with SQLite, PostgreSQL, MySQL, etc.
- **Custom port**: Set PORT environment variable
- **Static file serving**: Automatically serves built frontend
- **SPA routing**: Supports client-side routing with fallback

#### Environment Variables

Set these in your `.env` file or environment:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="use-a-strong-random-secret-at-least-32-characters"
NODE_ENV="production"
PORT=3000  # Optional, defaults to 3000
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
