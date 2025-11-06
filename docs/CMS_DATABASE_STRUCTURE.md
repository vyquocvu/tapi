# CMS Database Structure

This document describes the enhanced database structure for the tapi CMS feature, including system tables, CMS metadata tables, and custom content types.

## Overview

The database is organized into three main categories:

1. **System Tables** - Core authentication and basic content (User, Post)
2. **CMS Metadata Tables** - Enhanced CMS features that work with any content type
3. **Custom Content Types** - Dynamically defined through the Content Type Builder

## Table Categories

### System Tables

System tables are defined in `prisma/schema.original.prisma` and are **NOT** managed by the Content Type Builder. These provide core functionality for the application.

#### User

The central user/authentication model.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| email | String | Unique email address |
| password | String | Hashed password |
| name | String | User's display name |
| bio | String? | User biography |
| avatar | String? | Avatar image URL |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `articles` - One-to-many with Article (custom content type)
- `createdRevisions` - One-to-many with ContentRevision
- `createdMetadata` - One-to-many with ContentMetadata

#### Post

Basic content model for system-level posts.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| title | String | Post title |
| body | String | Post content |
| published | Boolean | Publication status |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| authorId | Int | Foreign key to User |

**Relations:**
- `author` - Many-to-one with User

---

### CMS Metadata Tables

These tables provide enhanced CMS functionality and work with **ANY** content type defined in the system. They use a polymorphic pattern with `contentType` and `contentId` fields.

#### ContentMetadata

SEO and metadata for any content type.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| contentType | String | Content type UID (e.g., "api::article.article") |
| contentId | Int | ID of the content record |
| metaTitle | String? | SEO meta title |
| metaDescription | String? | SEO meta description |
| metaKeywords | String? | SEO keywords |
| ogTitle | String? | Open Graph title |
| ogDescription | String? | Open Graph description |
| ogImage | String? | Open Graph image URL |
| customData | Json? | Flexible custom metadata field |
| createdById | Int | Foreign key to User |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `createdBy` - Many-to-one with User

**Constraints:**
- Unique: `[contentType, contentId]` - One metadata record per content item
- Index: `contentType`, `contentId`

**Usage Example:**
```typescript
// Add SEO metadata to an article
const metadata = await prisma.contentMetadata.create({
  data: {
    contentType: 'api::article.article',
    contentId: 123,
    metaTitle: 'Best TypeScript Practices',
    metaDescription: 'Learn the best practices for TypeScript development',
    metaKeywords: 'typescript, best practices, development',
    ogImage: 'https://example.com/og-image.jpg',
    createdById: userId
  }
})
```

#### ContentRevision

Audit trail and version history for any content type.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| contentType | String | Content type UID |
| contentId | Int | ID of the content record |
| revisionNumber | Int | Sequential version number |
| data | Json | Full snapshot of content at this revision |
| changeLog | String? | Optional description of changes |
| createdById | Int | Foreign key to User who created revision |
| createdAt | DateTime | Revision creation timestamp |

**Relations:**
- `createdBy` - Many-to-one with User

**Constraints:**
- Unique: `[contentType, contentId, revisionNumber]`
- Index: `[contentType, contentId]`, `createdAt`

**Usage Example:**
```typescript
// Create a revision when content is updated
const revision = await prisma.contentRevision.create({
  data: {
    contentType: 'api::article.article',
    contentId: articleId,
    revisionNumber: 5,
    data: articleSnapshot, // Full article data as JSON
    changeLog: 'Updated title and added new section',
    createdById: userId
  }
})

// Get revision history for an article
const history = await prisma.contentRevision.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: articleId
  },
  orderBy: { revisionNumber: 'desc' }
})
```

#### ContentTag

Flexible tagging system for any content type.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Tag name (e.g., "featured", "urgent") |
| slug | String | URL-friendly version |
| description | String? | Optional tag description |
| color | String? | Color for UI display (e.g., "#FF5733") |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `taggedContent` - One-to-many with ContentTagRelation

**Constraints:**
- Unique: `name`, `slug`

#### ContentTagRelation

Many-to-many relation between tags and any content.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| tagId | Int | Foreign key to ContentTag |
| contentType | String | Content type UID |
| contentId | Int | ID of the content record |
| createdAt | DateTime | Record creation timestamp |

**Relations:**
- `tag` - Many-to-one with ContentTag (cascade delete)

**Constraints:**
- Unique: `[tagId, contentType, contentId]`
- Index: `[contentType, contentId]`, `tagId`

