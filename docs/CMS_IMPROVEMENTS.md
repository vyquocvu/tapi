# CMS Feature Improvements

This document describes the recent improvements to the tapi CMS feature, focusing on the enhanced database structure that provides a complete content management system.

## Overview

The CMS has been significantly enhanced with a comprehensive database structure that separates concerns between:

1. **System Tables** - Core authentication and basic content
2. **CMS Metadata Tables** - Enhanced features that work with ANY content type
3. **Custom Content Types** - Dynamically defined content models

## What's New

### 1. Content Metadata System

Add SEO and metadata to any content type:

```typescript
// Example: Add SEO metadata to an article
const metadata = await prisma.contentMetadata.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    metaTitle: 'Best TypeScript Practices',
    metaDescription: 'Learn the best practices for TypeScript development',
    metaKeywords: 'typescript, best practices, development',
    ogTitle: 'TypeScript Best Practices',
    ogDescription: 'Master TypeScript with these proven patterns',
    ogImage: 'https://example.com/og-image.jpg',
    customData: {
      readingTime: '8 min',
      difficulty: 'intermediate'
    },
    createdById: userId
  }
})
```

**Features:**
- SEO meta tags (title, description, keywords)
- Open Graph metadata for social sharing
- Flexible custom metadata via JSON field
- One metadata record per content item
- Works with any content type (articles, products, pages, etc.)

### 2. Content Revision History

Track all changes to content with full audit trail:

```typescript
// Create a revision when updating content
const revision = await prisma.contentRevision.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    revisionNumber: 5,
    data: articleSnapshot, // Full content snapshot as JSON
    changeLog: 'Updated title and added new section',
    createdById: userId
  }
})

// View revision history
const history = await prisma.contentRevision.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: articleId
  },
  orderBy: { revisionNumber: 'desc' },
  include: { createdBy: true }
})
```

**Features:**
- Complete version history for all content
- Full content snapshots stored as JSON
- Optional change logs for each revision
- Track who made each change
- Restore previous versions
- Works with any content type

### 3. Flexible Tagging System

Tag any content with customizable tags:

```typescript
// Create tags
const tag = await prisma.contentTag.create({
  data: {
    name: 'Featured',
    slug: 'featured',
    description: 'Featured content highlighted on homepage',
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

// Get all tags for content
const tags = await prisma.contentTagRelation.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: articleId
  },
  include: { tag: true }
})

// Get all content with a specific tag
const taggedContent = await prisma.contentTagRelation.findMany({
  where: {
    contentType: 'api::article.article',
    tagId: tag.id
  }
})
```

**Features:**
- Create reusable tags with names, slugs, and colors
- Tag any content type
- Many-to-many relationships
- Filter content by tags
- Visual categorization with colors

### 4. Content Relationships

Create relationships between any content items:

```typescript
// Create a "related articles" relationship
await prisma.contentRelation.create({
  data: {
    sourceType: 'api::article.article',
    sourceId: article1.id,
    targetType: 'api::article.article',
    targetId: article2.id,
    relationType: 'related'
  }
})

// Get related articles
const related = await prisma.contentRelation.findMany({
  where: {
    sourceType: 'api::article.article',
    sourceId: articleId,
    relationType: 'related'
  }
})

// Create parent-child relationships
await prisma.contentRelation.create({
  data: {
    sourceType: 'api::page.page',
    sourceId: parentPageId,
    targetType: 'api::page.page',
    targetId: childPageId,
    relationType: 'child'
  }
})
```

**Features:**
- Generic relationships between any content types
- Named relationship types (related, parent, child, dependency, etc.)
- Bidirectional relationships
- Cross-content-type relationships (e.g., article → product)

## Architecture Benefits

### Polymorphic Design

The CMS metadata tables use a polymorphic pattern (`contentType` + `contentId`) that allows them to work with any content type without schema changes:

```
contentType: "api::article.article"  → identifies the model
contentId: 123                       → identifies the record
```

This means:
- ✅ Add new content types without database migrations
- ✅ Consistent metadata/tagging/revision system across all content
- ✅ Simplified API - same endpoints work for all content types

### Separation of Concerns

```
┌─────────────────────────────────────────┐
│ System Tables (User, Post)              │  ← Core functionality
├─────────────────────────────────────────┤
│ CMS Metadata Tables                     │  ← Enhanced features
│ - ContentMetadata                       │
│ - ContentRevision                       │
│ - ContentTag                            │
│ - ContentTagRelation                    │
│ - ContentRelation                       │
├─────────────────────────────────────────┤
│ Custom Content Types (Article, etc.)    │  ← Dynamic content
└─────────────────────────────────────────┘
```

