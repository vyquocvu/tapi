import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    
    // Click login button
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Wait for error message
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible({ timeout: 5000 })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in valid credentials (using test user from seed)
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Click login button
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
    
    // Find and click logout button
    await page.getByRole('button', { name: /log out/i }).click()
    
    // Should be redirected to home or login
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 5000 })
    
    // Try accessing dashboard again - should be redirected
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('should maintain session across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
    
    // Reload the page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })
})
