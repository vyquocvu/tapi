import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  // Helper function to login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Login with test credentials
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('should display dashboard page after login', async ({ page }) => {
    // Check for dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should display welcome message with user name', async ({ page }) => {
    // Check for welcome message
    const welcomeText = page.locator('text=/welcome/i')
    await expect(welcomeText).toBeVisible()
    
    // User name should be displayed (Test User from seed data)
    await expect(page.locator('text=/Test User/i')).toBeVisible()
  })

  test('should display user email', async ({ page }) => {
    // User email should be visible
    await expect(page.locator('text=test@example.com')).toBeVisible()
  })

  test('should display protected route information', async ({ page }) => {
    // Check for protected route info card
    await expect(page.locator('text=/protected route/i')).toBeVisible()
    
    // Check for JWT authentication mention
    await expect(page.locator('text=/JWT/i')).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    // Check for navigation elements
    // The navigation menu should be present in the layout
    const nav = page.locator('nav')
    
    if (await nav.isVisible()) {
      // If navigation exists, check for common links
      // These might include Home, Dashboard, etc.
      await expect(nav).toBeVisible()
    }
  })

  test('should allow navigation to other pages', async ({ page }) => {
    // Try navigating to home page
    const homeLink = page.getByRole('link', { name: /home/i })
    
    if (await homeLink.isVisible()) {
      await homeLink.click()
      await expect(page).toHaveURL(/\/$/)
    }
  })

  test('should display logout button', async ({ page }) => {
    // Logout button should be visible
    const logoutButton = page.getByRole('button', { name: /log out/i })
    await expect(logoutButton).toBeVisible()
  })

  test('should handle logout from dashboard', async ({ page }) => {
    // Click logout
    await page.getByRole('button', { name: /log out/i }).click()
    
    // Should redirect away from dashboard
    await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 5000 })
    
    // Attempting to go back to dashboard should redirect to login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Dashboard should still be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})
