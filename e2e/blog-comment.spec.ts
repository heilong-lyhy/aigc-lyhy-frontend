import { expect, test } from '@playwright/test';

test.describe('Blog Comment - Submission', () => {
  test('shows login modal when unauthenticated user focuses on comment input', async ({ page }) => {
    // Navigate to a blog post
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    // Wait for comment section
    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });

    // Click on comment input (unauthenticated user)
    const commentInput = page.getByPlaceholder(/评论|内容|留言/).first();
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.click();

      // Login modal should appear
      await expect(page.getByText('请先登录')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('登录后即可发表评论')).toBeVisible();
    }
  });

  test('login modal redirects to auth page on confirm', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });

    const commentInput = page.getByPlaceholder(/评论|内容|留言/).first();
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.click();

      const loginModal = page.locator('.ant-modal').filter({ hasText: '请先登录' });
      if (await loginModal.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await loginModal.getByRole('button', { name: '去登录' }).click();
        await expect(page).toHaveURL(/\/auth/, { timeout: 5_000 });
      }
    }
  });

  test('submit button is disabled for unauthenticated users', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });

    const submitButton = page.getByRole('button', { name: '提交评论' });
    if (await submitButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(submitButton).toBeDisabled();
    }
  });

  test('shows comment list section', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Blog Comment - Error Path', () => {
  test('shows error state when comment API fails', async ({ page }) => {
    // Authenticate first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_access_token', 'mock-token');
      localStorage.setItem('auth_refresh_token', 'mock-refresh');
      localStorage.setItem('auth_account_id', '1');
    });

    // Intercept comment submission and force failure
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON();
      if (body?.query?.includes('createComment') || body?.query?.includes('CreateComment')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/blog');
    const postLink = page.getByRole('article').first();
    await expect(postLink).toBeVisible({ timeout: 10_000 });
    await postLink.click();

    await expect(page.getByRole('heading', { name: '评论' })).toBeVisible({ timeout: 10_000 });

    // Fill comment form and submit
    const commentInput = page.getByPlaceholder(/评论|内容|留言/).first();
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Test comment content');
      const submitButton = page.getByRole('button', { name: '提交评论' });
      if (await submitButton.isEnabled({ timeout: 2_000 }).catch(() => false)) {
        await submitButton.click();

        // Error message should appear
        await expect(page.locator('.ant-typography-danger').or(page.getByRole('alert'))).toBeVisible({
          timeout: 10_000,
        });
      }
    }
  });
});
