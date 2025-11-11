# Sheets API Documentation

## Overview

The Sheets API provides spreadsheet-like functionality for managing structured tabular data. Create, read, update, and delete sheets with columns and rows, similar to Excel or Google Sheets.

**Base URL**: `/api/sheets`

## Table of Contents

- [Authentication](#authentication)
- [Data Model](#data-model)
- [Endpoints](#endpoints)
  - [List Sheets](#list-sheets)
  - [Get Sheet](#get-sheet)
  - [Create Sheet](#create-sheet)
  - [Update Sheet](#update-sheet)
  - [Delete Sheet](#delete-sheet)
- [Examples](#examples)
- [Error Handling](#error-handling)

## Authentication

Most Sheets API endpoints require JWT authentication. Include your token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Public Access**: Sheets marked as `isPublic: true` can be read without authentication.

## Data Model

### Sheet Object

```typescript
{
  id: number              // Unique identifier
  title: string           // Sheet title
  description?: string    // Optional description
  columns: Column[]       // Column definitions
  rows: any[][]          // 2D array of row data
  ownerId?: number       // Owner user ID
  isPublic: boolean      // Public access flag
  createdAt: Date        // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Column Object

```typescript
{
  name: string           // Column name (must be unique within sheet)
  type: 'text' | 'number' | 'date' | 'boolean'  // Data type
  width?: number         // Optional column width in pixels
}
```

### Row Data

Rows are represented as arrays where each element corresponds to a column value:
```typescript
['John Doe', 30, '2024-01-15', true]  // matches columns: [name, age, date, active]
```

## Endpoints

### List Sheets

Get a list of sheets accessible to the authenticated user.

**Endpoint**: `GET /api/sheets`

**Query Parameters**:
- `skip` (optional): Number of records to skip for pagination (default: 0)
- `take` (optional): Number of records to return (default: unlimited, max: 100)
- `count` (optional): Set to "true" to include total count
- `ownerId` (optional): Filter by owner ID, or "me" for current user's sheets
- `orderBy` (optional): JSON string for sorting, e.g., `{"createdAt":"desc"}`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Employee Database",
      "description": "Company employee records",
      "columns": [
        { "name": "Name", "type": "text" },
        { "name": "Department", "type": "text" },
        { "name": "Salary", "type": "number" }
      ],
      "rows": [
        ["John Doe", "Engineering", 85000],
        ["Jane Smith", "Marketing", 75000]
      ],
      "ownerId": 1,
      "isPublic": false,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**With count**:
```json
{
  "success": true,
  "data": {
    "data": [ /* sheets */ ],
    "total": 25
  }
}
```

**Access Control**:
- Authenticated users with `sheets:read` permission: Can see their own sheets and public sheets
- Users without permission: Can only see public sheets
- Unauthenticated users: Can only see public sheets

---

### Get Sheet

Get a specific sheet by ID.

**Endpoint**: `GET /api/sheets?id={sheetId}`

**Path Parameters**:
- `id`: Sheet ID (integer)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Employee Database",
    "description": "Company employee records",
    "columns": [
      { "name": "Name", "type": "text" },
      { "name": "Department", "type": "text" },
      { "name": "Salary", "type": "number" }
    ],
    "rows": [
      ["John Doe", "Engineering", 85000],
      ["Jane Smith", "Marketing", 75000]
    ],
    "ownerId": 1,
    "isPublic": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Access Control**:
- Sheet must be public OR user must be the owner
- Returns 403 Forbidden if access denied

**Errors**:
- `404 Not Found`: Sheet doesn't exist
- `403 Forbidden`: No access to sheet

---

### Create Sheet

Create a new sheet.

**Endpoint**: `POST /api/sheets`

**Authentication**: Required

**Permission**: `sheets:create`

**Request Body**:
```json
{
  "title": "Product Inventory",
  "description": "Track product stock levels",
  "columns": [
    { "name": "Product", "type": "text" },
    { "name": "SKU", "type": "text" },
    { "name": "Quantity", "type": "number" },
    { "name": "In Stock", "type": "boolean" }
  ],
  "rows": [
    ["Widget A", "WDG-001", 150, true],
    ["Widget B", "WDG-002", 0, false]
  ],
  "isPublic": false
}
```

**Required Fields**:
- `title`: String, sheet title
- `columns`: Array of column objects (at least 1 required)

**Optional Fields**:
- `description`: String
- `rows`: Array of row arrays (default: empty)
- `isPublic`: Boolean (default: false)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Product Inventory",
    "description": "Track product stock levels",
    "columns": [ /* as provided */ ],
    "rows": [ /* as provided */ ],
    "ownerId": 1,
    "isPublic": false,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- At least one column required
- Column names must be unique within the sheet
- Valid column types: `text`, `number`, `date`, `boolean`
- Row length must match number of columns

**Errors**:
- `400 Bad Request`: Invalid data or validation failure
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing `sheets:create` permission

---

### Update Sheet

Update an existing sheet.

**Endpoint**: `PUT /api/sheets?id={sheetId}`

**Authentication**: Required

**Permission**: `sheets:update`

**Access Control**: Only the sheet owner can update

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "columns": [
    { "name": "Name", "type": "text" },
    { "name": "Email", "type": "text" }
  ],
  "rows": [
    ["John", "john@example.com"],
    ["Jane", "jane@example.com"]
  ],
  "isPublic": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Title",
    /* ... updated sheet data ... */
  }
}
```

**Validation Rules**:
- If updating columns, at least one column required
- Column names must be unique
- If updating rows, row length must match current column count

**Errors**:
- `400 Bad Request`: Invalid data or validation failure
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the sheet owner or missing permission
- `404 Not Found`: Sheet doesn't exist

---

### Delete Sheet

Delete a sheet permanently.

**Endpoint**: `DELETE /api/sheets?id={sheetId}`

**Authentication**: Required

**Permission**: `sheets:delete`

**Access Control**: Only the sheet owner can delete

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Sheet deleted successfully"
  }
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the sheet owner or missing permission
- `404 Not Found`: Sheet doesn't exist

---

## Examples

### Example 1: Create a Simple Contact List

```bash
curl -X POST http://localhost:5173/api/sheets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Contact List",
    "columns": [
      { "name": "Name", "type": "text" },
      { "name": "Email", "type": "text" },
      { "name": "Phone", "type": "text" }
    ],
    "rows": [
      ["Alice Johnson", "alice@example.com", "555-0101"],
      ["Bob Smith", "bob@example.com", "555-0102"]
    ],
    "isPublic": false
  }'
```

### Example 2: Get All Public Sheets

```bash
curl http://localhost:5173/api/sheets
```

### Example 3: Get My Sheets with Pagination

```bash
curl http://localhost:5173/api/sheets?ownerId=me&skip=0&take=10&count=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Update Sheet Title and Description

```bash
curl -X PUT http://localhost:5173/api/sheets?id=1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Contact List",
    "description": "My personal contacts"
  }'
```

### Example 5: Make a Sheet Public

```bash
curl -X PUT http://localhost:5173/api/sheets?id=1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "isPublic": true }'
```

### Example 6: Delete a Sheet

```bash
curl -X DELETE http://localhost:5173/api/sheets?id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Error Responses

**400 Bad Request - Missing Required Field**:
```json
{
  "success": false,
  "error": "Title is required and must be a string"
}
```

**400 Bad Request - Validation Error**:
```json
{
  "success": false,
  "error": "Column names must be unique"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden - No Permission**:
```json
{
  "success": false,
  "error": "You do not have permission to perform this action"
}
```

**403 Forbidden - Not Owner**:
```json
{
  "success": false,
  "error": "You do not have permission to update this sheet"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Sheet not found"
}
```

---

## Best Practices

1. **Column Design**: Plan your columns carefully before creating a sheet. Changing columns later requires updating all rows.

2. **Data Types**: Choose appropriate column types:
   - `text`: For strings, names, descriptions
   - `number`: For numeric values, IDs, quantities
   - `date`: For date/time values
   - `boolean`: For yes/no, true/false flags

3. **Access Control**: 
   - Keep sheets private by default
   - Only make sheets public if they contain non-sensitive data
   - Use authentication for accessing user-specific sheets

4. **Pagination**: When listing sheets, use pagination to improve performance:
   ```
   GET /api/sheets?skip=0&take=20
   ```

5. **Row Management**: For large sheets, consider:
   - Limiting initial row count
   - Adding rows incrementally
   - Using filters and pagination when reading

6. **Validation**: Always validate data before creating/updating:
   - Check row length matches columns
   - Ensure data types are appropriate
   - Validate column name uniqueness

---

## Integration Guide

### JavaScript/TypeScript Example

```typescript
// Sheet service wrapper
class SheetService {
  constructor(private baseUrl: string, private token: string) {}

  async createSheet(data: {
    title: string
    columns: Array<{ name: string; type: string }>
    rows?: any[][]
    description?: string
    isPublic?: boolean
  }) {
    const response = await fetch(`${this.baseUrl}/sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    })
    return await response.json()
  }

  async getSheet(id: number) {
    const response = await fetch(`${this.baseUrl}/sheets?id=${id}`, {
      headers: this.token ? {
        'Authorization': `Bearer ${this.token}`
      } : {}
    })
    return await response.json()
  }

  async listSheets(options?: {
    skip?: number
    take?: number
    ownerId?: number | 'me'
  }) {
    const params = new URLSearchParams()
    if (options?.skip) params.set('skip', options.skip.toString())
    if (options?.take) params.set('take', options.take.toString())
    if (options?.ownerId) params.set('ownerId', options.ownerId.toString())

    const response = await fetch(`${this.baseUrl}/sheets?${params}`, {
      headers: this.token ? {
        'Authorization': `Bearer ${this.token}`
      } : {}
    })
    return await response.json()
  }

  async updateSheet(id: number, data: Partial<{
    title: string
    description: string
    columns: Array<{ name: string; type: string }>
    rows: any[][]
    isPublic: boolean
  }>) {
    const response = await fetch(`${this.baseUrl}/sheets?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    })
    return await response.json()
  }

  async deleteSheet(id: number) {
    const response = await fetch(`${this.baseUrl}/sheets?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })
    return await response.json()
  }
}

// Usage
const sheets = new SheetService('http://localhost:5173/api', 'your-token')

// Create a sheet
const newSheet = await sheets.createSheet({
  title: 'My Data',
  columns: [
    { name: 'Name', type: 'text' },
    { name: 'Value', type: 'number' }
  ],
  rows: [
    ['Item 1', 100],
    ['Item 2', 200]
  ]
})

// List sheets
const mySheets = await sheets.listSheets({ ownerId: 'me', take: 10 })

// Update a sheet
await sheets.updateSheet(1, {
  title: 'Updated Title',
  isPublic: true
})
```

---

## Related Documentation

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Authentication](./API_REFERENCE.md#authentication) - Authentication guide
- [Content Manager](./CONTENT_MANAGER.md) - Dynamic content management
- [Getting Started](./GETTING_STARTED.md) - Setup and configuration
