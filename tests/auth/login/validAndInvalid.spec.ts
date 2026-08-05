import { test, expect } from '@playwright/test';
import './authSetupCooldown';
import { HomePage } from '../../../pages/HomePage';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';
import { buildInvalidLoginData, buildRecaptchaData } from '../../../utils/testRandomDataLogin';

test.describe('[Auth] Normal User Login Feature Tests - Success and Invalid', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('[Auth] Verify UI Login and successful login flow', async ({ page }) => {
    await expect(loginPage.emailInput).toBeEnabled();
    await expect(page.getByLabel('이메일 또는 휴대폰 번호')).toBeVisible();
    await expect(loginPage.passwordInput).toBeEnabled();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(loginPage.loginButton).toBeDisabled();

    for (const input of loginData.emailValidation.validInputs) {
      await loginPage.emailInput.fill(input);
      await expect(loginPage.emailInput).toHaveValue(input);
      await expect(loginPage.loginButton).toBeDisabled();
    }

    await loginPage.emailInput.fill(loginData.emailValidation.invalidFormat);
    await loginPage.emailInput.blur();
    await expect(loginPage.emailValidationMsg).toBeVisible();
    await expect(loginPage.loginButton).toBeDisabled();
    await loginPage.emailInput.clear();

    for (const input of loginData.passwordValidation.validInputs) {
      await loginPage.passwordInput.fill(input);
      await expect(loginPage.passwordInput).toHaveValue(input);
      await expect(loginPage.loginButton).toBeDisabled();
    }

    await loginPage.emailInput.fill(loginData.valid.email);
    await loginPage.passwordInput.fill(loginData.valid.password);
    await expect(loginPage.loginButton).toBeEnabled();
    await loginPage.loginButton.click();
    await expect(page).toHaveURL('/home');
  });

  test('[Auth] Hacking account shows hacking block message', async ({ page }) => {
    const { email, password, expectedMessages } = loginData.lockedAccount;
    await loginPage.login(email, password);
    for (const message of expectedMessages) {
      await expect(loginPage.loginErrorForm).toContainText(message);
    }
    await loginPage.resetPasswordButton.click();
    const expectedUrl = `/reset-password?email=${encodeURIComponent(email)}`;
    await expect(page).toHaveURL(expectedUrl);
  });

  test('[Auth] Blocked account shows block message', async ({ page }) => {
    const { email, password, expectedMessages } = loginData.blockedAccount;
    await loginPage.login(email, password);
    for (const message of expectedMessages) {
      await expect(loginPage.loginErrorForm).toContainText(message);
    }
  });

  test('[Auth] Deleted account shows deletion message', async ({ page }) => {
    const { email, password, expectedMessages } = loginData.deletedAccount;
    await loginPage.login(email, password);
    for (const message of expectedMessages) {
      await expect(loginPage.loginErrorForm).toContainText(message);
    }
  });

  test('[Auth] Default keep login checkbox is checked', async ({ page }) => {
    await loginPage.expectKeepLoginDefaultChecked();
  });

  test('[Auth] Find ID link navigates to find-id page', async ({ page }) => {
    await loginPage.openFindIdPage();
    await expect(page).toHaveURL('/find-id');
  });

  test('[Auth] Reset password link navigates to reset-password page', async ({ page }) => {
    await loginPage.openResetPasswordPage();
    await expect(page).toHaveURL('/reset-password');
  });

  test('[Auth] Register link navigates to register page', async ({ page }) => {
    await loginPage.openRegisterPage();
    await expect(page).toHaveURL('/register');
  });

  test('[Auth] Login without keeping session after browser restart', async ({ browser, page }) => {
    await loginPage.loginAs(loginData.valid.email, loginData.valid.password, { keepLogin: false });
    await expect(page).toHaveURL('/home');

    await page.context().close();
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    const homePageAfterRestart = new HomePage(newPage);
    const loginPageAfterRestart = new LoginPage(newPage);

    await homePageAfterRestart.navigateToLogin();
    await expect(newPage).toHaveURL('/login');
    await loginPageAfterRestart.expectLoginPage();
    await newContext.close();
  });

  test('[Auth] Keep login maintains session after browser restart', async ({ browser, page }) => {
    await loginPage.loginAs(loginData.valid.email, loginData.valid.password, { keepLogin: true });
    await expect(page).toHaveURL('/home');
    const storageState = await page.context().storageState();
    await page.context().close();
    const newContext = await browser.newContext({ storageState });
    const newPage = await newContext.newPage();
    const homePageAfterRestart = new HomePage(newPage);
    await newPage.goto('/home');
    await expect(newPage).toHaveURL('/home');
    const expectedName = loginData.valid.expectedUsername;
    await homePageAfterRestart.expectKeepLoginIndicatorVisible(expectedName);
    await newContext.close();
  });

  test('[Auth] ReCAPTCHA appears after repeated failed login attempts', async ({ page }) => {
    const recaptcha = buildRecaptchaData(loginData.recaptcha);
    await loginPage.triggerFailedLoginAttempts(recaptcha.email, recaptcha.password, recaptcha.attempts);
    await loginPage.waitForRecaptchaChallenge(recaptcha.text);
  });

  test('[Auth] Password reset dialog appears after failed attempts', async ({ page }) => {
    await loginPage.login(loginData.passwordReset.email, loginData.passwordReset.password);
    await page.getByRole('button', { name: '확인' }).click();
    const expectedUrl = `/reset-password?email=${encodeURIComponent(loginData.passwordReset.email)}`;
    await expect(page).toHaveURL(expectedUrl);
  });

  test('[Auth] Verify password visibility/hidden toggle', async ({ page }) => {
    await loginPage.passwordInput.fill(loginData.valid.password);

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.eyeOffIcon).toBeVisible();
    await expect(loginPage.eyeOpenIcon).toBeHidden();

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(loginPage.eyeOpenIcon).toBeVisible();
    await expect(loginPage.eyeOffIcon).toBeHidden();

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.eyeOffIcon).toBeVisible();
    await expect(loginPage.eyeOpenIcon).toBeHidden();
  });

  const invalidLoginData = buildInvalidLoginData(loginData.invalid);
  for (const data of invalidLoginData) {
    test(`[Auth] Verify login fails - ${data.scenario}`, async ({ page }) => {
      await loginPage.login(data.email, data.password);
      await expect(loginPage.loginErrorForm).toContainText(data.expectedErrorMsg);
    });
  }
});
