import { expect, test } from '@playwright/test';

test.describe('Blog Admin', () => {
  test('redirects unauthenticated users to auth page', async ({ page }) => {
    await page.goto('/admin');

    // AdminGuard should redirect to /auth when not authenticated
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('shows admin layout with navigation when authenticated', async ({ page }) => {
    // Simulate authenticated admin user
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_access_token', 'mock-token');
      localStorage.setItem('auth_refresh_token', 'mock-refresh');
      localStorage.setItem('auth_account_id', '1');
    });

    await page.goto('/admin');

    // Should show admin sidebar navigation
    await expect(page.getByText('Blog Admin')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('仪表盘')).toBeVisible();
    await expect(page.getByText('文章管理')).toBeVisible();
  });

  test('navigates between admin pages via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_access_token', 'mock-token');
      localStorage.setItem('auth_refresh_token', 'mock-refresh');
      localStorage.setItem('auth_account_id', '1');
    });

    await page.goto('/admin');

    // Click on 文章管理
    await page.getByText('文章管理').click();
    await expect(page).toHaveURL('/admin/posts');

    // Click on 仪表盘
    await page.getByText('仪表盘').click();
    await expect(page).toHaveURL('/admin');
  });

  test('shows post list page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_access_token', 'mock-token');
      localStorage.setItem('auth_refresh_token', 'mock-refresh');
      localStorage.setItem('auth_account_id', '1');
    });

    await page.goto('/admin/posts');

    // Page should load (may show loading or empty state)
    await expect(page.getByText('文章管理').or(page.getByText('暂无数据'))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows post editor page for new post', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_access_token', 'mock-token');
      localStorage.setItem('auth_refresh_token', 'mock-refresh');
      localStorage.setItem('auth_account_id', '1');
    });

    await page.goto('/admin/posts/new');

    // Editor should have title input
    await expect(page.getByPlaceholder('请输入文章标题')).toBeVisible({ timeout: 10_000 });
  });
});
