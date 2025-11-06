# RBAC Implementation Summary

## Overview
This implementation adds a comprehensive Role-Based Access Control (RBAC) system to the tapi CMS, enabling fine-grained permission management for users.

## Database Schema

### New Tables
1. **Role** - Defines user roles (Admin, Editor, Viewer, etc.)
2. **Permission** - Defines granular permissions (e.g., "users:create", "content:edit")
3. **UserRole** - Many-to-many relationship between users and roles
4. **RolePermission** - Many-to-many relationship between roles and permissions
5. **UserPermission** - Direct permissions assigned to specific users
6. **AuditLog** - Tracks all changes to users, roles, and permissions

### Updated Tables
- **User**: Added `isActive` field and relations to UserRole, UserPermission, and AuditLog

## API Endpoints

### Users API (`/api/users`)
- **GET** `/api/users` - List all users
- **GET** `/api/users?id={id}` - Get user by ID
- **GET** `/api/users?id={id}&includeRoles=true` - Get user with roles and permissions
- **POST** `/api/users` - Create new user
- **PUT** `/api/users?id={id}` - Update user
- **DELETE** `/api/users?id={id}` - Delete user
- **POST** `/api/users/assign-role` - Assign role to user
- **POST** `/api/users/remove-role` - Remove role from user

### Roles API (`/api/roles`)
- **GET** `/api/roles` - List all roles
- **GET** `/api/roles?id={id}&includePermissions=true` - Get role with permissions
- **POST** `/api/roles` - Create new role
- **PUT** `/api/roles?id={id}` - Update role
- **DELETE** `/api/roles?id={id}` - Delete role
- **POST** `/api/roles/assign-permission` - Assign permission to role
- **POST** `/api/roles/remove-permission` - Remove permission from role
- **POST** `/api/roles/set-permissions` - Set all permissions for a role at once

### Permissions API (`/api/permissions`)
- **GET** `/api/permissions` - List all permissions
- **GET** `/api/permissions?id={id}` - Get permission by ID
- **POST** `/api/permissions` - Create new permission
- **PUT** `/api/permissions?id={id}` - Update permission
- **DELETE** `/api/permissions?id={id}` - Delete permission

## Frontend Pages

### User Management (`/user-management`)
- View all users in a table
- Create new users with email, name, password, bio
- Edit existing users
- Delete users with confirmation
- Status indicators (Active/Inactive)
- Real-time updates using TanStack Query

### Role Management (`/role-management`)
- View all roles in a table
- Display role information
- Foundation for permission assignment

## Default Roles and Permissions

### Roles
1. **Admin**: Full system access
2. **Editor**: Content management access
3. **Viewer**: Read-only access

### Permissions (20 total)
#### User Management
- `users:create`, `users:read`, `users:update`, `users:delete`, `users:manage`

#### Role Management
- `roles:create`, `roles:read`, `roles:update`, `roles:delete`, `roles:manage`

#### Permission Management
- `permissions:create`, `permissions:read`, `permissions:update`, `permissions:delete`, `permissions:manage`

#### Content Management
- `content:create`, `content:read`, `content:update`, `content:delete`, `content:publish`

## Service Layer

### permissionService.ts
- `getAllPermissions()` - Get all permissions
- `getPermissionById(id)` - Get permission by ID
- `getPermissionByName(name)` - Get permission by name
- `createPermission(data)` - Create new permission
- `updatePermission(id, data)` - Update permission
- `deletePermission(id)` - Delete permission
- `getPermissionsByResource(resource)` - Get permissions by resource

### roleService.ts
- `getAllRoles()` - Get all roles
- `getRoleById(id)` - Get role by ID
- `getRoleWithPermissions(id)` - Get role with permissions
- `getRoleByName(name)` - Get role by name
- `createRole(data)` - Create new role
- `updateRole(id, data)` - Update role
- `deleteRole(id)` - Delete role
- `assignPermissionToRole(roleId, permissionId)` - Assign permission
- `removePermissionFromRole(roleId, permissionId)` - Remove permission
- `getRolePermissions(roleId)` - Get all permissions for a role
- `setRolePermissions(roleId, permissionIds)` - Set all permissions at once

### userManagementService.ts
- `getAllUsers(includeInactive)` - Get all users
- `getUserById(id)` - Get user by ID
- `getUserWithRolesAndPermissions(id)` - Get user with roles and permissions
- `getUserByEmail(email)` - Get user by email
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user
- `assignRoleToUser(userId, roleId)` - Assign role
- `removeRoleFromUser(userId, roleId)` - Remove role
- `getUserRoles(userId)` - Get user's roles
- `setUserRoles(userId, roleIds)` - Set user's roles
- `assignPermissionToUser(userId, permissionId)` - Assign direct permission
- `removePermissionFromUser(userId, permissionId)` - Remove direct permission
- `getUserPermissions(userId)` - Get all user permissions
- `userHasPermission(userId, permissionName)` - Check if user has permission
- `userHasAnyPermission(userId, permissionNames)` - Check if user has any permission

