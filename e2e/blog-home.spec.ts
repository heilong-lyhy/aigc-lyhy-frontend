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

test.describe('Blog Home - Category Filter', () => {
  test('clicking a category in sidebar filters posts', async ({ page }) => {
    await page.goto('/blog');

    // Wait for sidebar to load
    const categoryMenu = page.locator('nav[aria-label="category-navigation"]');
    await expect(categoryMenu).toBeVisible({ timeout: 10_000 });

    // Click a category item (not "全部分类")
    const categoryItem = categoryMenu.locator('.ant-menu-item').nth(1);
    await expect(categoryItem).toBeVisible();
    await categoryItem.click();

    // URL should contain category param
    await expect(page).toHaveURL(/category=/);
  });

  test('clicking "全部分类" clears category filter', async ({ page }) => {
    await page.goto('/blog?category=1');

    const categoryMenu = page.locator('nav[aria-label="category-navigation"]');
    await expect(categoryMenu).toBeVisible({ timeout: 10_000 });

    // Click "全部分类" to clear filter
    await categoryMenu.getByText('全部分类').click();

    // URL should no longer contain category param
    await expect(page).toHaveURL(/^[^?]*\/blog(\?[^c]*)?$/);
  });

  test('category filter from URL is applied on page load', async ({ page }) => {
    await page.goto('/blog?category=1');

    const categoryMenu = page.locator('nav[aria-label="category-navigation"]');
    await expect(categoryMenu).toBeVisible({ timeout: 10_000 });

    // A menu item should be selected (not "全部分类")
    const selectedItem = categoryMenu.locator('.ant-menu-item-selected');
    await expect(selectedItem).toBeVisible();
  });
});

test.describe('Blog Home - Tag Filter', () => {
  test('clicking a tag in sidebar filters posts', async ({ page }) => {
    await page.goto('/blog');

    // Wait for tag cloud to load
    const tagCloud = page.locator('[aria-label="tag-cloud"]');
    await expect(tagCloud).toBeVisible({ timeout: 10_000 });

    // Click a tag
    const tagItem = tagCloud.locator('[role="listitem"]').first();
    await expect(tagItem).toBeVisible();
    await tagItem.click();

    // URL should contain tag param
    await expect(page).toHaveURL(/tag=/);
  });

  test('clicking a selected tag deselects it', async ({ page }) => {
    await page.goto('/blog?tag=1');

    const tagCloud = page.locator('[aria-label="tag-cloud"]');
    await expect(tagCloud).toBeVisible({ timeout: 10_000 });

    // Find the selected (blue) tag and click it to deselect
    const selectedTag = tagCloud.locator('.ant-tag-blue').first();
    if (await selectedTag.isVisible()) {
      await selectedTag.click();
      // URL should no longer have tag param
      await expect(page).toHaveURL(/^[^?]*\/blog(\?[^t]*)?$/);
    }
  });
});

test.describe('Blog Home - Error Path', () => {
  test('shows error state when API fails', async ({ page }) => {
    // Intercept GraphQL requests and force failure
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog');

    // Should show error alert with retry button
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '重试' })).toBeVisible();
  });
});
