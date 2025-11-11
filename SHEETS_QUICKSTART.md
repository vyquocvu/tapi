# Sheets API - Quick Start Guide

The Sheets API provides spreadsheet-like functionality for managing structured tabular data in your application.

## Features

- ✅ Create and manage spreadsheet-style data structures
- ✅ Define custom columns with type validation (text, number, date, boolean)
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Row and cell-level operations
- ✅ Access control (private/public sheets)
- ✅ Permission-based security
- ✅ RESTful API with JSON responses

## Quick Example

### 1. Create a Sheet

```bash
curl -X POST http://localhost:5173/api/sheets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Employee Database",
    "columns": [
      {"name": "Name", "type": "text"},
      {"name": "Department", "type": "text"},
      {"name": "Salary", "type": "number"}
    ],
    "rows": [
      ["John Doe", "Engineering", 85000],
      ["Jane Smith", "Marketing", 75000]
    ]
  }'
```

### 2. List Your Sheets

```bash
curl http://localhost:5173/api/sheets?ownerId=me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get a Specific Sheet

```bash
curl http://localhost:5173/api/sheets?id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update a Sheet

```bash
curl -X PUT http://localhost:5173/api/sheets?id=1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "isPublic": true
  }'
```

### 5. Delete a Sheet

```bash
curl -X DELETE http://localhost:5173/api/sheets?id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Structure

### Sheet Object

```typescript
{
  id: number              // Unique identifier
  title: string           // Sheet title
  description?: string    // Optional description
  columns: Array<{        // Column definitions
    name: string          // Column name (unique)
    type: 'text' | 'number' | 'date' | 'boolean'
    width?: number        // Optional display width
  }>
  rows: any[][]          // 2D array of cell values
  ownerId?: number       // Owner user ID
  isPublic: boolean      // Public access flag
  createdAt: Date        // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

## Access Control

- **Private Sheets** (default): Only the owner can view and edit
- **Public Sheets**: Anyone can view, only owner can edit
- **Permissions**: Requires `sheets:read`, `sheets:create`, `sheets:update`, or `sheets:delete` permissions

## Common Use Cases

### Contact List

```json
{
  "title": "Contacts",
  "columns": [
    {"name": "Name", "type": "text"},
    {"name": "Email", "type": "text"},
    {"name": "Phone", "type": "text"}
  ]
}
```

### Product Inventory

```json
{
  "title": "Inventory",
  "columns": [
    {"name": "Product", "type": "text"},
    {"name": "SKU", "type": "text"},
    {"name": "Quantity", "type": "number"},
    {"name": "In Stock", "type": "boolean"}
  ]
}
```

### Task List

```json
{
  "title": "Tasks",
  "columns": [
    {"name": "Task", "type": "text"},
    {"name": "Due Date", "type": "date"},
    {"name": "Priority", "type": "number"},
    {"name": "Completed", "type": "boolean"}
  ]
}
```

## Validation Rules

- ✅ At least one column required
- ✅ Column names must be unique within a sheet
- ✅ Valid column types: `text`, `number`, `date`, `boolean`
- ✅ Row length must match number of columns
- ✅ Title is required and must be a string

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sheets` | List all accessible sheets |
| GET | `/api/sheets?id={id}` | Get specific sheet |
| POST | `/api/sheets` | Create new sheet |
| PUT | `/api/sheets?id={id}` | Update sheet |
| DELETE | `/api/sheets?id={id}` | Delete sheet |

## Query Parameters

### List Sheets
- `skip` - Number of records to skip (pagination)
- `take` - Number of records to return (max 100)
- `count` - Set to "true" to include total count
- `ownerId` - Filter by owner ("me" for current user)
- `orderBy` - JSON string for sorting

## Error Handling

Common error responses:

```json
// 400 Bad Request
{
  "success": false,
  "error": "Column names must be unique"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "You do not have permission to update this sheet"
}

// 404 Not Found
{
  "success": false,
  "error": "Sheet not found"
}
```

## TypeScript Integration

```typescript
interface Sheet {
  id: number
  title: string
  description?: string
  columns: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'boolean'
    width?: number
  }>
  rows: any[][]
  ownerId?: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// Create sheet
const response = await fetch('/api/sheets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
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
})

const result: { success: boolean; data: Sheet } = await response.json()
```

## Documentation

For complete API documentation, see:
- **[Full API Reference](./SHEETS_API.md)** - Detailed endpoint documentation
- **[API Overview](./API_REFERENCE.md)** - General API documentation

## Need Help?

- 📖 Check the [complete documentation](./SHEETS_API.md)
- 🐛 [Report issues](https://github.com/vyquocvu/tapi/issues)
- 💬 [Discussions](https://github.com/vyquocvu/tapi/discussions)
