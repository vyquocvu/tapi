# Features Guide

tapi is a modern, full-stack CMS platform with enterprise-grade features. This guide provides an overview of all major features and how to use them.

## Table of Contents

- [Authentication & Security](#authentication--security)
- [Content Type Builder](#content-type-builder)
- [Content Manager](#content-manager)
- [Media Manager](#media-manager)
- [CMS Features](#cms-features)
- [REST API](#rest-api)
- [Plugin System](#plugin-system)
- [Type Safety](#type-safety)

## Authentication & Security

### JWT-Based Authentication

tapi uses JSON Web Tokens (JWT) for secure, stateless authentication.

**Authentication Flow:**
1. User submits credentials via login form
2. Server validates credentials against database using bcrypt
3. JWT token is generated with user information
4. Token is stored in browser's sessionStorage
5. Token is sent with subsequent API requests via Authorization header
6. Server validates token for protected routes and API endpoints

**Implementation:**
- Service layer: `src/services/authService.ts` handles login logic
- JWT helpers: `src/server/auth.ts` for token generation and verification
- Password hashing: bcrypt for secure password storage
- Token expiration: Configurable token lifetime

### Protected Routes

Routes can be protected using TanStack Router's `beforeLoad` hook:

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

**Features:**
- Automatic redirects to login page
- Token validation before route loading
- Context restoration on app reload
- Seamless user experience

### API Security

All API endpoints support authentication via JWT tokens:

```bash
curl http://localhost:5173/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Content Type Builder

Create database models using JSON or TypeScript definitions - just like Strapi!

### Key Features

- **Auto-generation in dev mode** - Schemas regenerate automatically when you save changes
- **Multiple field types** - strings, numbers, dates, booleans, relations, enums, JSON
- **Relationship support** - one-to-one, one-to-many, many-to-one, many-to-many
- **Migration tracking** - Version control for schema changes
- **Type safety** - Generated Prisma schemas are fully typed

### Quick Example

1. Create content type definition:
   ```json
   {
     "contentTypes": [
       {
         "name": "Article",
         "tableName": "articles",
         "fields": [
           { "name": "title", "type": "string", "required": true },
           { "name": "slug", "type": "string", "required": true, "unique": true },
           { "name": "content", "type": "text" },
           { "name": "published", "type": "boolean", "default": false }
         ]
       }
     ]
   }
   ```

2. Save to `content-types/definitions.json`
3. Schema auto-generates in dev mode (or run `npm run content-type:generate`)
4. Apply to database: `npm run prisma:migrate`

### Documentation

- [CONTENT_TYPE_BUILDER.md](./CONTENT_TYPE_BUILDER.md) - Complete guide
- [docs/CMS_DATABASE_STRUCTURE.md](./docs/CMS_DATABASE_STRUCTURE.md) - Database schema reference

## Content Manager

Dynamic CRUD API for managing content entries of any type.

### Key Features

- **Dynamic endpoints** - Automatic API for all content types
- **Type-safe operations** - Fully typed CRUD operations
- **Query capabilities** - Filtering, sorting, pagination
- **Relations** - Handle related content
- **Validation** - Input validation for all operations

### API Usage

```bash
# Get all articles
GET /api/content?contentType=api::article.article

# Get single article
GET /api/content/123?contentType=api::article.article

# Create article
POST /api/content?contentType=api::article.article
Body: { "title": "New Article", "content": "..." }

# Update article
PUT /api/content/123?contentType=api::article.article
Body: { "title": "Updated Title" }

# Delete article
DELETE /api/content/123?contentType=api::article.article
```

### Advanced Queries

```bash
# Filtering
GET /api/content?contentType=api::article.article&where={"published":true}

# Pagination
GET /api/content?contentType=api::article.article&skip=0&take=10

# Sorting
GET /api/content?contentType=api::article.article&orderBy={"createdAt":"desc"}
```

### Documentation

- [CONTENT_MANAGER.md](./CONTENT_MANAGER.md) - Complete API reference
- [API_REFERENCE.md](./API_REFERENCE.md) - REST API documentation

## Media Manager

Multi-provider file storage system with support for local storage, AWS S3, and Google Cloud Storage.

### Supported Providers

- **Local** - File system storage for development
- **AWS S3** - Scalable cloud storage
- **Google Cloud Storage** - Google Cloud Platform storage

### Configuration

Configure storage provider in `.env`:

```env
# Local storage (development)
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:5173

# AWS S3
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Google Cloud Storage
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_KEY_FILE=/path/to/keyfile.json
```

### Features

- **Upload** - Upload files via API
- **Delete** - Remove files from storage
- **Preview** - Get file URLs for display
- **Multi-format** - Support for images, documents, videos
- **Type safety** - Typed file operations

### Documentation

- [MEDIA_MANAGER.md](./MEDIA_MANAGER.md) - Complete guide

## CMS Features

### Content Metadata

Add SEO and metadata to any content type:

```typescript
await prisma.contentMetadata.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    metaTitle: 'Best TypeScript Practices',
    metaDescription: 'Learn TypeScript best practices',
    keywords: 'typescript, best practices, development',
    customData: { readingTime: '8 min' }
  }
})
```

**Features:**
- SEO optimization (meta titles, descriptions, keywords)
- Open Graph metadata for social sharing
- Custom metadata (flexible JSON field)
- Per-content metadata

### Content Revisions

Track all changes with complete version history:

```typescript
await prisma.contentRevision.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    revisionNumber: 5,
    data: articleSnapshot,
    changeLog: 'Updated title and added examples',
    createdBy: userId
  }
})
```

**Features:**
- Complete version history
- Content snapshots as JSON
- Change logs and descriptions
- User tracking
- Rollback capability

### Content Tags

Flexible tagging system for categorizing content:

```typescript
// Create a tag
const tag = await prisma.contentTag.create({
  data: {
    name: 'Featured',
    slug: 'featured',
    color: '#FF5733'
  }
})

// Tag content
await prisma.contentTagRelation.create({
  data: {
    tagId: tag.id,
    contentType: 'api::article.article',
    contentId: articleId
  }
})
```

**Features:**
- Reusable tags across content types
- Color-coded tags for visual categorization
- Multi-tag support
- Tag filtering and search

### Content Relations

Create relationships between any content items:

```typescript
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

**Features:**
- Generic relations between any content types
- Named relation types (related, parent, child, etc.)
- Bidirectional relationships
- Cross-type relations

### Documentation

- [docs/CMS_IMPROVEMENTS.md](./docs/CMS_IMPROVEMENTS.md) - CMS features guide
- [docs/CMS_DATABASE_STRUCTURE.md](./docs/CMS_DATABASE_STRUCTURE.md) - Database reference

## REST API

Comprehensive REST API with enterprise-grade features.

### Core Features

- ✅ **Standardized Responses** - Consistent JSON format
- ✅ **Input Validation** - Robust validation with detailed errors
- ✅ **Error Handling** - Comprehensive error codes
- ✅ **Authentication** - JWT-based security
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Pagination** - Efficient data retrieval
- ✅ **Filtering & Sorting** - Advanced queries

### Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  }
}
```

### API Dashboard

Access the API management dashboard at `/api-dashboard` (requires login).

**Features:**
- API statistics and usage metrics
- Complete endpoint documentation
- Content type API configuration
- Auto-generated API docs

### Documentation

- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference

## Plugin System

Extensible plugin architecture for customizing and extending functionality.

### Key Features

- **Lifecycle Hooks** - onRegister, onBeforeRequest, onAfterRequest, onError
- **Middleware Support** - Express-style middleware with priority
- **Route Matching** - Apply plugins to specific routes with wildcards
- **State Management** - Share data between hooks via context
- **Error Handling** - Graceful error handling

### Quick Example

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

### Built-in Example Plugins

- **Request Logger** - Logs all API requests with timing
- **Request ID** - Adds unique IDs for request tracing
- **Performance Monitor** - Tracks slow requests and memory usage
- **Response Transformer** - Standardizes API responses

### Creating Custom Plugins

```typescript
import { Plugin } from '@/lib/plugin-system/types'

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  onRegister: async (context) => {
    console.log('Plugin registered!')
  },
  
  onBeforeRequest: async (req, res, context) => {
    // Modify request before it's processed
  },
  
  onAfterRequest: async (req, res, result, context) => {
    // Modify response after processing
    return result
  }
}
```

### Documentation

- [docs/PLUGIN_SYSTEM_ARCHITECTURE.md](./docs/PLUGIN_SYSTEM_ARCHITECTURE.md) - Architecture overview
- [docs/PLUGIN_DEVELOPMENT_GUIDE.md](./docs/PLUGIN_DEVELOPMENT_GUIDE.md) - Development guide
- [docs/PLUGIN_API_REFERENCE.md](./docs/PLUGIN_API_REFERENCE.md) - API reference
- [docs/MIDDLEWARE_GUIDE.md](./docs/MIDDLEWARE_GUIDE.md) - Middleware patterns
- [examples/plugin-integration-example.ts](./examples/plugin-integration-example.ts) - Examples

## Type Safety

### End-to-End Type Safety

tapi provides complete type safety throughout the stack:

- **Prisma** - Type-safe database operations
- **TypeScript** - Type checking for all code
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Type-safe data fetching
- **API** - Type-safe request/response types

### Example: Type-Safe Data Fetching

```typescript
import { Post } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

