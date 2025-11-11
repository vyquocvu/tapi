# REST API Documentation

Comprehensive REST API reference for the vStack CMS platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Content API](#content-api)
- [Content Type Builder API](#content-type-builder-api)
- [Authentication API](#authentication-api)
- [Sheets API](./SHEETS_API.md) - Spreadsheet data management
- [API Dashboard](#api-dashboard)

## Overview

The vStack REST API provides programmatic access to manage content, content types, and system resources. All endpoints follow RESTful conventions and return JSON responses.

**Base URL (Development)**: `http://localhost:5173/api`
**Base URL (Production)**: `https://your-domain.com/api`

## Authentication

Most API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

## Request/Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "timestamp": "2025-10-17T05:42:42.332Z"
  }
}
```

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details or validation errors",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-17T05:42:42.332Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `BAD_REQUEST` | 400 | Invalid request format |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `SERVER_ERROR` | 500 | Internal server error |

## Error Handling

### Validation Errors

When validation fails, the response includes detailed error information:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Field 'title' is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-10-17T05:42:42.332Z"
}
```

## Rate Limiting

API endpoints have rate limits to ensure fair usage:

- **Default**: 100 requests per minute per IP
- **Authenticated users**: 1000 requests per minute
- **Content creation**: 50 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634472122
```

## Pagination

List endpoints support pagination using `skip` and `take` parameters:

```bash
GET /api/content?contentType=api::article.article&skip=0&take=20
```

**Parameters:**
- `skip`: Number of items to skip (default: 0)
- `take`: Number of items to return (max: 100, default: 10)
- `count`: Include total count in response (`true`/`false`)

**Response with pagination:**
```json
{
  "success": true,
  "data": [ /* items */ ],
  "meta": {
    "total": 150,
    "timestamp": "2025-10-17T05:42:42.332Z"
  }
}
```

## Content API

Dynamic CRUD operations for all content types.

### List All Entries

Get all entries for a content type.

```bash
GET /api/content?contentType=api::article.article
Authorization: Bearer <token>
```

**Query Parameters:**
- `contentType` (required): Content type UID (format: `api::model-name.model-name`)
- `where`: JSON filter object
- `orderBy`: JSON sort object
- `skip`: Pagination offset
- `take`: Number of items to return
- `count`: Include total count

**Example with filters:**
```bash
GET /api/content?contentType=api::article.article&where={"published":true}&orderBy={"createdAt":"desc"}&skip=0&take=10&count=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started",
      "slug": "getting-started",
      "content": "Article content...",
      "published": true,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42
  }
}
```

### Get Single Entry

Get a specific entry by ID.

```bash
GET /api/content?contentType=api::article.article&id=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started",
    "slug": "getting-started",
    "content": "Article content...",
    "published": true,
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
}
```

### Create Entry

Create a new content entry.

```bash
POST /api/content?contentType=api::article.article
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Article",
  "slug": "new-article",
  "content": "This is the article content",
  "published": false,
  "authorId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "New Article",
    "slug": "new-article",
    "content": "This is the article content",
    "published": false,
    "authorId": 1,
    "createdAt": "2025-10-17T05:42:42.332Z",
    "updatedAt": "2025-10-17T05:42:42.332Z"
  }
}
```

### Update Entry

Update an existing entry.

```bash
PUT /api/content?contentType=api::article.article&id=2
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "published": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Updated Title",
    "slug": "new-article",
    "content": "This is the article content",
    "published": true,
    "authorId": 1,
    "createdAt": "2025-10-17T05:42:42.332Z",
    "updatedAt": "2025-10-17T06:00:00.000Z"
  }
}
```

### Delete Entry

Delete an entry.

```bash
DELETE /api/content?contentType=api::article.article&id=2
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Entry deleted successfully"
  }
}
```

## Content Type Builder API

Manage content type definitions.

### List Content Types

Get all content type definitions.

```bash
GET /api/content-types
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "api::article.article": {
      "uid": "api::article.article",
      "displayName": "Article",
      "singularName": "article",
      "pluralName": "articles",
      "description": "Blog articles",
      "fields": {
        "title": {
          "type": "string",
          "required": true
        },
        "content": {
          "type": "text",
          "required": true
        }
      }
    }
  }
}
```

### Get Content Type

Get a specific content type definition.

```bash
GET /api/content-types?uid=api::article.article
Authorization: Bearer <token>
```

### Create Content Type

Create a new content type definition.

```bash
POST /api/content-types
Authorization: Bearer <token>
Content-Type: application/json

