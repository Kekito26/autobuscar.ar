import { test, expect } from '@playwright/test';

test.beforeEach('login', async ({ page }) => {
  await page.goto('https://autobuscar-ar-web.vercel.app/');
  await page.getByTestId('login-trigger').click();
  await page.getByTestId('login-username-input').click();
  await page.getByTestId('login-username-input').fill('admin');
  await page.getByTestId('login-username-input').press('Tab');
  await page.getByTestId('login-password-input').fill('testing123');
  await page.getByTestId('login-submit').click();
  //await page.pause();
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('user-menu-profile')).toBeVisible();
  //await page.pause();
});

test('user search', async ({ page }) => {
  await page.goto('https://autobuscar-ar-web.vercel.app/');
  await page.getByTestId('hero-cta-search').click();
  await expect(page.getByTestId('search-input')).toBeVisible();
});