### Backward Compatibility

- ✅ System tables (User, Post) remain unchanged
- ✅ New CMS tables are additive, not breaking
- ✅ Existing content types continue to work
- ✅ Existing APIs remain functional

## Getting Started

### 1. Review the Schema

The enhanced schema is in `prisma/schema.prisma`. It includes:
- System tables (User, Post)
- CMS metadata tables (ContentMetadata, ContentRevision, etc.)
- Your custom content types (Article, Category, etc.)

### 2. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migration
npm run prisma:migrate

# Or do everything at once
npm run db:setup
```

### 3. Seed Sample Data

The seed file includes examples of all CMS features:

```bash
npm run prisma:seed
```

This creates:
- Users and articles
- SEO metadata for articles
- Content tags (Featured, Beginner Friendly, Advanced)
- Tagged articles
- Content revisions for audit trail
- Related article relationships

### 4. Use in Your Application

All CMS features are accessible via Prisma Client:

```typescript
import prisma from './db/prisma'

// Get article with metadata
const article = await prisma.article.findUnique({
  where: { id: 1 }
})

const metadata = await prisma.contentMetadata.findUnique({
  where: {
    contentType_contentId: {
      contentType: 'api::article.article',
      contentId: article.id
    }
  }
})

// Get article tags
const tags = await prisma.contentTagRelation.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: article.id
  },
  include: { tag: true }
})

// Get revision history
const revisions = await prisma.contentRevision.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: article.id
  },
  orderBy: { revisionNumber: 'desc' }
})
```

## Use Cases

### Content Publishing Platform

- Use **ContentMetadata** for SEO optimization
- Use **ContentRevision** for editorial workflow (draft → review → publish)
- Use **ContentTag** for categorization and filtering
- Use **ContentRelation** for "related articles" and "recommended reading"

### E-commerce

- Use **ContentMetadata** for product SEO
- Use **ContentTag** for product categories and filters
- Use **ContentRelation** for "related products" and "frequently bought together"
- Use **ContentRevision** for price history and inventory tracking

### Knowledge Base

- Use **ContentRelation** for article hierarchies (parent → children)
- Use **ContentTag** for topics and categories
- Use **ContentMetadata** for search optimization
- Use **ContentRevision** for change tracking and updates

### Multi-tenant CMS

- Use polymorphic design to support multiple content types per tenant
- Use **ContentTag** for tenant-specific categorization
- Use **ContentMetadata** for tenant-specific SEO
- Use **ContentRevision** for compliance and audit requirements

## API Integration

The CMS features integrate seamlessly with the Content Manager API:

```bash
# Get articles with their metadata
GET /api/content?contentType=api::article.article

# Get tagged content
GET /api/content?contentType=api::article.article&tagId=1

# Get content with revisions
GET /api/content?contentType=api::article.article&includeRevisions=true
```

See the Content Manager documentation for full API details.

## Documentation

- **[CMS Database Structure](./CMS_DATABASE_STRUCTURE.md)** - Complete database schema reference
- **[Content Type Builder](../CONTENT_TYPE_BUILDER.md)** - How to define custom content types
- **[Content Manager](../CONTENT_MANAGER.md)** - CRUD API for content management

## Best Practices

1. **Always create metadata for public content** - Improves SEO and social sharing
2. **Create revisions on significant changes** - Enables rollback and audit trail
3. **Use descriptive tag names** - Makes filtering and categorization intuitive
4. **Document relationship types** - Keep a list of used relationType values
5. **Clean up old revisions periodically** - Consider retention policies for storage

## Future Enhancements

Potential additions being considered:

- **ContentWorkflow** - Draft/Review/Approval workflows
- **ContentSchedule** - Scheduled publishing and expiration
- **ContentPermissions** - Fine-grained access control
- **ContentMedia** - Dedicated media library
- **ContentLocalization** - Multi-language support

## Support

For questions or issues:
- Review the [CMS Database Structure](./CMS_DATABASE_STRUCTURE.md) documentation
- Check the [Content Manager](../CONTENT_MANAGER.md) guide
- Open an issue on GitHub

---

**Built with ❤️ using Prisma, TypeScript, and tapi**
