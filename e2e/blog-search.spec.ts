import { expect, test } from '@playwright/test';

test.describe('Blog Search Page', () => {
  test('shows search page with search bar', async ({ page }) => {
    await page.goto('/blog/search');

    await expect(page.getByRole('heading', { name: '搜索' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索文章...')).toBeVisible({ timeout: 10_000 });
  });

  test('typing in search bar triggers search', async ({ page }) => {
    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('React');
    await searchInput.press('Enter');

    // Wait for search results or empty state (debounced)
    await expect(
      page.getByRole('list', { name: 'search-results' }).or(page.getByText('未找到匹配的文章')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows empty result state when no posts match', async ({ page }) => {
    // Intercept and return empty results
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON();
      if (body?.query?.includes('PublishedPosts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              blogPublishedPosts: { items: [], total: 0, current: 1, pageSize: 6 },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill('nonexistent-term-xyz');
    await searchInput.press('Enter');

    await expect(page.getByText('未找到匹配的文章')).toBeVisible({ timeout: 10_000 });
  });

  test('initializes keyword from URL query param', async ({ page }) => {
    await page.goto('/blog/search?q=React');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Input should be pre-filled with the URL keyword
    await expect(searchInput).toHaveValue('React');
  });

  test('shows search history after performing a search', async ({ page }) => {
    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Perform a search
    await searchInput.fill('TypeScript');
    await searchInput.press('Enter');

    // Wait for results to load
    await expect(
      page.getByRole('list', { name: 'search-results' }).or(page.getByText('未找到匹配的文章')),
    ).toBeVisible({ timeout: 10_000 });

    // Search history label should appear
    await expect(page.getByText('搜索历史')).toBeVisible({ timeout: 5_000 });
  });

  test('clears search history on button click', async ({ page }) => {
    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Perform a search to create history
    await searchInput.fill('TypeScript');
    await searchInput.press('Enter');

    await expect(page.getByText('搜索历史')).toBeVisible({ timeout: 10_000 });

    // Click clear history button
    await page.getByText('清空').click();

    // Search history section should disappear
    await expect(page.getByText('搜索历史')).not.toBeVisible({ timeout: 5_000 });
  });

  test('clicking a search history item triggers search', async ({ page }) => {
    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Perform a search to create history
    await searchInput.fill('React');
    await searchInput.press('Enter');

    await expect(page.getByText('搜索历史')).toBeVisible({ timeout: 10_000 });

    // Clear input and click history tag
    await searchInput.clear();
    const historyTag = page.locator('.ant-tag', { hasText: 'React' }).first();
    await historyTag.click();

    // Input should be filled again
    await expect(searchInput).toHaveValue('React');
  });
});

test.describe('Blog Search - Error Path', () => {
  test('shows error state when search API fails', async ({ page }) => {
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Should show error alert
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('shows retry button on error state', async ({ page }) => {
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog/search');

    const searchInput = page.getByPlaceholder('搜索文章...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('test');
    await searchInput.press('Enter');

    await expect(page.getByRole('button', { name: '重试' })).toBeVisible({ timeout: 10_000 });
  });
});
