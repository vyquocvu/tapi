# API Controller Dashboard

The API Controller Dashboard provides a comprehensive interface for managing and monitoring REST API endpoints based on the Content Type Builder. It offers real-time insights into API usage, endpoint configurations, and auto-generated documentation.

## Key Achievements

- **API Monitoring & Analytics**: Real-time statistics dashboard, activity logging, categorized documentation, and response time monitoring.
- **Endpoint Management**: Visual endpoint browser with full documentation, access indicators, and authentication requirement badges.
- **Content Type Integration**: Auto-discovery of content types, dynamic endpoint configuration, and rate limiting controls.
- **Documentation Generation**: Auto-generate markdown and OpenAPI/Swagger specifications from content type schemas.
- **Security & Access Control**: JWT authentication, protected routes, and role-based access infrastructure.

## Features

### 📊 Overview Tab
- **API Statistics**: View counts of total, public, private, and content-type-specific endpoints
- **Recent Activity**: Monitor recent API requests with status codes, response times, and timestamps
- **Quick Features List**: Summary of dashboard capabilities

### 📡 API Endpoints Tab
- **Categorized Documentation**: All endpoints grouped by functionality (Authentication, Content Type Builder, Content Manager, System)
- **Visual Indicators**: Color-coded HTTP methods (GET, POST, PUT, DELETE)
- **Access Level Badges**: Clear indication of public/private endpoints and authentication requirements
- **Detailed Descriptions**: Comprehensive endpoint descriptions and purposes

### 🔧 Content Type APIs Tab
- **Dynamic Endpoint Configuration**: Manage API settings for each content type
- **Visibility Controls**: Toggle between public and private access
- **Rate Limiting**: View and manage rate limits per content type
- **Documentation Generation**: Auto-generate markdown API docs from content type schemas
- **OpenAPI Support**: Generate OpenAPI/Swagger specifications (available via API)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Dashboard UI                         │
│                  (React Component)                          │
├─────────────────────────────────────────────────────────────┤
│  - Overview Tab (Statistics + Activity)                     │
│  - API Endpoints Tab (Full Documentation)                   │
│  - Content Type APIs Tab (Config + Doc Generation)          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               API Endpoint: /api/api-dashboard               │
│                   (Backend Service)                          │
├─────────────────────────────────────────────────────────────┤
│  GET ?action=statistics    → API statistics                 │
│  GET ?action=endpoints     → All endpoints list             │
│  GET ?action=activity      → Recent activity logs           │
│  GET ?action=documentation → Grouped endpoint docs          │
│  GET ?action=configs       → Content type configs           │
│  GET ?action=generate-docs → Generate markdown docs         │
│  GET ?action=openapi       → Generate OpenAPI spec          │
│  PUT ?contentType=xxx      → Update endpoint config         │
└─────────────────┬───────────────────────────────────────────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
┌──────────────────┐  ┌──────────────────────────┐
│ API Analytics    │  │ Endpoint Config Service  │
│ Service          │  │                          │
├──────────────────┤  ├──────────────────────────┤
│ - Track endpoints│  │ - Manage configs         │
│ - Statistics     │  │ - Generate docs          │
│ - Activity logs  │  │ - OpenAPI specs          │
└──────────────────┘  └──────────────────────────┘
```

## Technical Implementation

- **Frontend**: React, TanStack Router, TanStack Query, shadcn/ui
- **Backend**: Node.js, TypeScript, Express (dev), Vercel Functions (prod)
- **Services**: Custom analytics and configuration services
- **Authentication**: JWT tokens
- **Database**: Prisma ORM (SQLite dev, PostgreSQL prod)

## API Endpoints

### Get Dashboard Overview
```bash
GET /api/api-dashboard
Authorization: Bearer <token>

# Returns: statistics, recent activity, and endpoints list
```

### Get API Statistics
```bash
GET /api/api-dashboard?action=statistics
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": {
    "totalEndpoints": 12,
    "publicEndpoints": 2,
    "privateEndpoints": 10,
    "contentTypeEndpoints": 8
  }
}
```

### Get Recent Activity
```bash
GET /api/api-dashboard?action=activity&limit=10
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": [
    {
      "id": "1",
      "endpoint": "/api/content",
      "method": "GET",
      "timestamp": "2025-10-15T05:54:30.000Z",
      "statusCode": 200,
      "responseTime": 45,
      "contentType": "api::article.article"
    }
  ]
}
```

### Get Endpoint Documentation
```bash
GET /api/api-dashboard?action=documentation
Authorization: Bearer <token>

# Returns: endpoints grouped by category with full details
```

### Get Content Type Configs
```bash
GET /api/api-dashboard?action=configs
Authorization: Bearer <token>

# Returns: endpoint configurations for all content types
```

### Generate API Documentation
```bash
GET /api/api-dashboard?action=generate-docs&contentType=api::article.article
Authorization: Bearer <token>

# Returns: Markdown documentation for the content type
```

### Generate OpenAPI Spec
```bash
GET /api/api-dashboard?action=openapi&contentType=api::article.article
Authorization: Bearer <token>

# Returns: OpenAPI 3.0 specification
```

### Update Endpoint Configuration
```bash
PUT /api/api-dashboard?contentType=api::article.article
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPublic": false,
  "allowedRoles": "authenticated",
  "rateLimit": 100,
  "description": "Custom description"
}

# Response:
{
  "success": true,
  "data": {
    "uid": "api::article.article",
    "path": "/api/content?contentType=api::article.article",
    "isPublic": false,
    "allowedRoles": ["authenticated"],
    "rateLimit": 100,
    "description": "Custom description"
  }
}
```

## Usage

### Access the Dashboard

1. **Login**: Navigate to `/login` and authenticate
2. **Open Dashboard**: Click "API Controller" in the sidebar or navigate to `/api-dashboard`
3. **Explore Tabs**: Switch between Overview, API Endpoints, and Content Type APIs

### Generate Documentation

1. Go to the **Content Type APIs** tab
2. Find the content type you want to document
3. Click **Generate Docs** button
4. View the auto-generated markdown documentation below

### Monitor API Usage

1. Go to the **Overview** tab
2. View real-time statistics in the cards
3. Check recent activity for endpoint usage patterns

### View All Endpoints

1. Go to the **API Endpoints** tab
2. Browse endpoints grouped by category
3. See method, path, access level, and authentication requirements

## Testing Results

All features have been manually tested and verified:
- Login and authentication
- Dashboard navigation
- Statistics display
- Activity logs
- Endpoint documentation
- Content type listing
- Documentation generation
- Route protection
- Error handling

## Production Considerations

- **Activity Logging**: Replace mock data with a real logging service (e.g., Winston, Pino) or analytics platform (e.g., Datadog).
- **Endpoint Configuration Persistence**: Implement database storage for public/private settings, rate limits, and custom descriptions.
- **Caching**: Add caching for endpoint lists, statistics, and generated documentation to improve performance.

## Screenshots

### Overview Tab
![API Dashboard Overview](https://github.com/user-attachments/assets/e2e1be31-fec9-441d-91cc-f62c86ae299a)

### API Endpoints Tab
![API Endpoints Documentation](https://github.com/user-attachments/assets/b35cba5a-ffc5-4bb6-aecb-ea61fb62a507)

### Content Type APIs Tab
![Content Type API Configuration](https://github.com/user-attachments/assets/a9e6ae67-1929-4134-afd6-b2b325d5bb80)

## Related Documentation

- [Content Type Builder](./CONTENT_TYPE_BUILDER.md)
- [Content Manager](./CONTENT_MANAGER.md)
- [Architecture](./ARCHITECTURE.md)
