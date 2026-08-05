import { test, expect } from '@playwright/test';
import './authSetupCooldown';
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
      test.skip(method === 'email', 'Skipping email cases; phone-only run.');
      
      await loginPage.login(data.email, data.password);
      await loginPage.verifyUnauthorizedIpDialog();

      await loginPage.proceedToVerificationFromIpDialog(method);
      await loginPage.verifyVerificationDefaultUI(method, data.email);

      await loginPage.sendOtpButton.click();
      if (method === 'phone') {
        await expect(
          page.getByText('입력하신 휴대폰 번호로 코드가 전송되었습니다. 문자 메세지를 확인해 주세요.', { exact: true })
        ).toBeVisible();
      } else {
        await expect(
          page.getByText('입력하신 이메일로 코드가 전송되었습니다. 이메일을 확인해 주세요.', { exact: true })
        ).toBeVisible();
      }
      await expect(loginPage.confirmButton).toBeVisible();
      await loginPage.confirmButton.click();

      await loginPage.verifyOtpScreenDefaultUI();

      await loginPage.enterOtpAndVerifyComplete(data.otp);
      await expect(page).toHaveURL('/home');
    });
  }
  
  test.skip('[Auth] Login with same allowed IP shows success', async ({ page }) => {
    const { email, password } = loginData.sameallowedIpAccount;
    await loginPage.navigate();
    await loginPage.login(email, password);
    await expect(page).toHaveURL('/home');
  });
});
