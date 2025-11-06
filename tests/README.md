# Test Suite Documentation

This directory contains the test suite for tapi, including unit tests for services and end-to-end (E2E) tests for the application.

## Test Structure

```
tests/
├── README.md                          # This file
├── setup.ts                           # Global test setup
├── api-validation.test.ts             # Validation middleware tests
├── authService.test.ts                # Authentication service tests
├── contentManagerService.test.ts      # Content manager service tests
├── mediaService.test.ts               # Media service tests
├── permissionService.test.ts          # Permission service tests
├── roleService.test.ts                # Role service tests
├── userManagementService.test.ts      # User management service tests
├── plugin-system.manual.ts            # Manual plugin system tests
└── e2e/
    ├── auth.spec.ts                   # E2E auth flow tests
    └── dashboard.spec.ts              # E2E dashboard tests
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest run tests/authService.test.ts
```

### E2E Tests (Playwright)

```bash
# First-time setup: Install Playwright browsers
npx playwright install chromium

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test tests/e2e/auth.spec.ts
```

## Test Coverage

### Service Unit Tests (103 tests)

#### authService.test.ts (6 tests)
- Validates email and password requirements
- Tests invalid credentials handling
- Tests successful login flow
- Tests password verification
- Tests JWT token generation
- Tests error handling

#### userManagementService.test.ts (21 tests)
- User CRUD operations (create, read, update, delete)
- User listing with active/inactive filtering
- Email uniqueness validation
- Password hashing
- Role assignment and removal
- Permission management
- User roles retrieval

#### roleService.test.ts (19 tests)
- Role CRUD operations
- Role name uniqueness
- Permission assignment to roles
- Permission removal from roles
- Role permissions retrieval
- Bulk permission setting with transactions

#### permissionService.test.ts (13 tests)
- Permission CRUD operations
- Permission name uniqueness
- Resource-based permission filtering
- Permission ordering

#### contentManagerService.test.ts (14 tests)
- Dynamic content type operations
- Content entry CRUD
- Field validation (required, types)
- Query options (where, select, include, orderBy)
- Pagination support
- Entry counting

#### mediaService.test.ts (18 tests)
- File upload with options
- File deletion
- URL retrieval
- File listing with folder filtering
- File existence checking
- Metadata retrieval
- Storage provider info
- Error handling for all operations

### E2E Tests (16 tests)

#### auth.spec.ts (6 tests)
- Login form display and validation
- Invalid credentials error handling
- Successful login with valid credentials
- Redirect behavior for unauthenticated users
- Logout functionality
- Session persistence across page reloads

#### dashboard.spec.ts (10 tests)
- Dashboard page display after authentication
- Welcome message with user information
- User email display
- Protected route information display
- Navigation menu presence
- Page navigation functionality
- Logout button availability
- Logout from dashboard
- Responsive design (mobile and desktop)

## Test Configuration

### Vitest Configuration

Configuration file: `vitest.config.ts`

- **Environment**: Node.js
- **Globals**: Enabled (describe, it, expect, etc.)
- **Setup file**: `tests/setup.ts`
- **Test pattern**: `tests/**/*.test.ts`
- **Excluded**: `tests/e2e/**/*`

### Playwright Configuration

Configuration file: `playwright.config.ts`

- **Base URL**: `http://localhost:5173`
- **Browser**: Chromium
- **Retries**: 2 (in CI), 0 (local)
- **Web server**: Automatically starts dev server
- **Timeout**: 120 seconds for server startup

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { yourFunction } from '../src/services/yourService'
import prisma from '../src/db/prisma'

// Mock dependencies
vi.mock('../src/db/prisma', () => ({
  default: {
    model: {
      findMany: vi.fn(),
    },
  },
}))

describe('yourService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    // Arrange
    vi.mocked(prisma.model.findMany).mockResolvedValue([])
    
    // Act
    const result = await yourFunction()
    
    // Assert
    expect(result).toEqual([])
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/your-page')
    
    // Interact
    await page.getByLabel(/field name/i).fill('value')
    await page.getByRole('button', { name: /submit/i }).click()
    
    // Assert
    await expect(page.getByText(/success/i)).toBeVisible()
  })
})
```

## Test Data

### Seed Data
The database seed file (`prisma/seed.ts`) creates test data:
- **User**: `demo@user.com` / `password`
- **Roles**: Admin, Editor, Viewer
- **Permissions**: 27 permissions across various resources
- **Content**: Sample articles, categories, tags

### Test Credentials
For E2E tests, use the seeded user:
- Email: `demo@user.com`
- Password: `password`

## Troubleshooting

### Unit Tests

**Issue**: Vitest not found
```bash
npm install --save-dev vitest @vitest/ui
```

**Issue**: Mock not working
- Ensure mocks are defined before imports
- Use `vi.clearAllMocks()` in `beforeEach`

### E2E Tests

**Issue**: Playwright browsers not installed
```bash
npx playwright install chromium
```

**Issue**: Server not starting
- Check if port 5173 is available
- Verify DATABASE_URL is set in `.env`
- Run `npm run db:setup` to initialize database

**Issue**: Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running properly

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Mocking**: Mock external dependencies (database, APIs)
4. **Assertions**: Be specific with expectations
5. **Naming**: Use descriptive test names
6. **Coverage**: Test happy paths, edge cases, and error conditions

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test

- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E tests
  run: npm run test:e2e
```

## Contributing

When adding new features:
1. Write unit tests for services
2. Write E2E tests for user-facing features
3. Ensure all tests pass before submitting PR
4. Maintain test coverage above 80%
