import { expect, test } from '@playwright/test';

test.describe('Blog Home Page', () => {
  test('shows blog page title and description', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByRole('heading', { name: '博客' })).toBeVisible();
    await expect(page.getByText('技术文章与生活随笔')).toBeVisible();
  });

  test('displays post list with mock data', async ({ page }) => {
    await page.goto('/blog');

    // Mock fallback provides at least one post card
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to post detail on card click', async ({ page }) => {
    await page.goto('/blog');

    // Wait for posts to load, then click the first post link
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    // Should navigate to /blog/:slug
    await expect(page).toHaveURL(/\/blog\/.+/);
  });

  test('shows sidebar with categories and tags', async ({ page }) => {
    await page.goto('/blog');

    // Sidebar should appear after loading
    await expect(page.getByText('分类').or(page.getByText('标签'))).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── 搜索功能 ──

  test('shows search input on blog page', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByPlaceholder(/搜索/)).toBeVisible({ timeout: 10_000 });
  });

  // ── 归档页 ──

  test('navigates to archive page', async ({ page }) => {
    await page.goto('/blog/archive');

    await expect(page.getByText(/归档/)).toBeVisible({ timeout: 10_000 });
  });

  // ── 关于页 ──

  test('navigates to about page', async ({ page }) => {
    await page.goto('/blog/about');

    await expect(page.getByText(/关于/)).toBeVisible({ timeout: 10_000 });
  });
});
