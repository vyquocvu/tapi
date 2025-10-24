# Permission System Documentation

## Overview
This document explains how to use the Role-Based Access Control (RBAC) system implemented in vstack.

## Roles and Permissions

### Default Roles

#### Admin
- Full system access with all permissions
- Can manage users, roles, permissions, content, media, and content types

#### Editor
- Content creation and editing permissions
- Can create, read, update, and delete content
- Can upload, view, and delete media files
- Can view content types (read-only)
- Can view users

#### Viewer
- Read-only access to all resources
- Can view users, roles, permissions, content, media, and content types
- Cannot modify anything

### Permission Categories

#### User Management
- `users:create` - Create new users
- `users:read` - View users
- `users:update` - Update user information
- `users:delete` - Delete users
- `users:manage` - Full user management (all above)

#### Role Management
- `roles:create` - Create new roles
- `roles:read` - View roles
- `roles:update` - Update role information
- `roles:delete` - Delete roles
- `roles:manage` - Full role management (all above)

#### Permission Management
- `permissions:create` - Create new permissions
- `permissions:read` - View permissions
- `permissions:update` - Update permissions
- `permissions:delete` - Delete permissions
- `permissions:manage` - Full permission management (all above)

#### Content Management
- `content:create` - Create content entries
- `content:read` - View content entries
- `content:update` - Update content entries
- `content:delete` - Delete content entries
- `content:publish` - Publish content

#### Media Management
- `media:create` - Upload media files
- `media:read` - View media files
- `media:delete` - Delete media files

#### Content Type Management
- `content-types:create` - Create content types
- `content-types:read` - View content types
- `content-types:update` - Update content types
- `content-types:delete` - Delete content types

## Managing Roles and Permissions

### Assigning Permissions to Roles

1. Navigate to `/role-management`
2. Find the role you want to modify
3. Click the Key icon (🔑) to manage permissions
4. Select or deselect permissions by clicking checkboxes
5. Click "Save Permissions" to apply changes

Permissions are grouped by resource type for easy management.

### Assigning Roles to Users

1. Navigate to `/user-management`
2. Find the user you want to modify
3. Click the Shield icon (🛡️) to manage roles
4. Select or deselect roles by clicking checkboxes
5. Click "Save Roles" to apply changes

Users can have multiple roles, and their effective permissions are the union of all their roles' permissions.

## API Permission Enforcement

### Protected Endpoints

All API endpoints enforce permissions:

**Content API (`/api/content`)**
- GET: Requires `content:read`
- POST: Requires `content:create`
- PUT: Requires `content:update`
- DELETE: Requires `content:delete`

**Media API (`/api/media`)**
- GET: Requires `media:read`
- POST: Requires `media:create`
- DELETE: Requires `media:delete`

**Content Types API (`/api/content-types`)**
- GET: Requires `content-types:read`
- POST: Requires `content-types:create`
- PUT: Requires `content-types:update`
- DELETE: Requires `content-types:delete`

### Permission Checks

When a user attempts an action without the required permission:
1. The request is denied with a 403 Forbidden status
2. An audit log entry is created recording the denied access attempt
3. The user receives an error message

## Audit Trail

All permission-related actions are logged to the `AuditLog` table:
- Role assignments/removals
- Permission assignments/removals
- Denied access attempts
- User creation/update/deletion
- Role creation/update/deletion

Each audit log entry includes:
- User who performed the action
- Action type (create, update, delete, assign, revoke, denied)
- Resource affected (user, role, permission, content, etc.)
- Resource ID
- Additional details (JSON)
- IP address
- User agent
- Timestamp

## Creating Custom Roles

1. Navigate to `/role-management`
2. Click "Create Role"
3. Enter role name and description
4. Click "Create"
5. Click the Key icon (🔑) to assign permissions
6. Select the permissions this role should have
7. Click "Save Permissions"

## Best Practices

### Permission Granularity
- Use specific permissions (e.g., `content:read`) instead of broad permissions (e.g., `content:manage`)
- Grant only the minimum permissions required for each role
- Review permissions regularly

### Role Design
- Create roles based on job functions, not individuals
- Keep role count manageable (5-10 roles typically sufficient)
- Document the purpose of each role

### Security
- Regularly review audit logs for suspicious activity
- Remove unused roles and permissions
- Review user access periodically
- Never grant `*:manage` permissions unless absolutely necessary

## Programmatic Usage

### Checking Permissions in Code

```typescript
import { userHasPermission } from './services/userManagementService.js'

// Check if user has a specific permission
const canEdit = await userHasPermission(userId, 'content:edit')

if (!canEdit) {
  throw new Error('Permission denied')
}
```

### Using Middleware

```typescript
import { authenticate, requirePermission } from './middleware/authorization.js'

// Protect an Express route
app.delete('/api/content/:id', 
  authenticate, 
  requirePermission('content:delete'),
  async (req, res) => {
    // Delete logic here
  }
)
```

### Multiple Permission Check

```typescript
import { userHasAnyPermission } from './services/userManagementService.js'

// Check if user has any of multiple permissions
const canManage = await userHasAnyPermission(userId, [
  'content:create',
  'content:update',
  'content:delete'
])
```

## Troubleshooting

### User Cannot Access Resource
1. Check user's roles in `/user-management`
2. Verify role has required permission in `/role-management`
3. Check audit logs for denied access attempts
4. Ensure user is active (`isActive: true`)

### Permission Changes Not Taking Effect
1. User may need to log out and log back in
2. Check that permissions were saved successfully
3. Verify database was updated (check `RolePermission` table)
4. Clear browser cache/session storage

### Cannot Modify Own Account
- Users cannot edit or delete themselves
- This is a safety feature to prevent account lockout
- Have another admin make changes if needed

## Migration Notes

When adding new permissions:
1. Add to seed file: `prisma/seed.ts`
2. Assign to appropriate default roles
3. Run database seed: `npm run prisma:seed`
4. Update this documentation

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* resource data */ }
}
```

### Permission Denied Response
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Future Enhancements

Planned features:
- Group-based permissions
- Time-based permissions (temporary access)
- Row-level security (per-content permissions)
- Permission templates
- Bulk permission operations
- Advanced audit log filtering and search
