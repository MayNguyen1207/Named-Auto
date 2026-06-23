import {test, expect} from '@playwright/test';
import {LoginPage} from '../pages/LoginPage';
import loginData from '../data-test/login-data.json';

test.describe('Login Feature Tests', () => {
let loginPage: LoginPage;
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

test('[Auth] User can login successfully', async ({page}) => {
  await loginPage.login(loginData.valid.email, loginData.valid.password);
  await expect(page).toHaveURL('http://dev-v2.named.net/home');
});

test('[Auth] Sleep account displays an sleep dialog', async ({ page }) => {
  await loginPage.login(loginData.inactive.email, loginData.inactive.password);
  await expect(loginPage.inactiveAccountDialog).toBeVisible();
});

test('[Auth] Verify IP shows dialog', async ({ page }) => {
  await loginPage.login(loginData.unauthorized.email, loginData.unauthorized.password);
  await expect(loginPage.verifyIpDialog).toBeVisible();
});

test('[Auth] ReCAPTCHA appears after repeated failed login attempts', async ({ page }) => {
  const recaptcha = loginData.recaptcha;
  await loginPage.triggerFailedLoginAttempts(recaptcha.email, recaptcha.password, recaptcha.attempts);
  await loginPage.waitForRecaptchaChallenge(recaptcha.text);
});

test('[Auth] Password reset dialog appears after failed attempts', async ({ page }) => {
  await loginPage.login(loginData.passwordReset.email, loginData.passwordReset.password);
  await page.getByRole('button', { name: '확인' }).click();
  await expect(page.locator('#main-content')).toContainText('비밀번호 재설정');
});

// Test cases for unsuccessful login
for (const data of loginData.invalid) {
  test(`[Auth] Verify login fails - ${data.scenario}`, async ({ page }) => {
    await loginPage.login(data.email, data.password);
    await expect(loginPage.loginErrorForm).toContainText(data.expectedErrorMsg);
  });
}

});