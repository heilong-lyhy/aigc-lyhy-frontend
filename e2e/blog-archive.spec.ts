import { expect, test } from '@playwright/test';

test.describe('Blog Archive Page', () => {
  test('shows archive page title and description', async ({ page }) => {
    await page.goto('/blog/archive');

    await expect(page.getByRole('heading', { name: '归档' })).toBeVisible();
    await expect(page.getByText('按日期归档浏览文章')).toBeVisible();
  });

  test('shows sidebar with categories and tags', async ({ page }) => {
    await page.goto('/blog/archive');

    await expect(
      page.getByText('分类').or(page.getByText('标签')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows collapse panels for year groups when posts exist', async ({ page }) => {
    await page.goto('/blog/archive');

    // If posts exist, collapse panels with year labels should be visible
    const collapsePanel = page.locator('.ant-collapse-item').first();
    const hasPanel = await collapsePanel.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasPanel) {
      // Year label should end with " 年"
      await expect(page.getByText(/\d{4} 年/).first()).toBeVisible();
    }
  });

  test('shows empty state when no posts exist', async ({ page }) => {
    // Intercept and return empty results
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON();
      if (body?.query?.includes('PublishedPosts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              blogPublishedPosts: { items: [], total: 0, current: 1, pageSize: 100 },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/blog/archive');

    await expect(page.getByText('暂无归档文章')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to post detail on clicking an archived post', async ({ page }) => {
    await page.goto('/blog/archive');

    // Wait for content to load
    const postButton = page.locator('button').filter({ hasText: /\d{4}/ }).first();
    const hasPost = await postButton.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasPost) {
      await postButton.click();
      await expect(page).toHaveURL(/\/blog\/.+/);
    }
  });
});

test.describe('Blog Archive - Error Path', () => {
  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog/archive');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('shows retry button on error state', async ({ page }) => {
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog/archive');

    await expect(page.getByRole('button', { name: '重试' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Blog Friends Page', () => {
  test('shows friends page title and description', async ({ page }) => {
    await page.goto('/blog/friends');

    await expect(page.getByRole('heading', { name: '友情链接' })).toBeVisible();
    await expect(page.getByText('我的朋友们')).toBeVisible();
  });

  test('shows friend link cards when data exists', async ({ page }) => {
    await page.goto('/blog/friends');

    // Wait for content to load - either cards or empty state
    const card = page.locator('.ant-card').first();
    const hasCard = await card.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasCard) {
      // Cards should be links opening in new tab
      const link = page.locator('a').filter({ has: page.locator('.ant-card') }).first();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('shows empty state when no friend links exist', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON();
      if (body?.query?.includes('FriendLinks')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { blogFriendLinks: [] },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/blog/friends');

    await expect(page.getByText('暂无友链')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Blog Friends - Error Path', () => {
  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/graphql', (route) => route.abort('failed'));

    await page.goto('/blog/friends');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });
});
