# Query Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTS                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ ContentType    │  │ ContentType     │  │ Content          │  │
│  │ List           │  │ Builder         │  │ Manager          │  │
│  └────────┬───────┘  └────────┬────────┘  └────────┬─────────┘  │
│           │                   │                    │            │
│           └───────────────────┴────────────────────┘            │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   TanStack Query      │
                    │   (useQuery,          │
                    │    useMutation)       │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼──────────────────────┐
        │                       │                      │
   ┌────▼──────┐         ┌──────▼──────┐        ┌──────▼──────┐
   │  Query    │         │   Query     │        │  httpClient │
   │  Keys     │         │  Functions  │        │  (lib/http) │
   │           │         │             │        │             │
   │ Factory   │         │ Service     │        │             │
   └───────────┘         └──────┬──────┘        └─────────────┘
   │                            │
   │ • contentTypes.all         │ • fetchContentTypesRegistry()
   │ • contentTypes.detail()    │ • fetchContentTypesArray()
   │ • contentEntries.byType()  │ • fetchContentEntries()
   │ • contentEntries.detail()  │ • createContentEntry()
   │ • posts.all                │ • updateContentEntry()
   │ • posts.detail()           │ • deleteContentEntry()
   │                            │
   └────────────────────────────┼──────────────────────────────┐
                                │                              │
                        ┌───────▼────────┐            ┌────────▼────────┐
                        │  Authorization  │            │   API Routes   │
                        │  (JWT Token)    │            │                │
                        └────────┬────────┘            │ /api/content-  │
                                 │                     │      types     │
                                 │                     │ /api/content   │
                                 └─────────────────────┤                │
                                                       └────────┬───────┘
                                                                │
                                                    ┌───────────▼──────────┐
                                                    │   Prisma ORM         │
                                                    │   (Database Layer)   │
                                                    └──────────────────────┘
```

## Data Flow

### Reading Data (Query)
```
Component
    │
    ├─ useQuery({
    │    queryKey: queryKeys.contentTypes.all,
    │    queryFn: fetchContentTypesArray
    │  })
    │
    ▼
TanStack Query (Cache Check)
    │
    ├─ Cache Hit?  → Return cached data
    │
    └─ Cache Miss? → Call queryFn
         │
         ▼
    fetchContentTypesArray()
         │
         ├─ Uses httpClient or fetch
         │
         ▼
    API Endpoint (/api/content-types)
         │
         ├─ Validates JWT token
         │
         ▼
    Prisma Database Query
         │
         ▼
    Returns Data → Cache → Component
```

### Writing Data (Mutation)
```
Component
    │
    ├─ useMutation({
    │    mutationFn: createContentEntry,
    │    onSuccess: () => {
    │      queryClient.invalidateQueries({
    │        queryKey: queryKeys.contentEntries.byType(type)
    │      })
    │    }
    │  })
    │
    ▼
TanStack Query
    │
    ├─ Call mutationFn
    │
    ▼
createContentEntry(contentType, data)
    │
    ├─ POST /api/content?contentType=...
    │
    ▼
API Endpoint
    │
    ├─ Validates JWT
    ├─ Validates data
    │
    ▼
Prisma Database Write
    │
    ▼
Success Response
    │
    ├─ onSuccess callback
    │
    ▼
Invalidate Cache
    │
    ├─ queryClient.invalidateQueries()
    │
    ▼
Refetch Affected Queries
    │
    ▼
Component Updates
```

## Key Principles

### 1. Single Source of Truth
- **Query Keys**: Defined once in `queryKeys.ts`
- **Query Functions**: Defined once in `queryFunctions.ts`
- **API Endpoints**: Called through centralized functions

### 2. Type Safety
```typescript
// queryKeys are typed as const
queryKeys.contentTypes.all  // Type: readonly ['content-types']

// Query functions have proper return types
fetchContentTypesArray(): Promise<ContentTypeDefinition[]>
```

### 3. Cache Management
```typescript
// Query keys determine cache boundaries
queryKeys.contentEntries.byType('article')  // Cache key 1
queryKeys.contentEntries.byType('blog')     // Cache key 2 (separate cache)

// Mutations invalidate specific caches
onSuccess: () => {
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.contentEntries.byType(contentType) 
  })
}
```

### 4. Separation of Concerns
- **Components**: UI rendering and user interactions
- **Query Functions**: Data fetching and API calls
- **Query Keys**: Cache key management
- **API Routes**: Business logic and validation
- **Services**: Reusable business logic

## Benefits

✅ **Consistency**: All components use the same query keys and functions
✅ **Type Safety**: TypeScript prevents typos and wrong keys
✅ **Maintainability**: Change once, update everywhere
✅ **Testability**: Mock query functions easily
✅ **Performance**: TanStack Query handles caching automatically
✅ **DRY**: No duplicate fetch logic
