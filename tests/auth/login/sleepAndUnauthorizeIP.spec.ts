import { test, expect } from '@playwright/test';
import '../../../utils/authSetupCooldown';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';

test.describe('[Auth] Normal User Login Feature Tests - Sleep and Authorize IP', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  const sleepAndUnauthorizedDataOTP = [
    { method: 'email', data: loginData.sleepAndUnauthorizedEmailOTP },
    { method: 'phone', data: loginData.sleepAndUnauthorizedPhoneOTP }
  ] as const;

  for (const { method, data } of sleepAndUnauthorizedDataOTP) {
    test(`[Auth] Sleep + Unauthorized IP - Check OTP expired alert - ${method.toUpperCase()}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium is required for this test due to specific browser behavior.');
      await loginPage.login(data.email, data.password);
      await expect(loginPage.inactiveAccountDialog).toBeVisible();

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
      await expect(loginPage.verifyIpDialog).toBeVisible();
      await loginPage.proceedToVerificationFromIpDialog(method);
      await loginPage.sendOtpAndProceedToInputScreen();

      await page.route('**/*', async route => {
        const url = route.request().url();
        if (route.request().method() === 'POST' && (url.includes('confirm') || url.includes('verify'))) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 1006,
              success: false,
              message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.'
            })
          });
        } else {
          await route.fallback();
        }
      });

      await page.clock.install();
      await page.clock.fastForward('10:01');

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

      await expect(loginPage.verifyCompleteButton).toBeVisible();
      await expect(page).not.toHaveURL('/home');
    });
  }

  const sleepAndUnauthorizedData = [
    { method: 'email', data: loginData.sleepAndUnauthorizedEmail },
    { method: 'phone', data: loginData.sleepAndUnauthorizedPhone }
  ] as const;

  for (const { method, data } of sleepAndUnauthorizedData) {
    test(`[Auth] Sleep + Unauthorized IP account reactivation flow - ${method.toUpperCase()}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium is required for this test due to specific browser behavior.');

      await loginPage.login(data.email, data.password);
      await loginPage.proceedToVerification(method);
      if (method === 'email') {
        await expect(loginPage.verificationEmailInput).toHaveValue(data.email);
        await expect(loginPage.verificationEmailInput).not.toBeEditable();
      } else if (method === 'phone') {
        await expect(loginPage.verificationPhoneInput).not.toHaveValue('');
        await expect(loginPage.verificationPhoneInput).not.toBeEditable();

        const countryDropdown = page.getByRole('button', { name: '+1' });
        await expect(countryDropdown).toBeVisible();
        await expect(countryDropdown.locator('svg').first()).toBeVisible();
        await expect(countryDropdown).toBeDisabled();
      }
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
      await expect(loginPage.verifyIpDialog).toBeVisible();
      await loginPage.verifyUnauthorizedIpDialog();

      await loginPage.goToMainPageButton.click();
      await expect(page).toHaveURL('/home');

      await loginPage.navigate();
      await loginPage.login(data.email, data.password);
      await loginPage.verifyUnauthorizedIpDialog();
      await loginPage.proceedToVerificationFromIpDialog(method);

      await loginPage.verifyVerificationDefaultUI(method, data.email);

      await loginPage.sendOtpButton.click();
      if (method === 'phone') {
        await expect(
          page.getByText('입력하신 휴대폰 번호로 코드가 전송되었습니다. 문자 메세지를 확인해 주세요.', { exact: true })
        ).toBeVisible({ timeout: 5000 });
      } else {
        await expect(
          page.getByText('입력하신 이메일로 코드가 전송되었습니다. 이메일을 확인해 주세요.', { exact: true })
        ).toBeVisible({ timeout: 5000 });
      }

      const currentAlert = page.getByRole('dialog', { name: '알림' }).last();
      await currentAlert.getByRole('button', { name: '확인' }).click();

      const currentVerificationDialog = page.getByLabel('Phone or Email verification').last();
      const verifyCompleteBtn = currentVerificationDialog.getByRole('button', { name: '인증 완료' });
      await expect(verifyCompleteBtn).toBeDisabled({ timeout: 5000 });
      await loginPage.verifyOtpScreenDefaultUI();

      await page.clock.install();
      await page.clock.fastForward('03:01');
      await loginPage.verifyOtpResendUI();
      await loginPage.resendOtp();
      await loginPage.goBackButton.click();

      if (method === 'email') {
        await expect(loginPage.verificationEmailInput).not.toBeEditable();
      } else if (method === 'phone') {
        await expect(loginPage.verificationPhoneInput).not.toBeEditable();
        await expect(page.getByRole('button', { name: '+1' })).toBeDisabled();
      }

      await loginPage.sendOtpButton.click();
      try {
        await expect(loginPage.confirmButton).toBeVisible({ timeout: 3000 });
        await loginPage.confirmButton.click();
      } catch (e) { }

      await loginPage.verifyOtpInputRestrictions();
      await loginPage.enterIncorrectOtpAndVerifyAlert('123549');
      await loginPage.enterOtpAndVerifyComplete(data.otp || '123456');
      await expect(page).toHaveURL('/home');
    });
  }
});
