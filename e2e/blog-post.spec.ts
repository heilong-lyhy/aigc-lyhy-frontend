import { expect, test } from '@playwright/test';

test.describe('Blog Post Detail Page', () => {
  test('shows 404 for non-existent slug', async ({ page }) => {
    await page.goto('/blog/this-slug-does-not-exist-at-all');

    // Should show 404 page
    await expect(page.getByText('404').or(page.getByText('页面未找到'))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('renders post content with markdown', async ({ page }) => {
    // Navigate via blog home to get a valid slug from mock data
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    // Post detail should render markdown content
    await expect(page.locator('.markdown-body')).toBeVisible({ timeout: 10_000 });
  });

  test('shows like button in post footer', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    // Like button should be present
    await expect(page.getByRole('button', { name: /赞|like/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows comments section', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    // Comments heading should be present
    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });
  });
});
