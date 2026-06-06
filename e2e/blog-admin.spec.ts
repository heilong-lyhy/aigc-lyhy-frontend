import { expect, test } from '@playwright/test';

async function authenticate(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('auth_access_token', 'mock-token');
    localStorage.setItem('auth_refresh_token', 'mock-refresh');
    localStorage.setItem('auth_account_id', '1');
  });
}

test.describe('Blog Admin', () => {
  test('redirects unauthenticated users to auth page', async ({ page }) => {
    await page.goto('/admin');

    // AdminGuard should redirect to /auth when not authenticated
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('shows admin layout with navigation when authenticated', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin');

    // Should show admin sidebar navigation
    await expect(page.getByText('Blog Admin')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('仪表盘')).toBeVisible();
    await expect(page.getByText('文章管理')).toBeVisible();
    await expect(page.getByText('文件管理')).toBeVisible();
    await expect(page.getByText('个人设置')).toBeVisible();
  });

  test('navigates between admin pages via sidebar', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin');

    // Click on 文章管理
    await page.getByText('文章管理').click();
    await expect(page).toHaveURL('/admin/posts');

    // Click on 仪表盘
    await page.getByText('仪表盘').click();
    await expect(page).toHaveURL('/admin');
  });

  test('shows post list page', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin/posts');

    // Page should load (may show loading or empty state)
    await expect(page.getByText('文章管理').or(page.getByText('暂无数据'))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows post editor page for new post', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin/posts/new');

    // Editor should have title input
    await expect(page.getByPlaceholder('请输入文章标题')).toBeVisible({ timeout: 10_000 });
  });

  // ── 文件管理页 ──

  test('shows file manager page with empty state', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin/files');

    await expect(page.getByText('文件管理')).toBeVisible({ timeout: 10_000 });
    // Empty state or upload button should be visible
    await expect(
      page.getByText('暂无文件').or(page.getByText('上传文件')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to file manager via sidebar', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin');
    await page.getByText('文件管理').click();
    await expect(page).toHaveURL('/admin/files');
  });

  // ── 个人设置页 ──

  test('shows profile settings page', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin/profile');

    await expect(page.getByText('个人设置')).toBeVisible({ timeout: 10_000 });
    // Should show either the form or loading state
    await expect(
      page.getByText('博主信息').or(page.getByText('修改密码')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to profile settings via sidebar', async ({ page }) => {
    await authenticate(page);

    await page.goto('/admin');
    await page.getByText('个人设置').click();
    await expect(page).toHaveURL('/admin/profile');
  });
});
