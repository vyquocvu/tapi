# Query Architecture Refactoring Summary

## Overview
Refactored the TanStack Query implementation to use centralized query keys and query functions, ensuring consistency and reusability across all components.

## Files Created

### 1. `/src/lib/queryKeys.ts`
**Purpose**: Centralized query key factory for type-safe, consistent query keys

**Benefits**:
- Type safety - prevents typos
- Single source of truth
- IDE autocomplete
- Easy refactoring

**Available Keys**:
```typescript
queryKeys.contentTypes.all              // ['content-types']
queryKeys.contentTypes.detail(id)       // ['content-types', id]
queryKeys.contentEntries.all            // ['content-entries']
queryKeys.contentEntries.byType(type)   // ['content-entries', type]
queryKeys.contentEntries.detail(type, id) // ['content-entries', type, id]
queryKeys.posts.all                     // ['posts']
queryKeys.posts.detail(id)              // ['posts', id]
```

### 2. `/src/services/queryFunctions.ts`
**Purpose**: Centralized data fetching functions for TanStack Query

**Features**:
- Consistent API calls
- Proper error handling
- Type-safe responses
- Reusable across components

**Functions**:

#### Content Types
- `fetchContentTypesRegistry()` → Returns `ContentTypeRegistry` (object format)
- `fetchContentTypesArray()` → Returns `ContentTypeDefinition[]` (array format)
- `fetchContentType(uid)` → Returns single content type

#### Content Entries
- `fetchContentEntries(contentType)` → Returns `ContentEntry[]`
- `createContentEntry(contentType, data)` → Creates and returns entry
- `updateContentEntry(contentType, id, data)` → Updates and returns entry
- `deleteContentEntry(contentType, id)` → Deletes entry

## Files Modified

### 1. `/src/components/content-type-builder/ContentTypeList.tsx`
**Changes**:
- ✅ Imports `queryKeys` and `fetchContentTypesRegistry`
- ✅ Uses `queryKeys.contentTypes.all` instead of hardcoded `['content-types']`
- ✅ Uses centralized `fetchContentTypesRegistry()` function

**Before**:
```typescript
const { data: contentTypes } = useQuery({
  queryKey: ['content-types'],
  queryFn: async () => {
    const response = await httpClient.get('/api/content-types')
    if (!response.success) throw new Error('Failed to fetch')
    return response.data || {}
  },
})
```

**After**:
```typescript
const { data: contentTypes } = useQuery({
  queryKey: queryKeys.contentTypes.all,
  queryFn: fetchContentTypesRegistry,
})
```

### 2. `/src/components/content-type-builder/ContentTypeBuilder.tsx`
**Changes**:
- ✅ Imports `queryKeys`
- ✅ All mutations use `queryKeys.contentTypes.all` for invalidation

**Impact**: Create, update, and delete operations now consistently invalidate queries

### 3. `/src/routes/content-manager/index.tsx`
**Changes**:
- ✅ Removed ~150 lines of duplicate fetch functions
- ✅ Imports centralized query functions
- ✅ Uses `fetchContentTypesArray()` for array format
- ✅ Uses `fetchContentEntries()`, `createContentEntry()`, `updateContentEntry()`, `deleteContentEntry()`
- ✅ All queries and mutations use centralized query keys

**Code Reduction**:
- Removed local function definitions (fetchContentTypes, fetchEntries, createEntry, updateEntry, deleteEntry)
- Total lines reduced: ~150 lines

## Data Format Consistency

### Content Types
The API returns content types as a **Registry object**:
```typescript
{
  "api::article.article": { uid: "api::article.article", ... },
  "api::blog.blog": { uid: "api::blog.blog", ... }
}
```

**Usage**:
- Use `fetchContentTypesRegistry()` when you need the object format (e.g., for lookup by UID)
- Use `fetchContentTypesArray()` when you need to iterate/map over content types

### Content Entries
Always returns as an **array**:
```typescript
[
  { id: 1, title: "...", ... },
  { id: 2, title: "...", ... }
]
```

## Benefits of Refactoring

### 1. **Consistency**
- Same query keys used everywhere
- Same data fetching logic
- Predictable behavior across components

### 2. **Maintainability**
- Change API endpoint once, updates everywhere
- Change query key structure once, updates everywhere
- Easy to add new features

### 3. **Type Safety**
- TypeScript enforces correct query key usage
- Return types are consistent
- Reduces runtime errors

### 4. **Code Reusability**
- No duplicate fetch logic
- Components stay focused on UI
- Services handle data logic

### 5. **Testing**
- Mock query functions in one place
- Test components without API calls
- Easier to write unit tests

## Usage Examples

### Fetching Content Types
```typescript
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchContentTypesArray } from '@/services/queryFunctions'

function MyComponent() {
  const { data: contentTypes } = useQuery({
    queryKey: queryKeys.contentTypes.all,
    queryFn: fetchContentTypesArray,
  })
  
  return <div>{contentTypes?.map(ct => ct.displayName)}</div>
}
```

### Fetching and Creating Entries
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchContentEntries, createContentEntry } from '@/services/queryFunctions'

function EntryManager({ contentType }: { contentType: string }) {
  const queryClient = useQueryClient()
  
  // Fetch entries
  const { data: entries } = useQuery({
    queryKey: queryKeys.contentEntries.byType(contentType),
    queryFn: () => fetchContentEntries(contentType),
  })
  
  // Create entry
  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => 
      createContentEntry(contentType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.contentEntries.byType(contentType) 
      })
    },
  })
  
  return <div>...</div>
}
```

## Migration Guide

If you're adding new features or updating existing code:

### 1. Use Centralized Query Keys
```typescript
// ❌ Don't
queryKey: ['my-data']

// ✅ Do - Add to queryKeys.ts first
queryKey: queryKeys.myFeature.all
```

### 2. Use Centralized Query Functions
```typescript
// ❌ Don't
queryFn: async () => {
  const res = await fetch('/api/data')
  return res.json()
}

// ✅ Do - Add to queryFunctions.ts first
queryFn: fetchMyData
```

### 3. Invalidate Queries Correctly
```typescript
// ❌ Don't
queryClient.invalidateQueries({ queryKey: ['my-data'] })

// ✅ Do
queryClient.invalidateQueries({ queryKey: queryKeys.myFeature.all })
```

## Next Steps

1. **Add More Query Functions**: As new features are added, create corresponding functions in `queryFunctions.ts`
2. **Add Tests**: Create unit tests for query functions
3. **Document New Keys**: Keep `QUERY_KEYS.md` updated when adding new keys
4. **Refactor Other Components**: Apply this pattern to posts, users, and other data fetching

## Related Files
- `/src/lib/queryKeys.ts` - Query key factory
- `/src/services/queryFunctions.ts` - Query functions
- `/docs/QUERY_KEYS.md` - Documentation
