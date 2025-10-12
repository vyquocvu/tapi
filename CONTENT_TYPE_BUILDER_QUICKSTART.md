# Content Type Builder - Quick Start Guide

This guide will help you get started with the Content Type Builder in 5 minutes.

## What is the Content Type Builder?

The Content Type Builder allows you to define your database models using a simple JSON format or TypeScript API, then automatically generate Prisma schemas from those definitions. It's inspired by Strapi's content type builder and makes database schema management easier and more maintainable.

## Quick Example

### Step 1: Define Your Content Types

Create or edit `content-types/definitions.json`:

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

### Step 2: Generate Prisma Schema

```bash
npm run content-type:generate
```

This creates a Prisma schema:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Step 3: Apply to Database

```bash
npm run prisma:migrate
npm run prisma:generate
```

That's it! Your database now has the new schema.

## Using Examples

We provide a complete blog example. Try it:

```bash
# Copy the blog example
cp content-types/examples/blog-example.json content-types/definitions.json

# Generate the schema
npm run content-type:generate

# Review the generated schema
cat prisma/schema.prisma

# Apply it (optional - this will change your database)
# npm run prisma:migrate
```

## Available Field Types

- **string** - Short text (VARCHAR)
- **text** - Long text (TEXT)
- **email** - Email with validation
- **password** - Password field
- **integer** - Whole numbers
- **float** / **decimal** - Decimal numbers
- **boolean** - True/false values
- **date** / **datetime** - Date and time
- **enumeration** - Predefined values
- **json** - JSON data
- **relation** - Relationships between models

## Relationship Types

- **oneToOne** - One-to-one relationship
- **oneToMany** - One-to-many relationship
- **manyToOne** - Many-to-one relationship
- **manyToMany** - Many-to-many relationship

## Common Use Cases

### Adding a New Model

1. Add to `content-types/definitions.json`
2. Run `npm run content-type:generate`
3. Run `npm run prisma:migrate`

### Adding Fields to Existing Model

1. Update the model in `content-types/definitions.json`
2. Run `npm run content-type:generate`
3. Run `npm run prisma:migrate`

### Adding Relationships

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

## Restore Original Schema

If you want to go back to the original User/Post schema:

```bash
cp prisma/schema.original.prisma prisma/schema.prisma
npm run prisma:migrate
npm run prisma:generate
```

## Next Steps

- Read the full documentation: [CONTENT_TYPE_BUILDER.md](./CONTENT_TYPE_BUILDER.md)
- Check out more examples in `content-types/examples/`
- Learn about the TypeScript API for programmatic content type creation

## Tips

1. **Always review** the generated schema before running migrations
2. **Keep backups** of your schema before making changes
3. **Use version control** to track content type changes
4. **Test locally** before deploying to production

## Troubleshooting

**Issue**: Command not found
- Make sure you're in the project root
- Run `npm install` first

**Issue**: Schema generation fails
- Check your `definitions.json` for syntax errors
- Validate JSON at https://jsonlint.com

**Issue**: Migration fails
- Review the generated Prisma schema
- Check for conflicting model names or field names
- Ensure referenced relations exist

## Getting Help

- Read the full docs: [CONTENT_TYPE_BUILDER.md](./CONTENT_TYPE_BUILDER.md)
- Check examples: `content-types/examples/`
- Review the generated schema: `prisma/schema.prisma`
