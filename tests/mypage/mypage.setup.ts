import { test as setup, type Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import loginData from '../../data-test/login-data.json';
import path from 'path';

export const UNAUTHENTICATED_EMAIL_STATE = 'playwright/.auth/unauthenticated-email.json';
export const AUTHENTICATED_EMAIL_STATE = 'playwright/.auth/authenticated-email.json';


async function injectBannerBypass(page: Page) {
  await page.evaluate(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('modalSeenDate', todayStr);
  });

  await page.waitForTimeout(300);
}

setup('Authenticate as Unauthenticated Email User', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(loginData.unauthenticatedEmail.email, loginData.unauthenticatedEmail.password);
  await page.waitForURL(/.*home/, { timeout: 7000 });

  await injectBannerBypass(page);

  const statePath = path.resolve(__dirname, '../playwright/.auth/unauthenticated-email.json');
  await page.context().storageState({ path: statePath });
});

setup('Authenticate as Authenticated Email User', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(loginData.authenticatedEmail.email, loginData.authenticatedEmail.password);
  await page.waitForURL(/.*home/, { timeout: 7000 });

  await injectBannerBypass(page);

  const statePath = path.resolve(__dirname, '../playwright/.auth/authenticated-email.json');
  await page.context().storageState({ path: statePath });
});
