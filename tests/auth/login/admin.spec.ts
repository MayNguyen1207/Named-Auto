import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';

test.describe('[Auth] Admin Login Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('[Auth] Admin login from invalid IP shows error message', async ({ page }) => {
    const { email, password, fakeIp, expectedErrorMessage } = loginData.admin;

    await page.setExtraHTTPHeaders({
      'X-Forwarded-For': fakeIp,
      'X-Real-IP': fakeIp
    });

    await loginPage.navigate();
    await loginPage.login(email, password);
    await expect(loginPage.loginErrorForm).toContainText(expectedErrorMessage);
  });
});