{
  "uid": "api::product.product",
  "displayName": "Product",
  "singularName": "product",
  "pluralName": "products",
  "description": "E-commerce products",
  "fields": {
    "name": {
      "type": "string",
      "required": true
    },
    "price": {
      "type": "decimal",
      "required": true
    },
    "inStock": {
      "type": "boolean",
      "default": true
    }
  }
}
```

### Update Content Type

Update an existing content type definition.

```bash
PUT /api/content-types?uid=api::product.product
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "fields": {
    "name": {
      "type": "string",
      "required": true
    },
    "price": {
      "type": "decimal",
      "required": true
    },
    "discount": {
      "type": "float"
    }
  }
}
```

### Delete Content Type

Delete a content type definition.

```bash
DELETE /api/content-types?uid=api::product.product
Authorization: Bearer <token>
```

## Authentication API

### Login

Authenticate and receive a JWT token.

```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### Get Current User

Get authenticated user information.

```bash
GET /api/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2025-10-01T00:00:00.000Z"
    }
  }
}
```

## API Dashboard

Endpoints for API management and monitoring.

### Get API Statistics

```bash
GET /api/api-dashboard?action=statistics
Authorization: Bearer <token>
```

### Get Recent Activity

```bash
GET /api/api-dashboard?action=activity&limit=10
Authorization: Bearer <token>
```

### Get Endpoint Documentation

```bash
GET /api/api-dashboard?action=documentation
Authorization: Bearer <token>
```

### Generate Content Type Documentation

```bash
GET /api/api-dashboard?action=generate-docs&contentType=api::article.article
Authorization: Bearer <token>
```

### Generate OpenAPI Specification

```bash
GET /api/api-dashboard?action=openapi&contentType=api::article.article
Authorization: Bearer <token>
```

## Best Practices

### Security

1. **Always use HTTPS** in production
2. **Keep JWT tokens secure** - store in secure storage, not localStorage
3. **Rotate tokens regularly** - implement token refresh mechanism
4. **Validate all inputs** - use provided validation utilities
5. **Rate limit requests** - respect rate limits to avoid throttling

### Performance

1. **Use pagination** - always paginate large result sets
2. **Filter on the server** - use `where` parameter instead of client-side filtering
3. **Request only needed fields** - use `select` parameter when available
4. **Cache responses** - implement client-side caching for frequently accessed data
5. **Batch operations** - combine related operations when possible

### Error Handling

1. **Check response status** - always check `success` field
2. **Handle all error codes** - implement proper error handling for all error codes
3. **Display user-friendly messages** - translate technical errors to user-friendly messages
4. **Log errors** - implement proper error logging for debugging
5. **Retry on failures** - implement exponential backoff for transient errors

## Examples

### Complete CRUD Workflow

```javascript
// 1. Login
const loginResponse = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
})
const { data: { token } } = await loginResponse.json()

// 2. Create an article
const createResponse = await fetch('/api/content?contentType=api::article.article', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'My Article',
    slug: 'my-article',
    content: 'Article content...',
    authorId: 1
  })
})
const { data: article } = await createResponse.json()

// 3. Update the article
const updateResponse = await fetch(`/api/content?contentType=api::article.article&id=${article.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    published: true
  })
})

// 4. Get all published articles
const listResponse = await fetch(
  '/api/content?contentType=api::article.article&where={"published":true}&take=10&count=true',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
const { data: articles, meta } = await listResponse.json()
console.log(`Total published articles: ${meta.total}`)

// 5. Delete the article
await fetch(`/api/content?contentType=api::article.article&id=${article.id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Support

For issues or questions:
- Open an issue on GitHub
- See the API management features in [FEATURES.md](./FEATURES.md) for more details
- Review the [Content Manager Documentation](./CONTENT_MANAGER.md)

## Changelog

### Version 1.1.0 (2025-10-17)
- ✅ Enhanced validation and error handling
- ✅ Standardized API response format
- ✅ Added comprehensive error codes
- ✅ Improved input validation
- ✅ Added detailed API documentation

### Version 1.0.0
- Initial release
- Content CRUD operations
- Content Type Builder
- JWT authentication
- API Dashboard
