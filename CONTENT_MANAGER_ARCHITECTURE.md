# Content Manager Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                                 │
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   React     │  │  TanStack   │  │  TanStack   │  │    Auth     │   │
│  │ Components  │  │   Router    │  │    Query    │  │   Context   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│         │                 │                 │                │          │
└─────────┼─────────────────┼─────────────────┼────────────────┼──────────┘
          │                 │                 │                │
          └─────────────────┴─────────────────┴────────────────┘
                                    │
                        HTTP Requests (JWT Auth)
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                           API ENDPOINTS                                    │
│                                                                            │
│  ┌────────────────────┐          ┌────────────────────┐                  │
│  │  Development Mode  │          │  Production Mode   │                  │
│  │  (vite.config.ts)  │          │  (Vercel Functions)│                  │
│  ├────────────────────┤          ├────────────────────┤                  │
│  │ /api/login         │          │ api/login.ts       │                  │
│  │ /api/me            │          │ api/me.ts          │                  │
│  │ /api/posts         │          │ api/posts.ts       │                  │
│  │ /api/content-types │          │ api/content-types.ts                  │
│  │ /api/content   ◄───┼──────────┼─► api/content.ts   │  ◄── NEW!       │
│  └────────────────────┘          └────────────────────┘                  │
│                                                                            │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
┌─────────────────────────────────┐  ┌──────────────────────────────────┐
│    CONTENT TYPE BUILDER         │  │    CONTENT MANAGER               │
│    (Schema Management)          │  │    (Data Management)             │
│                                 │  │                                  │
│  contentTypeService.ts          │  │  contentManagerService.ts ◄──NEW!│
│  ┌───────────────────────────┐ │  │  ┌────────────────────────────┐ │
│  │ getAllContentTypes()      │ │  │  │ findMany()                 │ │
│  │ getContentType()          │ │  │  │ findOne()                  │ │
│  │ createContentType()       │ │  │  │ create()                   │ │
│  │ updateContentType()       │ │  │  │ update()                   │ │
│  │ deleteContentType()       │ │  │  │ deleteOne()                │ │
│  └───────────────────────────┘ │  │  │ count()                    │ │
│           │                     │  │  └────────────────────────────┘ │
│           ▼                     │  │           │                      │
│  definitions.json               │  │           │ Validates data       │
│           │                     │  │           │ against definitions  │
│           ▼                     │  │           ▼                      │
│  schema-generator.ts            │  └───────────┼──────────────────────┘
│           │                     │              │
│           ▼                     │              │
│  prisma/schema.prisma ◄─────────┼──────────────┘
│           │                     │
└───────────┼─────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Prisma Client                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Dynamic Model Access                                │ │ │
│  │  │  prisma[modelName.toLowerCase()].findMany()          │ │ │
│  │  │  prisma[modelName.toLowerCase()].create()            │ │ │
│  │  │  prisma[modelName.toLowerCase()].update()            │ │ │
│  │  │  prisma[modelName.toLowerCase()].delete()            │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   Article   │  │  Category   │  │    User     │       │ │
│  │  │   Table     │  │   Table     │  │   Table     │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │  ... any dynamically defined content type ...             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                         DATA FLOW EXAMPLE                          │
│                                                                    │
│  1. Define Content Type (Content Type Builder)                    │
│     └─► definitions.json → schema.prisma → PostgreSQL             │
│                                                                    │
│  2. Create Article Entry (Content Manager)                        │
│     Client → POST /api/content?contentType=api::article.article   │
│          └─► contentManagerService.create()                       │
│              └─► Validates against content type definition        │
│                  └─► prisma.article.create()                      │
│                      └─► PostgreSQL INSERT                        │
│                                                                    │
│  3. Fetch Articles (Content Manager)                              │
│     Client → GET /api/content?contentType=api::article.article    │
│          └─► contentManagerService.findMany()                     │
│              └─► prisma.article.findMany()                        │
│                  └─► PostgreSQL SELECT                            │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                      KEY RELATIONSHIPS                             │
│                                                                    │
│  Content Type Builder          Content Manager                    │
│  ├─ Defines SCHEMA            ├─ Manages DATA                     │
│  ├─ Creates models            ├─ CRUD operations                  │
│  ├─ Generates Prisma schema   ├─ Validates against schema         │
│  └─ /api/content-types        └─ /api/content                     │
│                                                                    │
│  Both require JWT authentication                                   │
│  Both use Prisma for database access                              │
│  Content Manager depends on Content Type Builder definitions      │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        VALIDATION FLOW                             │
│                                                                    │
│  Request Data                                                      │
│      │                                                             │
│      ▼                                                             │
│  validateContentType()                                             │
│      │ (Check content type exists)                                │
│      ▼                                                             │
│  validateData()                                                    │
│      ├─► Check required fields                                    │
│      ├─► Validate field types                                     │
│      ├─► Check string lengths                                     │
│      ├─► Validate enum values                                     │
│      └─► Check number ranges                                      │
│      │                                                             │
│      ▼                                                             │
│  Prisma Query                                                      │
│      │ (Additional DB constraints)                                │
│      ▼                                                             │
│  Database Operation                                                │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Implementation Highlights

### ✅ Dynamic Content Type Support
The Content Manager automatically works with **any** content type defined in the Content Type Builder. No code changes needed.

### ✅ Type-Safe Operations
Full TypeScript support with Prisma's generated types ensures compile-time safety.

### ✅ Comprehensive Validation
Multi-layer validation:
1. Service-level validation (required fields, types, constraints)
2. Prisma-level validation (database constraints)
3. PostgreSQL-level validation (final enforcement)

### ✅ Production Ready
Works in all environments:
- Development (Vite middleware)
- Node.js server (Express)
- Vercel (Serverless functions)

### ✅ RESTful API Design
Standard HTTP methods and status codes for intuitive integration.

## File Organization

```
/vstack
├── api/
│   └── content.ts                       # Vercel serverless endpoint
├── src/
│   └── services/
│       ├── contentTypeService.ts        # Schema management
│       └── contentManagerService.ts     # Data management ◄── NEW!
├── scripts/
│   ├── content-manager-example.ts       # Usage examples ◄── NEW!
│   └── test-content-manager.ts          # Test suite ◄── NEW!
├── vite.config.ts                       # Dev server with endpoints
├── CONTENT_MANAGER.md                   # Full documentation ◄── NEW!
├── CONTENT_MANAGER_QUICKSTART.md        # Quick reference ◄── NEW!
└── CONTENT_MANAGER_SUMMARY.md           # Implementation summary ◄── NEW!
```

## Next Steps for Users

1. **Define Content Types** in `content-types/definitions.json`
2. **Generate Schema** with `npm run content-type:generate`
3. **Run Migrations** with `npm run prisma:migrate`
4. **Start Managing Content** via `/api/content` endpoints

That's it! The Content Manager handles the rest automatically.
