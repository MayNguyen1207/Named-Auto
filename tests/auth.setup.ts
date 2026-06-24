import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import loginData from '../data-test/login-data.json';
import path from 'path';

setup('Authenticate as Normal User', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(loginData.valid.email, loginData.valid.password);
  await page.waitForURL(/.*home/, { timeout: 7000 });
  
  const userStatePath = path.resolve(__dirname, '../playwright/.auth/user.json');
  await page.context().storageState({ path: userStatePath });
});

setup('Authenticate as Admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(loginData.admin.email, loginData.admin.password);
  await page.waitForURL(/.*home/, { timeout: 7000 });
  
  const adminStatePath = path.resolve(__dirname, '../playwright/.auth/admin.json');
  await page.context().storageState({ path: adminStatePath });
});