### auditLogService.ts
- `createAuditLog(data)` - Create audit log entry
- `getAuditLogs(filters)` - Get audit logs with filters
- `getResourceAuditLogs(resource, resourceId)` - Get logs for specific resource
- `getRecentAuditLogs(limit)` - Get recent logs

## Authorization Middleware

### authenticate(req, res, next)
Middleware to extract and verify JWT token from Authorization header.

### requirePermission(permissionName)
Middleware factory that checks if the authenticated user has a specific permission.

### requireAnyPermission(permissionNames)
Middleware factory that checks if the authenticated user has any of the specified permissions.

## Usage Examples

### Check User Permission
```typescript
import { userHasPermission } from './services/userManagementService.js'

const canEdit = await userHasPermission(userId, 'content:edit')
```

### Protect Route with Permission
```typescript
import { authenticate, requirePermission } from './middleware/authorization.js'

app.delete('/api/users/:id', 
  authenticate, 
  requirePermission('users:delete'),
  async (req, res) => {
    // Delete user logic
  }
)
```

### Assign Role to User
```typescript
import { assignRoleToUser } from './services/userManagementService.js'

await assignRoleToUser(userId, roleId, assignedByUserId)
```

### Set Role Permissions
```typescript
import { setRolePermissions } from './services/roleService.js'

await setRolePermissions(roleId, [1, 2, 3, 5, 8])
```

## Audit Trail

All permission-related actions are logged to the AuditLog table with:
- User who performed the action
- Action type (create, update, delete, assign, revoke)
- Resource affected (user, role, permission, user_role, role_permission)
- Resource ID
- Additional details (JSON)
- IP address
- User agent
- Timestamp

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Password Hashing**: Passwords stored with bcrypt (10 rounds)
3. **Permission Checking**: Middleware for granular permission control
4. **Audit Logging**: Complete audit trail of all permission changes
5. **Cascading Deletes**: Proper database cleanup on deletions
6. **Database Indexing**: Optimized queries with strategic indexes
7. **Input Validation**: Email validation, required fields checking
8. **Error Handling**: Comprehensive error messages

## Running the Application

### Development Mode
```bash
npm run dev
```
Note: Vite dev server doesn't include handlers for new API endpoints by default. Use Node.js server for full API testing.

### Production (Node.js)
```bash
npm run start:node
```

### Production (Vercel)
```bash
npm run start:vercel
```

## Database Setup

### Initial Setup
```bash
npm run db:setup
```

This will:
1. Generate Prisma client
2. Run migrations (including RBAC tables)
3. Seed database with demo data (demo user with Admin role)

### Credentials
- Email: `demo@user.com`
- Password: `password`
- Role: Admin (all permissions)

## Testing

### Test Login
```bash
curl -X POST http://localhost:5174/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'
```

### Test Get Users (with token)
```bash
curl http://localhost:5174/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Get Roles
```bash
curl http://localhost:5174/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

### Recommended Enhancements
1. Complete permission assignment UI in role management page
2. Add role assignment UI to user management page
3. Implement permission-based UI element visibility
4. Add audit log viewer UI
5. Implement bulk operations for role/permission assignment
6. Add permission checks to existing content management routes
7. Create permission templates for common role patterns

### Integration with Existing Features
- Add permission checks to content-type-builder routes
- Add permission checks to content-manager routes
- Add permission checks to media manager routes
- Implement row-level security for content access

## File Structure

```
/home/runner/work/tapi/tapi/
├── prisma/
│   ├── schema.prisma (updated with RBAC tables)
│   ├── schema.original.prisma (updated with RBAC tables)
│   └── seed.ts (updated with roles and permissions)
├── src/
│   ├── services/
│   │   ├── permissionService.ts
│   │   ├── roleService.ts
│   │   ├── userManagementService.ts
│   │   └── auditLogService.ts
│   ├── middleware/
│   │   └── authorization.ts
│   ├── routes/
│   │   ├── user-management/
│   │   │   └── index.tsx
│   │   └── role-management/
│   │       └── index.tsx
│   └── components/
│       └── Sidebar.tsx (updated)
└── api/
    ├── users.ts
    ├── roles.ts
    └── permissions.ts
```

## Conclusion

This RBAC implementation provides a solid foundation for access control in the tapi CMS. It follows best practices for security, uses proper database design patterns, and provides a clean API interface for both backend and frontend components.
