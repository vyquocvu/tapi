# Query Key Management

## Overview
This project uses a centralized query key factory to ensure consistency across all TanStack Query operations and prevent typos or mismatches.

## Location
`src/lib/queryKeys.ts`

## Usage

### Instead of hardcoded strings:
```typescript
// ❌ Don't do this
useQuery({
  queryKey: ['content-types'],
  queryFn: fetchContentTypes,
})

// ❌ Don't do this
queryClient.invalidateQueries({ 
  queryKey: ['content-entries', selectedContentType] 
})
```

### Use the centralized factory:
```typescript
import { queryKeys } from '@/lib/queryKeys'

// ✅ Do this
useQuery({
  queryKey: queryKeys.contentTypes.all,
  queryFn: fetchContentTypes,
})

// ✅ Do this
queryClient.invalidateQueries({ 
  queryKey: queryKeys.contentEntries.byType(selectedContentType) 
})
```

## Benefits

1. **Type Safety**: TypeScript ensures you're using valid query keys
2. **Consistency**: All components use the same keys
3. **Refactoring**: Change keys in one place, updates everywhere
4. **Discoverability**: IDE autocomplete shows all available query keys
5. **Prevention**: Eliminates typos and mismatches

## Available Query Keys

### Content Types
- `queryKeys.contentTypes.all` - All content type definitions
- `queryKeys.contentTypes.detail(id)` - Single content type by ID

### Content Entries
- `queryKeys.contentEntries.all` - All content entries
- `queryKeys.contentEntries.byType(contentType)` - Entries for a specific content type
- `queryKeys.contentEntries.detail(contentType, id)` - Single entry by content type and ID

### Posts
- `queryKeys.posts.all` - All posts
- `queryKeys.posts.detail(id)` - Single post by ID

## Adding New Query Keys

When adding new features that use TanStack Query, add your query keys to `src/lib/queryKeys.ts`:

```typescript
export const queryKeys = {
  // ... existing keys
  
  // Add your new keys
  myFeature: {
    all: ['my-feature'] as const,
    detail: (id: string) => ['my-feature', id] as const,
    filtered: (filters: MyFilters) => ['my-feature', 'filtered', filters] as const,
  },
} as const
```

## Centralized Query Functions

In addition to standardized query keys, the project uses centralized query functions in `src/services/queryFunctions.ts`:

### Content Types
- `fetchContentTypesRegistry()` - Returns content types as an object (Registry format)
- `fetchContentTypesArray()` - Returns content types as an array for easier iteration
- `fetchContentType(uid)` - Fetch a single content type

### Content Entries
- `fetchContentEntries(contentType)` - Fetch all entries for a content type
- `createContentEntry(contentType, data)` - Create a new entry
- `updateContentEntry(contentType, id, data)` - Update an existing entry
- `deleteContentEntry(contentType, id)` - Delete an entry

### Example Usage
```typescript
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchContentTypesArray } from '@/services/queryFunctions'

// In your component
const { data: contentTypes } = useQuery({
  queryKey: queryKeys.contentTypes.all,
  queryFn: fetchContentTypesArray,
})
```

## Components Updated

The following components now use the centralized query key factory and query functions:

1. ✅ `src/components/content-type-builder/ContentTypeList.tsx`
2. ✅ `src/components/content-type-builder/ContentTypeBuilder.tsx`
3. ✅ `src/routes/content-manager/index.tsx`

## Related Documentation

- [TanStack Query Docs - Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
