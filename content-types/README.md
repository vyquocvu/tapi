# Content Types

This directory contains content type definitions for the project.

## Structure

- `definitions.json` - Active content type definitions (used by the generator)
- `examples/` - Example content type definitions
- `migrations/` - Migration history and tracking

## Quick Start

### 1. Define Content Types

Copy an example or create your own `definitions.json`:

```bash
cp examples/blog-example.json definitions.json
```

Or create your own following the structure in the examples.

### 2. Generate Prisma Schema

Run the generator:

```bash
npm run content-type:generate
```

### 3. Apply Migrations

After generating the schema:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Documentation

See the main [Content Type Builder Documentation](../CONTENT_TYPE_BUILDER.md) for:
- Full field type reference
- Relationship types
- Validation options
- API usage
- Examples

## Examples

### Blog Content Types

See `examples/blog-example.json` for a complete blog system with:
- Articles
- Categories
- Users (authors)
- Relations

### Using the Builder API

See `examples/blog-content-types.ts` for programmatic content type definition using TypeScript.

## Notes

- The `definitions.json` file is the source of truth for schema generation
- Always review generated Prisma schemas before applying migrations
- Keep content type definitions in version control