**Usage Example:**
```typescript
// Tag an article as "featured"
const tagRelation = await prisma.contentTagRelation.create({
  data: {
    tagId: featuredTag.id,
    contentType: 'api::article.article',
    contentId: articleId
  }
})

// Get all tags for an article
const tags = await prisma.contentTagRelation.findMany({
  where: {
    contentType: 'api::article.article',
    contentId: articleId
  },
  include: {
    tag: true
  }
})

// Get all articles with a specific tag
const taggedArticles = await prisma.contentTagRelation.findMany({
  where: {
    contentType: 'api::article.article',
    tagId: featuredTag.id
  }
})
```

#### ContentRelation

Generic relationship between any two content items.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| sourceType | String | Content type UID of source |
| sourceId | Int | ID of source content |
| targetType | String | Content type UID of target |
| targetId | Int | ID of target content |
| relationType | String | Type of relation (e.g., "related", "parent") |
| createdAt | DateTime | Record creation timestamp |

**Constraints:**
- Unique: `[sourceType, sourceId, targetType, targetId, relationType]`
- Index: `[sourceType, sourceId]`, `[targetType, targetId]`

**Usage Example:**
```typescript
// Create a "related articles" relationship
const relation = await prisma.contentRelation.create({
  data: {
    sourceType: 'api::article.article',
    sourceId: 123,
    targetType: 'api::article.article',
    targetId: 456,
    relationType: 'related'
  }
})

// Get all related articles
const relatedArticles = await prisma.contentRelation.findMany({
  where: {
    sourceType: 'api::article.article',
    sourceId: articleId,
    relationType: 'related'
  }
})
```

---

### Custom Content Types

Custom content types are defined via the Content Type Builder in `content-types/definitions.json` and are automatically generated into the Prisma schema.

#### Article (Example)

Example custom content type for blog articles.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| title | String | Article title |
| slug | String | URL-friendly identifier (unique) |
| content | String | Article content |
| excerpt | String? | Short excerpt |
| published | Boolean | Publication status |
| publishedAt | DateTime? | Publication timestamp |
| viewCount | Int | Number of views |
| status | ArticleStatus | Draft/Published/Archived |
| authorId | Int | Foreign key to User |
| categoryId | Int? | Foreign key to Category |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `author` - Many-to-one with User
- `category` - Many-to-one with Category

#### Category (Example)

Example custom content type for article categories.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Category name |
| slug | String | URL-friendly identifier (unique) |
| description | String? | Category description |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `articles` - One-to-many with Article

---

## Database Architecture Principles

### Polymorphic Relationships

The CMS metadata tables (ContentMetadata, ContentRevision, ContentTag, ContentRelation) use a polymorphic pattern to work with any content type:

```
contentType: "api::article.article"  // Identifies the model
contentId: 123                       // Identifies the specific record
```

This allows these features to work with:
- Articles
- Products
- Pages
- Any custom content type you define

### Separation of Concerns

1. **System Tables** - Core functionality, stable, rarely changed
2. **CMS Metadata** - Enhanced features, work across all content types
3. **Custom Content** - Flexible, dynamically defined, frequently evolving

### Backward Compatibility

- System tables remain unchanged for existing functionality
- New CMS tables are additive, don't break existing features
- Custom content types can evolve independently

## Migration Strategy

When updating the database:

1. Review the generated `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update Prisma Client
4. Test with existing data to ensure compatibility

## Best Practices

### Using Metadata
- Add SEO metadata for all public-facing content
- Use customData JSON field for flexible metadata storage
- Keep metadata creation atomic with content creation

### Using Revisions
- Create revisions on every significant content change
- Include descriptive changeLogs for audit trails
- Consider automatic cleanup of old revisions (retention policy)

### Using Tags
- Keep tag names consistent (use slug for programmatic access)
- Use colors for visual categorization in UI
- Consider tag hierarchies via ContentRelation if needed

### Using Relations
- Use descriptive relationType values ("related", "parent", "child", "dependency")
- Consider bidirectional relations (A -> B and B -> A) for some use cases
- Index queries by relationType for performance

## Future Enhancements

Potential additions to the CMS database structure:

1. **ContentWorkflow** - Draft/Review/Approval workflows
2. **ContentSchedule** - Scheduled publishing and expiration
3. **ContentPermissions** - Fine-grained access control per content item
4. **ContentMedia** - Dedicated media library with relationships
5. **ContentLocalization** - Multi-language support

---

## Schema Generation

The schema is automatically generated from content type definitions. To regenerate:

```bash
npm run content-type:generate
```

This will:
1. Read `content-types/definitions.json`
2. Generate models for each content type
3. Include system tables automatically
4. Include CMS metadata tables
5. Write complete schema to `prisma/schema.prisma`

**Note:** System tables (User, Post) are predefined and won't be generated even if they appear in content type definitions.
