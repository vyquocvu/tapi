/**
 * Centralized query key factory for TanStack Query
 * This ensures consistency across all components and prevents typos
 */

export const queryKeys = {
  // Content Type Builder keys
  contentTypes: {
    all: ['content-types'] as const,
    detail: (id: string) => ['content-types', id] as const,
  },
  
  // Content Manager keys
  contentEntries: {
    all: ['content-entries'] as const,
    byType: (contentType: string) => ['content-entries', contentType] as const,
    detail: (contentType: string, id: number) => ['content-entries', contentType, id] as const,
  },
  
  // Add other query keys here as needed
  posts: {
    all: ['posts'] as const,
    detail: (id: number) => ['posts', id] as const,
  },
} as const