const { data: posts, isLoading, error } = useQuery<Post[]>({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

// posts is fully typed!
posts?.forEach(post => {
  console.log(post.title) // TypeScript knows about title
})
```

### Prisma Type Generation

```bash
# Generate Prisma Client with types
npm run prisma:generate
```

This generates fully typed database models that you can import and use:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fully typed queries
const users = await prisma.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: { posts: true }
})
```

## Performance Features

### Caching

TanStack Query provides automatic caching:

- **Stale Time:** 5 minutes
- **Cache Time:** 10 minutes
- **Automatic Refetching:** On window focus, reconnect
- **Optimistic Updates:** For better UX

### Database Optimization

- Connection pooling with Prisma
- Efficient queries with proper indexes
- Batch operations support
- Query optimization tools

### Build Optimization

- Vite for fast builds
- Code splitting
- Tree shaking
- Minification

## Developer Experience

### DevTools

Built-in developer tools for debugging:

- **TanStack Router DevTools** - Route debugging
- **TanStack Query DevTools** - Query state inspection
- **Prisma Studio** - Database GUI

### Hot Module Replacement

Instant updates during development without full page reload.

### TypeScript Support

Full TypeScript support with:
- Strict type checking
- IntelliSense in editors
- Type inference
- Error catching at compile time

## Next Steps

- **Deploy Your App** - [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Explore Architecture** - [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Read API Docs** - [API_REFERENCE.md](./API_REFERENCE.md)
- **Learn More** - [docs/README.md](./docs/README.md)

---

Have questions? Open an issue on GitHub or check the [documentation index](./docs/README.md).
