# Content Type Builder

A modular, extensible content type builder for defining database models with automatic Prisma schema generation. Inspired by Strapi's content type builder.

## Features

- **Flexible Content Type Definition**: Define content types through configuration files or code
- **Automatic Schema Generation**: Auto-generate Prisma models from content type definitions
- **Rich Field Types**: Support for strings, numbers, dates, enums, relations, and more
- **Validation Support**: Built-in validation rules for fields
- **Migration Tracking**: Track and manage schema changes
- **Type-Safe**: Full TypeScript support with type inference
- **Extensible**: Easy to add new field types and relationships

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Defining Content Types](#defining-content-types)
- [Field Types](#field-types)
- [Relationships](#relationships)
- [Validations](#validations)
- [Schema Generation](#schema-generation)
- [Migrations](#migrations)
- [API Reference](#api-reference)
- [Examples](#examples)

## Installation

The content type builder is included in the vstack project. No additional installation required.

## Quick Start

### 1. Define Your Content Types

Create a content type definition file in `content-types/definitions.json`:

```json
{
  "api::article.article": {
    "uid": "api::article.article",
    "displayName": "Article",
    "singularName": "article",
    "pluralName": "articles",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      },
      "content": {
        "type": "text",
        "required": true
      },
      "published": {
        "type": "boolean",
        "default": false
      }
    },
    "options": {
      "timestamps": true
    }
  }
}
```

### 2. Generate Prisma Schema

Run the generation command:

```bash
npm run content-type:generate
```

This will create/update your `prisma/schema.prisma` file with the generated models.

### 3. Apply Migrations

After generating the schema, apply migrations:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Defining Content Types

### Using JSON Configuration

The simplest way to define content types is through JSON files:

```json
{
  "api::post.post": {
    "uid": "api::post.post",
    "displayName": "Post",
    "singularName": "post",
    "pluralName": "posts",
    "description": "Blog post content type",
    "fields": {
      "title": {
        "type": "string",
        "required": true,
        "maxLength": 255
      },
      "slug": {
        "type": "string",
        "unique": true,
        "required": true
      }
    },
    "options": {
      "timestamps": true,
      "softDelete": false
    }
  }
}
```

### Using the Builder API

For more programmatic control, use the TypeScript builder API:

```typescript
import { ContentTypeBuilder, string, text, boolean } from './src/content-type-builder'

const builder = new ContentTypeBuilder()

const articleType = ContentTypeBuilder.create('api::article.article')
  .displayName('Article')
  .singularName('article')
  .pluralName('articles')
  .description('Blog article')
  .field('title', string({ required: true, maxLength: 255 }))
  .field('content', text({ required: true }))
  .field('published', boolean({ default: false }))
  .timestamps(true)
  .build()

builder.define(articleType)
```

## Field Types

### String Types

- **string**: Short text (VARCHAR)
- **text**: Long text (TEXT)
- **richtext**: Rich text content
- **email**: Email address with validation
- **password**: Password field (hashed)
- **uid**: Unique identifier string

```json
{
  "title": { "type": "string", "maxLength": 255 },
  "content": { "type": "text" },
  "email": { "type": "email", "unique": true },
  "password": { "type": "password", "required": true }
}
```

### Number Types

- **integer**: 32-bit integer
- **biginteger**: 64-bit integer
- **float**: Floating point number
- **decimal**: Decimal number

```json
{
  "age": { "type": "integer", "min": 0, "max": 150 },
  "price": { "type": "decimal", "min": 0 },
  "rating": { "type": "float", "min": 0, "max": 5 }
}
```

### Boolean Type

```json
{
  "published": { "type": "boolean", "default": false },
  "featured": { "type": "boolean" }
}
```

### Date/Time Types

- **date**: Date only (YYYY-MM-DD)
- **datetime**: Date and time
- **time**: Time only

```json
{
  "publishedAt": { "type": "datetime" },
  "birthDate": { "type": "date" },
  "openTime": { "type": "time" }
}
```

### Enumeration Type

Define a field with predefined values:

```json
{
  "status": {
    "type": "enumeration",
    "values": ["draft", "published", "archived"],
    "default": "draft"
  }
}
```

### JSON Type

Store arbitrary JSON data:

```json
{
  "metadata": { "type": "json" },
  "settings": { "type": "json" }
}
```

## Relationships

### One-to-One

```json
{
  "profile": {
    "type": "relation",
    "relationType": "oneToOne",
    "target": "api::profile.profile"
  }
}
```

### One-to-Many

```json
{
  "posts": {
    "type": "relation",
    "relationType": "oneToMany",
    "target": "api::post.post"
  }
}
```

### Many-to-One

```json
{
  "author": {
    "type": "relation",
    "relationType": "manyToOne",
    "target": "api::user.user",
    "required": true
  }
}
```

### Many-to-Many

```json
{
  "tags": {
    "type": "relation",
    "relationType": "manyToMany",
    "target": "api::tag.tag"
  }
}
```

## Validations

Fields support various validation rules:

```json
{
  "email": {
    "type": "email",
    "required": true,
    "unique": true
  },
  "username": {
    "type": "string",
    "required": true,
    "minLength": 3,
    "maxLength": 50,
    "unique": true
  },
  "age": {
    "type": "integer",
    "required": true,
    "min": 0,
    "max": 150
  }
}
```

## Schema Generation

### Generate Prisma Schema

```bash
node scripts/content-types/generate.mjs
```

This command:
1. Reads content type definitions from `content-types/definitions.json`
2. Generates Prisma models with proper types and relations
3. Writes the schema to `prisma/schema.prisma`
4. Creates enum definitions for enumeration fields

### Generated Output

For an Article content type, the generator creates:

```prisma
model Article {
  id          Int       @id @default(autoincrement())
  title       String
  slug        String    @unique
  content     String
  published   Boolean   @default(false)
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Migrations

### Track Changes

The migration manager tracks content type changes:

```typescript
import { MigrationManager } from './src/content-type-builder'

const migrationManager = new MigrationManager()

// Check for pending migrations
const pending = migrationManager.getPendingMigrations()
console.log(`Pending migrations: ${pending.length}`)

// Get applied migrations
const applied = migrationManager.getAppliedMigrations()
console.log(`Applied migrations: ${applied.length}`)
```

### Create Migrations

After modifying content types:

```bash
# Generate new schema
npm run content-type:generate

# Create and apply Prisma migration
npm run prisma:migrate
```

### Rollback Support

Migrations include rollback information for reverting changes.

## API Reference

### ContentTypeBuilder

Main class for managing content types.

```typescript
const builder = new ContentTypeBuilder()

// Define a content type
builder.define(contentTypeDefinition)

// Get a content type
const article = builder.get('api::article.article')

// Get all content types
const all = builder.getAll()

// Check if exists
const exists = builder.has('api::article.article')

// Remove a content type
builder.remove('api::article.article')

// Clear all
builder.clear()
```

### ContentTypeDefinitionBuilder

Fluent API for building content types.

```typescript
const definition = ContentTypeBuilder.create('api::post.post')
  .displayName('Post')
  .singularName('post')
  .pluralName('posts')
  .description('Blog post')
  .field('title', string({ required: true }))
  .field('content', text())
  .timestamps(true)
  .softDelete(false)
  .tableName('custom_posts')
  .build()
```

### Field Helpers

Convenience functions for creating fields:

```typescript
import {
  string,
  text,
  email,
  password,
  integer,
  boolean,
  datetime,
  enumeration,
  json,
  manyToOne,
  oneToMany,
} from './src/content-type-builder'

// String fields
string({ required: true, maxLength: 255 })
text({ required: true })
email({ unique: true })
password({ required: true })

// Number fields
integer({ min: 0, max: 100 })
float({ default: 0.0 })

// Other types
boolean({ default: false })
datetime({ default: 'now' })
enumeration(['draft', 'published'])
json()

// Relations
manyToOne('api::user.user', { required: true })
oneToMany('api::post.post')
```

### PrismaSchemaGenerator

Generates Prisma schemas from content types.

```typescript
import { prismaSchemaGenerator } from './src/content-type-builder'

const contentTypes = builder.getAll()
const result = prismaSchemaGenerator.generate(contentTypes)

console.log(result.prismaSchema) // Full schema
console.log(result.models) // Model names
```

### MigrationManager

Manages migrations and tracks changes.

```typescript
import { MigrationManager } from './src/content-type-builder'

const manager = new MigrationManager()

// Create a migration
const migration = manager.createMigration(
  'add_article_fields',
  ['api::article.article'],
  'ALTER TABLE ...', // up
  'ALTER TABLE ...'  // down
)

// Mark as applied
manager.markAsApplied(migration.id)

// Get pending
const pending = manager.getPendingMigrations()
```

## Examples

### Complete Blog Example

See `content-types/examples/blog-example.json` for a complete blog content type system with:
- Articles
- Categories
- Users (authors)
- Relations between them

### Creating an E-commerce System

```json
{
  "api::product.product": {
    "uid": "api::product.product",
    "displayName": "Product",
    "singularName": "product",
    "pluralName": "products",
    "fields": {
      "name": { "type": "string", "required": true },
      "sku": { "type": "string", "unique": true, "required": true },
      "price": { "type": "decimal", "required": true, "min": 0 },
      "stock": { "type": "integer", "default": 0 },
      "status": {
        "type": "enumeration",
        "values": ["active", "inactive", "discontinued"]
      },
      "category": {
        "type": "relation",
        "relationType": "manyToOne",
        "target": "api::category.category"
      }
    },
    "options": { "timestamps": true }
  }
}
```

## Best Practices

1. **Use Descriptive UIDs**: Follow the pattern `api::<singular>.<singular>` for consistency
2. **Enable Timestamps**: Keep `timestamps: true` for audit trails
3. **Validate Inputs**: Use validation rules to ensure data integrity
4. **Document Relations**: Add descriptions to clarify relationship purposes
5. **Version Control**: Commit content type definitions to version control
6. **Test Migrations**: Always review generated schemas before applying

## Troubleshooting

### Common Issues

**Issue**: "Content type must have a uid"
- Ensure all content types have a unique `uid` field

**Issue**: "Relation target not found"
- Verify the target content type exists and uses the correct uid

**Issue**: "Migration failed"
- Review the generated Prisma schema for syntax errors
- Check for conflicting field names or relations

## Future Enhancements

- UI for visual content type builder
- Custom field type plugins
- Automatic migration generation from content type changes
- Integration with other ORMs (TypeORM, Sequelize)
- GraphQL schema generation
- REST API generation

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## License

MIT
