import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import loginData from '../data-test/login-data.json';
import { buildInvalidLoginData, buildRecaptchaData } from '../utils/testRandomDataLogin';

test.describe('[Auth] Normal User Login Feature Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('[Auth] Verify UI Login and successful login flow', async ({ page }) => {
    // 1. Default state of the login page
    await expect(loginPage.emailInput).toBeEnabled();
    await expect(page.getByLabel('이메일 또는 휴대폰 번호')).toBeVisible();
    await expect(loginPage.passwordInput).toBeEnabled();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(loginPage.loginButton).toBeDisabled(); 

    // 2. Verify email validation (Enter email without password -> Login button should be disabled)
    for (const input of loginData.emailValidation.validInputs) {
      await loginPage.emailInput.fill(input);
      await expect(loginPage.emailInput).toHaveValue(input);
      await expect(loginPage.loginButton).toBeDisabled(); 
    }
    
    // Verify invalid email format triggers validation message and disables login button
    await loginPage.emailInput.fill(loginData.emailValidation.invalidFormat);
    await loginPage.emailInput.blur(); 
    await expect(loginPage.emailValidationMsg).toBeVisible();
    await expect(loginPage.loginButton).toBeDisabled();
    await loginPage.emailInput.clear();

    // 3. Verify password validation (Enter password without email -> Login button should be disabled)
    for (const input of loginData.passwordValidation.validInputs) {
      await loginPage.passwordInput.fill(input);
      await expect(loginPage.passwordInput).toHaveValue(input);
      await expect(loginPage.loginButton).toBeDisabled();
    }

    // 4. Verify successful login flow
    // Enter both Email and Password correctly
    await loginPage.emailInput.fill(loginData.valid.email);
    await loginPage.passwordInput.fill(loginData.valid.password);
    await expect(loginPage.loginButton).toBeEnabled();
    await loginPage.loginButton.click();
    await expect(page).toHaveURL('/home');
  });

  test('[Auth] Sleep account displays an sleep dialog and email verification flow', async ({ page }) => {
    await loginPage.login(loginData.inactive.email, loginData.inactive.password);
    
    // 1. Inactive account dialog opens
    await loginPage.verifyInactiveAccountDialog(loginData.inactive.expectedTexts);

    // 1.1 Check [메인페이지로 이동하기] button
    await loginPage.goToMainPageButton.click();
    await expect(page).toHaveURL('/home');

    // Re-login to continue the email verification flow
    await loginPage.navigate();
    await loginPage.login(loginData.inactive.email, loginData.inactive.password);
    await loginPage.verifyInactiveAccountDialog(loginData.inactive.expectedTexts);

    // 2. Click [이메일 인증] button → opens Phone or Email verification dialog
    await loginPage.proceedToEmailVerification();

    // 3. Default UI: email input pre-filled (readonly) + [인증번호 받기] button visible
    await loginPage.verifyEmailVerificationDefaultUI(loginData.inactive.email);

    // 4. Click [인증번호 받기] → alert shown → click 확인 → move to OTP input screen
    await loginPage.sendOtpAndProceedToInputScreen();

    // 5. OTP screen default UI (including dynamic countdown text)
    await loginPage.verifyOtpScreenDefaultUI();

    // 5.1 Click [뒤로 가기] button -> Move back to Email input screen
    await loginPage.goBackButton.click();
    await loginPage.verifyEmailVerificationDefaultUI(loginData.inactive.email);
    
    // Proceed to OTP screen again to continue the test flow
    // On the second attempt, the confirmation alert might not appear due to rate limiting
    await loginPage.sendOtpButton.click();
    try {
      await expect(loginPage.confirmButton).toBeVisible({ timeout: 3000 });
      await loginPage.confirmButton.click();
    } catch (e) {
      // Ignored if alert does not appear
    }

    // 6. OTP Input Restrictions Validations
    await loginPage.verifyOtpInputRestrictions();

    // 6.1 Check what happens when clicking the button: Incorrect verification code
    await loginPage.enterIncorrectOtpAndVerifyAlert('123549');

    // 7. Enter OTP & complete verification
    await loginPage.enterOtpAndVerifyComplete('123456');

    // 8. An alert dialog appears: "계정이 다시 활성화되었습니다. 로그인해 주세요."
    await loginPage.handleReactivationSuccessAlert();
    await expect(page).toHaveURL(/.*login/);
    
    // 9. Login after completing the verification process → Can login like normal account
    // Email is preserved, only password needs to be re-entered
    await loginPage.passwordInput.fill(loginData.inactive.password);
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

  test('[Auth] Login with same allowed IP shows success', async ({ page }) => {
    const { email, password} = loginData.sameallowedIpAccount;
    await loginPage.navigate();
    await loginPage.login(email, password);
    await expect(page).toHaveURL('/home');
  });

  test('[Auth] Sleep + Unauthorized IP account displays dialog and allows moving to main page', async ({ page }) => {
    await loginPage.login(loginData.sleepandunauthorizedIpAccount.email, loginData.sleepandunauthorizedIpAccount.password);
    await expect(loginPage.inactiveAccountDialog).toBeVisible();
    await loginPage.goToMainPageButton.click();
    await expect(page).toHaveURL('/home');
  });

  const invalidLoginData = buildInvalidLoginData(loginData.invalid);
  for (const data of invalidLoginData) {
    test(`[Auth] Verify login fails - ${data.scenario}`, async ({ page }) => {
      await loginPage.login(data.email, data.password);
      await expect(loginPage.loginErrorForm).toContainText(data.expectedErrorMsg);
    });
  }
});

test.describe('[Auth] Admin Login Tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('[Auth] Admin login from invalid IP shows error message', async ({ page }) => {
    const { email, password, fakeIp, expectedErrorMessage } = loginData.adminInvalidIp;
    
    await page.setExtraHTTPHeaders({
      'X-Forwarded-For': fakeIp,
      'X-Real-IP': fakeIp
    });
    
    await loginPage.navigate();
    await loginPage.login(email, password);
    await expect(loginPage.loginErrorForm).toContainText(expectedErrorMessage);
  });
});