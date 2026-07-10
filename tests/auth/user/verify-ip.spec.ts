import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';

test.describe('[Auth] Normal User Login Feature Tests - Verify IP', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  const unauthorizedIpData = [
    { method: 'email', data: loginData.unauthorizedEmail },
    { method: 'phone', data: loginData.unauthorizedPhone }
  ] as const;

  for (const { method, data } of unauthorizedIpData) {
    test(`[Auth] Verify IP shows dialog and allows verification flow - ${method.toUpperCase()}`, async ({ page }) => {

      await loginPage.login(data.email, data.password);
      await loginPage.verifyUnauthorizedIpDialog();

      await loginPage.proceedToVerificationFromIpDialog(method);
      await loginPage.verifyVerificationDefaultUI(method, data.email);

      await loginPage.sendOtpAndProceedToInputScreen();
      await loginPage.verifyOtpScreenDefaultUI();

      await loginPage.enterOtpAndVerifyComplete(data.otp);
      await expect(page).toHaveURL('/home');
    });
  }
  
  test('[Auth] Login with same allowed IP shows success', async ({ page }) => {
    const { email, password } = loginData.sameallowedIpAccount;
    await loginPage.navigate();
    await loginPage.login(email, password);
    await expect(page).toHaveURL('/home');
  });
});
