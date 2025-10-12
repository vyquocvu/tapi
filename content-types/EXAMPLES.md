# Content Type Builder - Usage Examples

This document provides practical examples of using the Content Type Builder.

## Table of Contents

- [Basic Content Type](#basic-content-type)
- [Content Type with Relations](#content-type-with-relations)
- [Using Field Helpers](#using-field-helpers)
- [E-commerce Example](#e-commerce-example)
- [Blog Example](#blog-example)
- [Programmatic API Example](#programmatic-api-example)

## Basic Content Type

Create a simple content type with basic fields:

```json
{
  "api::page.page": {
    "uid": "api::page.page",
    "displayName": "Page",
    "singularName": "page",
    "pluralName": "pages",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      },
      "slug": {
        "type": "string",
        "unique": true,
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

Generated Prisma model:

```prisma
model Page {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Content Type with Relations

### One-to-Many Relationship

Author has many posts:

```json
{
  "api::author.author": {
    "uid": "api::author.author",
    "displayName": "Author",
    "singularName": "author",
    "pluralName": "authors",
    "fields": {
      "name": {
        "type": "string",
        "required": true
      },
      "email": {
        "type": "email",
        "unique": true,
        "required": true
      },
      "posts": {
        "type": "relation",
        "relationType": "oneToMany",
        "target": "api::post.post"
      }
    },
    "options": {
      "timestamps": true
    }
  },
  "api::post.post": {
    "uid": "api::post.post",
    "displayName": "Post",
    "singularName": "post",
    "pluralName": "posts",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      },
      "content": {
        "type": "text",
        "required": true
      },
      "author": {
        "type": "relation",
        "relationType": "manyToOne",
        "target": "api::author.author",
        "required": true
      }
    },
    "options": {
      "timestamps": true
    }
  }
}
```

### Many-to-Many Relationship

Posts can have multiple tags, tags can be on multiple posts:

```json
{
  "api::post.post": {
    "uid": "api::post.post",
    "displayName": "Post",
    "singularName": "post",
    "pluralName": "posts",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      },
      "tags": {
        "type": "relation",
        "relationType": "manyToMany",
        "target": "api::tag.tag"
      }
    },
    "options": {
      "timestamps": true
    }
  },
  "api::tag.tag": {
    "uid": "api::tag.tag",
    "displayName": "Tag",
    "singularName": "tag",
    "pluralName": "tags",
    "fields": {
      "name": {
        "type": "string",
        "required": true,
        "unique": true
      },
      "posts": {
        "type": "relation",
        "relationType": "manyToMany",
        "target": "api::post.post"
      }
    },
    "options": {
      "timestamps": true
    }
  }
}
```

## Using Field Helpers

TypeScript API with field helper functions:

```typescript
import {
  ContentTypeBuilder,
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

const product = ContentTypeBuilder.create('api::product.product')
  .displayName('Product')
  .singularName('product')
  .pluralName('products')
  .field('name', string({ required: true, maxLength: 255 }))
  .field('sku', string({ required: true, unique: true }))
  .field('description', text())
  .field('price', decimal({ required: true, min: 0 }))
  .field('stock', integer({ default: 0, min: 0 }))
  .field('status', enumeration(['active', 'inactive', 'discontinued']))
  .field('metadata', json())
  .timestamps(true)
  .build()
```

## E-commerce Example

Complete e-commerce system with products, orders, and customers.

See `content-types/examples/ecommerce-example.json` for the full example.

### Key Features:
- Products with SKU, pricing, stock management
- Categories with parent-child relationships
- Tags for product classification
- Orders with order items
- Customers with order history
- JSON fields for addresses

Usage:
```bash
# Use the e-commerce example
cp content-types/examples/ecommerce-example.json content-types/definitions.json

# Generate schema
npm run content-type:generate

# Apply to database
npm run prisma:migrate
```

## Blog Example

Complete blog system with articles, categories, and users.

See `content-types/examples/blog-example.json` for the full example.

### Key Features:
- Articles with title, content, status
- Categories for organization
- User authors with bio and avatar
- Enumeration for article status
- View count tracking
- Published/draft workflow

Usage:
```bash
# Use the blog example
cp content-types/examples/blog-example.json content-types/definitions.json

# Generate schema
npm run content-type:generate

# Apply to database
npm run prisma:migrate
```

## Programmatic API Example

Build content types using the TypeScript API:

```typescript
import { ContentTypeBuilder } from './src/content-type-builder'
import * as fields from './src/content-type-builder/field-helpers'

const builder = new ContentTypeBuilder()

// Define Event content type
const event = ContentTypeBuilder.create('api::event.event')
  .displayName('Event')
  .singularName('event')
  .pluralName('events')
  .description('Calendar event')
  .field('title', fields.string({ required: true, maxLength: 255 }))
  .field('description', fields.text())
  .field('startDate', fields.datetime({ required: true }))
  .field('endDate', fields.datetime())
  .field('location', fields.string())
  .field('capacity', fields.integer({ min: 0 }))
  .field('price', fields.decimal({ min: 0, default: 0 }))
  .field('status', fields.enumeration(
    ['draft', 'published', 'cancelled'],
    { default: 'draft' }
  ))
  .field('organizer', fields.manyToOne('api::user.user', { required: true }))
  .field('attendees', fields.manyToMany('api::user.user'))
  .timestamps(true)
  .softDelete(true)
  .build()

builder.define(event)

// Export for schema generation
export default builder.getAll()
```

## Field Type Reference

### String Fields
```json
{
  "shortText": { "type": "string", "maxLength": 100 },
  "longText": { "type": "text" },
  "richContent": { "type": "richtext" },
  "emailAddress": { "type": "email", "unique": true },
  "hashedPassword": { "type": "password" },
  "uniqueId": { "type": "uid" }
}
```

### Number Fields
```json
{
  "age": { "type": "integer", "min": 0, "max": 150 },
  "views": { "type": "biginteger", "default": 0 },
  "rating": { "type": "float", "min": 0, "max": 5 },
  "price": { "type": "decimal", "min": 0 }
}
```

### Date/Time Fields
```json
{
  "birthDate": { "type": "date" },
  "publishedAt": { "type": "datetime" },
  "openTime": { "type": "time" }
}
```

### Boolean Fields
```json
{
  "published": { "type": "boolean", "default": false },
  "featured": { "type": "boolean" }
}
```

### Enumeration Fields
```json
{
  "status": {
    "type": "enumeration",
    "values": ["draft", "review", "published"],
    "default": "draft"
  }
}
```

### JSON Fields
```json
{
  "metadata": { "type": "json" },
  "settings": { "type": "json" }
}
```

## Validation Examples

### Required Fields
```json
{
  "email": {
    "type": "email",
    "required": true,
    "unique": true
  }
}
```

### Length Constraints
```json
{
  "username": {
    "type": "string",
    "required": true,
    "minLength": 3,
    "maxLength": 50
  }
}
```

### Number Ranges
```json
{
  "age": {
    "type": "integer",
    "required": true,
    "min": 0,
    "max": 150
  }
}
```

### Unique Fields
```json
{
  "slug": {
    "type": "string",
    "unique": true,
    "required": true
  }
}
```

## Advanced Patterns

### Self-Referencing Relations

Categories with parent-child hierarchy:

```json
{
  "api::category.category": {
    "uid": "api::category.category",
    "displayName": "Category",
    "singularName": "category",
    "pluralName": "categories",
    "fields": {
      "name": {
        "type": "string",
        "required": true
      },
      "parent": {
        "type": "relation",
        "relationType": "manyToOne",
        "target": "api::category.category"
      },
      "children": {
        "type": "relation",
        "relationType": "oneToMany",
        "target": "api::category.category"
      }
    },
    "options": {
      "timestamps": true
    }
  }
}
```

### Soft Deletes

Add soft delete support:

```json
{
  "api::post.post": {
    "uid": "api::post.post",
    "displayName": "Post",
    "singularName": "post",
    "pluralName": "posts",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      }
    },
    "options": {
      "timestamps": true,
      "softDelete": true
    }
  }
}
```

This adds a `deletedAt` field to the model.

### Custom Table Names

Use custom database table names:

```json
{
  "api::post.post": {
    "uid": "api::post.post",
    "displayName": "Post",
    "singularName": "post",
    "pluralName": "posts",
    "fields": {
      "title": {
        "type": "string",
        "required": true
      }
    },
    "options": {
      "tableName": "blog_posts"
    }
  }
}
```

## Tips and Best Practices

1. **Use UIDs consistently**: Follow the pattern `api::<singular>.<singular>`
2. **Always add timestamps**: Use `"timestamps": true` for audit trails
3. **Validate required fields**: Mark essential fields as `required: true`
4. **Use unique constraints**: Add `unique: true` for fields that must be unique
5. **Document your models**: Add `description` to content types
6. **Test before migrating**: Run `content-type:generate` and review the schema
7. **Version control**: Keep content type definitions in git

## Troubleshooting

### Common Issues

**Relation target not found**
- Ensure the target content type exists in the same definitions file
- Check the UID is correctly spelled

**Invalid enum values**
- Enum values must be valid Prisma identifiers (no spaces, special characters)
- Start with a letter

**Migration conflicts**
- Review generated schema before applying
- Check for naming conflicts with existing tables
- Ensure field types are compatible

## Next Steps

- Read the [Full Documentation](../CONTENT_TYPE_BUILDER.md)
- Check the [Quick Start Guide](../CONTENT_TYPE_BUILDER_QUICKSTART.md)
- Explore more examples in `content-types/examples/`
- Test the builder with `npm run content-type:test`
