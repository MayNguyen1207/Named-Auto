import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';

test.describe('[Auth] Normal User Login Feature Tests - Sleep', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  const sleepAccountData = [
    { method: 'email', data: loginData.inactiveEmail },
    { method: 'phone', data: loginData.inactivePhone }
  ] as const;
  for (const testData of sleepAccountData) {
    test(`[Auth] Sleep account - ${testData.method.toUpperCase()} verification flow`, async ({ page }) => {
      await loginPage.login(testData.data.email, testData.data.password);
      await loginPage.verifyInactiveAccountDialog(testData.data.expectedTexts);

      await loginPage.proceedToVerification(testData.method);
      if (testData.method === 'email') {
        await expect(loginPage.verificationEmailInput).toHaveValue(testData.data.email);
        await expect(loginPage.verificationEmailInput).not.toBeEditable();
      } else if (testData.method === 'phone') {
        await expect(loginPage.verificationPhoneInput).not.toHaveValue('');
        await expect(loginPage.verificationPhoneInput).not.toBeEditable();

        const countryDropdown = page.getByRole('button', { name: '+1' });
        await expect(countryDropdown).toBeVisible();
        await expect(countryDropdown.locator('svg').first()).toBeVisible();
        await expect(countryDropdown).toBeDisabled();
      }
      await loginPage.verifyVerificationDefaultUI(testData.method, testData.data.email);
      await loginPage.sendOtpAndProceedToInputScreen();
      await loginPage.verifyOtpScreenDefaultUI();

      await page.clock.install();
      await page.clock.fastForward('03:01');
      await loginPage.resendOtp();

      await loginPage.goBackButton.click();
      await loginPage.verifyVerificationDefaultUI(testData.method, testData.data.email);
      await loginPage.sendOtpButton.click();
      try {
        await expect(loginPage.confirmButton).toBeVisible({ timeout: 3000 });
        await loginPage.confirmButton.click();
      } catch (e) { }

      await loginPage.verifyOtpInputRestrictions();
      await loginPage.enterIncorrectOtpAndVerifyAlert('123549');
    });
  }

  const inactiveTestData = [
    { method: 'email', data: loginData.inactiveEmail },
    { method: 'phone', data: loginData.inactivePhone }
  ] as const;
  for (const { method, data } of inactiveTestData) {
    test(`[Auth] Check OTP countdown time, Resend OTP and Go Back button - ${method.toUpperCase()}`, async ({ page }) => {
      await loginPage.login(data.email, data.password);
      await loginPage.proceedToVerification(method);
      await loginPage.sendOtpAndProceedToInputScreen();

      await loginPage.verifyOtpScreenDefaultUI();
      await page.clock.install();
      await page.clock.fastForward('03:01');

      await loginPage.resendOtp();
      await loginPage.goBackButton.click();
      await loginPage.verifyVerificationDefaultUI(method, data.email);
    });

    test(`[Auth] Check what happens when clicking the button: OTP expired - ${method.toUpperCase()}`, async ({ page }) => {
      await loginPage.login(data.email, data.password);
      await loginPage.proceedToVerification(method);
      await loginPage.sendOtpAndProceedToInputScreen();

      await page.route('**/confirm-active-account', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1006,
            success: false,
            message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.'
          })
        });
      });

      await loginPage.otpInput.fill('123456');
      await expect(loginPage.verifyCompleteButton).toBeEnabled();
      await loginPage.verifyCompleteButton.click();
      await expect(
        page.getByText('인증 시간이 만료', { exact: false })
      ).toBeVisible({ timeout: 5000 });
      try {
        await page.getByRole('button', { name: '확인' }).click({ timeout: 2000 });
      } catch (e) {
        // Skip if the alert does not appear
      }
    });
  }

  const reactiveTestData = [
    { method: 'email', data: loginData.reactiveEmail },
    { method: 'phone', data: loginData.reactivePhone }
  ] as const;
  for (const { method, data } of reactiveTestData) {

    test(`[Auth] Inactive account reactivation flow only runs on Chromium - ${method.toUpperCase()}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium is required for this test due to specific browser behavior.');

      await loginPage.login(data.email, data.password);
      await loginPage.proceedToVerification(method);
      await loginPage.sendOtpButton.click();
      try {
        await expect(loginPage.confirmButton).toBeVisible({ timeout: 3000 });
        await loginPage.confirmButton.click();
      } catch (e) { }

      await loginPage.enterOtpAndVerifyComplete('123456');
      await loginPage.handleReactivationSuccessAlert();
      await expect(page).toHaveURL('/login');

      await loginPage.passwordInput.fill(data.password);
      await loginPage.loginButton.click();
      await expect(page).toHaveURL('/home');
    });
  }
});
