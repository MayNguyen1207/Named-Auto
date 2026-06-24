import {test, expect} from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import loginData from '../data-test/login-data.json';
import { buildInvalidLoginData, buildRecaptchaData } from '../utils/testRandomDataLogin';

test.describe('Login Feature Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

test('[Auth] User can login successfully', async ({page}) => {
  await loginPage.login(loginData.valid.email, loginData.valid.password);
  await expect(page).toHaveURL('/home');
});

test('[Auth] Sleep account displays an sleep dialog', async ({ page }) => {
  await loginPage.login(loginData.inactive.email, loginData.inactive.password);
  await expect(loginPage.inactiveAccountDialog).toBeVisible();
});

test('[Auth] Locked account shows hacking block message', async ({ page }) => {
  const { email, password, expectedMessages } = loginData.lockedAccount;
  await loginPage.login(email, password);
  for (const message of expectedMessages) {
    await expect(loginPage.loginErrorForm).toContainText(message);
  }
});

test('[Auth] Verify IP shows dialog', async ({ page }) => {
  await loginPage.login(loginData.unauthorized.email, loginData.unauthorized.password);
  await expect(loginPage.verifyIpDialog).toBeVisible();
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
  await homePageAfterRestart.expectKeepLoginIndicatorVisible();

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
  await expect(page.locator('#main-content')).toContainText('비밀번호 재설정');
});

// Test cases for unsuccessful login
const invalidLoginData = buildInvalidLoginData(loginData.invalid);
for (const data of invalidLoginData) {
  test(`[Auth] Verify login fails - ${data.scenario}`, async ({ page }) => {
    await loginPage.login(data.email, data.password);
    await expect(loginPage.loginErrorForm).toContainText(data.expectedErrorMsg);
  });
}

});