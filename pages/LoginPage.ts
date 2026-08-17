import { FrameLocator, Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  // Page
  readonly page: Page;

  // Login form
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorForm: Locator;

  // Keep-login toggle
  readonly keepLoginToggle: Locator;

  // Password visibility
  readonly passwordVisibilityToggleBtn: Locator;
  readonly eyeOpenIcon: Locator;
  readonly eyeOffIcon: Locator;

  // Navigation links
  readonly findIdLink: Locator;
  readonly resetPasswordLink: Locator;
  readonly registerLink: Locator;

  // Inline validation
  readonly emailValidationMsg: Locator;
  readonly resetPasswordButton: Locator;

  // Inactive-account dialog
  readonly inactiveAccountDialog: Locator;
  readonly inactiveAccountDialogContent: Locator;
  readonly inactiveAccountActivateButton: Locator;
  readonly goToMainPageButton: Locator;

  // IP-verification dialog
  readonly verifyIpDialog: Locator;

  // Email / Phone verification dialog
  readonly emailVerificationDialog: Locator;
  readonly emailVerificationDialogContent: Locator;
  readonly verificationEmailInput: Locator;
  readonly verificationPhoneInput: Locator;
  readonly phoneCountryCode: Locator;
  readonly sendOtpButton: Locator;
  readonly confirmButton: Locator;

  // OTP input screen
  readonly otpInput: Locator;
  readonly otpForm: Locator;
  readonly verifyCompleteButton: Locator;
  readonly goBackButton: Locator;

  // reCAPTCHA
  readonly recaptchaFrame: FrameLocator;
  constructor(page: Page) {
    this.page = page;

    // Login form
    this.emailInput = page.getByRole('textbox', { name: '이메일' });
    this.passwordInput = page.getByLabel('비밀번호');
    this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    this.loginErrorForm = page.locator('form');

    // Keep-login toggle
    this.keepLoginToggle = page.getByRole('checkbox', { name: '로그인 상태 유지' });

    // Password visibility
    this.passwordVisibilityToggleBtn = page.getByTestId('password-visibility-toggle');
    this.eyeOpenIcon = this.passwordVisibilityToggleBtn.locator('svg.tabler-icon-eye');
    this.eyeOffIcon = this.passwordVisibilityToggleBtn.locator('svg.tabler-icon-eye-off');

    // Navigation links
    this.findIdLink = page.getByRole('link', { name: '아이디 찾기' });
    this.resetPasswordLink = page.getByRole('link', { name: '비밀번호 재설정' });
    this.registerLink = page.getByRole('tab', { name: '회원가입' })
    // Inline validation messages
    this.emailValidationMsg = page.getByText('유효한 이메일 주소를 입력해 주세요.', { exact: true });
    this.resetPasswordButton = page.getByRole('button', { name: '비밀번호 재설정' });

    // Inactive-account dialog
    this.inactiveAccountDialog = page.getByRole('dialog', { name: 'Inactive Account' });
    this.inactiveAccountDialogContent = page.getByTestId('dialog-content');
    this.inactiveAccountActivateButton = page.getByTestId('inactive-account-activate-button');
    this.goToMainPageButton = page.getByRole('button', { name: '메인페이지로 이동' });

    // IP-verification dialog
    this.verifyIpDialog = page.getByRole('dialog', { name: 'Unauthorized IP' });

    // Email/Phone verification dialog
    this.emailVerificationDialog = page.getByRole('dialog', { name: 'Phone or Email verification' });
    this.emailVerificationDialogContent = page.getByLabel('Phone or Email verification');
    this.verificationEmailInput = this.emailVerificationDialog.getByRole('textbox');
    this.verificationPhoneInput = this.emailVerificationDialog.locator('input[type="tel"]');
    this.phoneCountryCode = page.locator('div').filter({ hasText: /^US\+1$/ }).first();
    this.sendOtpButton = this.emailVerificationDialog.getByTestId('button-root').first();
    this.confirmButton = page.getByRole('button', { name: '확인' });

    // OTP input screen
    this.otpInput = page.getByTestId('input-otp-root');
    this.otpForm = page.getByLabel('Phone or Email verification').locator('form');
    this.verifyCompleteButton = page.getByRole('button', { name: '인증 완료' });
    this.goBackButton = page.getByRole('button', { name: '뒤로 가기' });

    // reCAPTCHA
    this.recaptchaFrame = page.frameLocator('iframe[title*="reCAPTCHA"]');
  }

  // Navigation
  async navigate() {
    await this.page.goto('/login');
  }

  // Login actions
  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);

    // Workaround for React hydration missing the input events if fired too early
    try {
      await expect(this.loginButton).toBeEnabled({ timeout: 2000 });
    } catch {
      await this.emailInput.clear();
      await this.emailInput.fill(email);
      await this.passwordInput.clear();
      await this.passwordInput.fill(pass);
      await this.passwordInput.press('Tab'); // Trigger blur event for validation
    }

    await this.loginButton.click();
  }

  // Fill credentials with optional keep-login override, then click login.
  async loginAs(email: string, pass: string, options?: { keepLogin?: boolean }) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    if (options?.keepLogin === false) {
      await this.toggleKeepLogin(false);
    }
    await this.loginButton.click();
  }

  // Fill credentials only (no click).
  async fillCredentials(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
  }

  // Click the login button `times` times, waiting for it to be enabled each time.
  async clickLoginButton(times: number) {
    for (let i = 0; i < times; i++) {
      await expect(this.loginButton).toBeEnabled({ timeout: 10000 });
      await this.loginButton.click();
    }
  }

  // Convenience: fill credentials then click login `attempts` times.
  async triggerFailedLoginAttempts(email: string, pass: string, attempts: number) {
    await this.fillCredentials(email, pass);
    await this.clickLoginButton(attempts);
  }

  // Keep-login
  async toggleKeepLogin(checked: boolean) {
    const isChecked = await this.keepLoginToggle.isChecked();
    if (checked !== isChecked) {
      await this.keepLoginToggle.click();
    }

    await expect(this.keepLoginToggle).toHaveAttribute('aria-checked', checked ? 'true' : 'false');
    if (checked) {
      await expect(this.keepLoginToggle).toBeChecked();
    } else {
      await expect(this.keepLoginToggle).not.toBeChecked();
    }
  }

  async expectKeepLoginDefaultChecked() {
    await expect(this.keepLoginToggle).toBeChecked();
  }

  // Password visibility
  async togglePasswordVisibility() {
    await this.passwordVisibilityToggleBtn.click();
  }

  // Navigation links
  async openFindIdPage() {
    await expect(this.findIdLink).toBeVisible();
    await this.findIdLink.click();
  }

  async openResetPasswordPage() {
    await expect(this.resetPasswordLink).toBeVisible();
    await this.resetPasswordLink.click();
  }

  async openRegisterPage() {
    await expect(this.registerLink).toBeVisible();
    await this.registerLink.click();
  }

  // Login-page assertion
  async expectLoginPage() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  // reCAPTCHA
  async waitForRecaptchaChallenge(text: string) {
    await expect(this.recaptchaFrame.getByText(text)).toBeVisible({ timeout: 20000 });
  }

  // Inactive-account dialog
  async verifyInactiveAccountDialog(expectedTexts: string[]) {
    await expect(this.inactiveAccountDialog).toBeVisible();
    for (const text of expectedTexts) {
      await expect(this.inactiveAccountDialogContent).toContainText(text);
    }
    await expect(this.inactiveAccountActivateButton).toBeVisible();
    await expect(this.goToMainPageButton).toBeVisible();
  }

  async proceedToVerification(type: 'email' | 'phone') {
    await this.inactiveAccountActivateButton.click();
    await expect(this.emailVerificationDialog).toBeVisible();

    const expectedTitle = type === 'email' ? '이메일 인증' : '휴대폰 인증';
    await expect(this.emailVerificationDialog).toContainText(expectedTitle);
  }

  // Email/Phone verification dialog
  async verifyVerificationDefaultUI(type: 'email' | 'phone', email?: string) {
    if (type === 'email') {
      await expect(this.verificationEmailInput).toHaveValue(email!);
      await expect(this.verificationEmailInput).toBeDisabled();
    } else {
      await expect(this.emailVerificationDialog).toContainText(
        '본인 명의의 휴대폰으로 본인 인증을 완료한 회원의 경우'
      );
      await expect(this.phoneCountryCode).toBeVisible();
    }
    await expect(this.sendOtpButton).toBeVisible();
  }

  async sendOtpAndProceedToInputScreen() {
    await this.sendOtpButton.click();
    await expect(this.confirmButton).toBeVisible();
    await this.confirmButton.click();
  }

  async sendOtpFromEmailScreen() {
    await this.sendOtpButton.click();
    try {
      await expect(this.confirmButton).toBeVisible({ timeout: 3000 });
      await this.confirmButton.click();
    } catch {
      // Alert does not always appear — intentionally ignored
    }
  }

  // OTP input screen
  async verifyOtpScreenDefaultUI() {
    await expect(this.otpInput).toBeVisible();
    await expect(this.emailVerificationDialog).toContainText('인증번호 입력');
    await expect(this.emailVerificationDialog).toContainText('인증번호 6자리 입력');
    await expect(this.goBackButton).toBeVisible();
    await expect(this.verifyCompleteButton).toBeVisible();
    await expect(this.emailVerificationDialog).toContainText(/OTP 재전송은 \d+분 \d+초 후에 가능합니다/);
    await expect(this.verifyCompleteButton).toBeDisabled();
  }

  async verifyOtpInputRestrictions() {
    await this.otpInput.fill('   ');
    await expect(this.otpInput).toHaveValue('');

    await this.otpInput.fill('!@#$%^');
    await expect(this.otpInput).toHaveValue('');

    await this.otpInput.fill('abcdef');
    await expect(this.otpInput).toHaveValue('');

    await this.otpInput.fill('12345678');
    await expect(this.otpInput).toHaveValue('123456');

    await this.otpInput.fill('');
  }

  async enterIncorrectOtpAndVerifyAlert(otp: string) {
    await this.otpInput.fill(otp);
    await this.verifyCompleteButton.click();

    const errorDialog = this.page.getByRole('dialog', { name: '알림' });
    try {
      await expect(errorDialog).toBeVisible({ timeout: 3000 });
      await expect(errorDialog).toContainText('입력하신 인증 코드가 잘못되었습니다. 다시 시도해 주세요.');
      await errorDialog.getByRole('button', { name: '확인' }).click();
    } catch {
      await expect(this.emailVerificationDialog.locator('form')).toContainText(
        '입력하신 인증 코드가 잘못되었습니다. 다시 시도해 주세요.'
      );
    }
    await expect(this.otpInput).toHaveValue(otp);
  }

  async enterOtpAndVerifyComplete(otp: string) {
    await this.otpInput.fill(otp.slice(0, 3));
    await expect(this.verifyCompleteButton).toBeDisabled();

    await this.otpInput.fill(otp);
    await expect(this.verifyCompleteButton).toBeEnabled();
    await this.verifyCompleteButton.click();
  }

  async enterExpiredOtpAndVerifyAlert(otp: string, expectedMsg: string) {
    await this.otpInput.fill(otp);
    await expect(this.verifyCompleteButton).toBeEnabled();
    await this.verifyCompleteButton.click();

    const errorDialog = this.page.getByRole('dialog', { name: '알림' });
    await expect(errorDialog).toBeVisible({ timeout: 5000 });
    await expect(errorDialog).toContainText(expectedMsg);
    await errorDialog.getByRole('button', { name: '확인' }).click();
    await expect(errorDialog).toBeHidden();
  }

  // OTP resend / countdown
  async verifyOtpResendUI() {
    await expect(this.otpForm).toContainText('OTP를 받지 못하셨나요?');
    await expect(this.otpForm).toContainText('인증번호 재발송');
  }
  async verifyCountdownIsDecrementing() {
    await expect(this.emailVerificationDialog).toContainText(/OTP 재전송은 \d+분 \d+초 후에 가능합니다/);
    const before = await this.emailVerificationDialog.textContent();
    await this.page.waitForTimeout(2000);
    const after = await this.emailVerificationDialog.textContent();
    expect(before).not.toEqual(after);
  }
  async resendOtp() {
    await this.emailVerificationDialog.getByText('인증번호 재전송').click({ force: true });
    await this.page.getByRole('button', { name: '확인' }).click();
    await expect(this.emailVerificationDialog).toContainText(/OTP 재전송은 \d+분 \d+초 후에 가능합니다/);
  }

  // Reactivation success
  async handleReactivationSuccessAlert() {
    const successDialog = this.page.getByRole('dialog', { name: '알림' });
    await expect(successDialog).toBeVisible();
    await successDialog.getByRole('button', { name: '확인' }).click();
  }
  // Unauthorized-IP dialog
  async verifyUnauthorizedIpDialog(type?: 'email' | 'phone') {
    const dialog = this.page.getByTestId('dialog-content').first();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('지정한 IP 이외의 IP에서 로그인하셨습니다.');
    await expect(dialog.getByRole('paragraph')).toContainText(
      '지정한 IP 이외의 IP에서 로그인하는 경우, 인증 완료 후 로그인이 가능합니다.'
    );

    if (type === 'email') {
      await expect(this.verifyIpDialog.getByRole('button', { name: '이메일 인증', exact: true })).toBeVisible();
    } else if (type === 'phone') {
      await expect(this.verifyIpDialog.getByRole('button', { name: '휴대폰 인증', exact: true })).toBeVisible();
    } else {
      await expect(this.verifyIpDialog.getByRole('button', { name: '휴대폰 인증', exact: true })).toBeVisible();
      await expect(this.verifyIpDialog.getByRole('button', { name: '이메일 인증', exact: true })).toBeVisible();
    }

    await expect(this.goToMainPageButton).toBeVisible();
  }

  async proceedToVerificationFromIpDialog(type: 'email' | 'phone') {
    const selectedOption = type === 'email'
      ? this.verifyIpDialog.getByRole('button', { name: '이메일 인증', exact: true })
      : this.verifyIpDialog.getByRole('button', { name: '휴대폰 인증', exact: true });

    await expect(selectedOption).toBeVisible();
    await selectedOption.click();

    const expectedTitle = type === 'email' ? '이메일 인증' : '휴대폰 인증';
    await expect(this.emailVerificationDialog).toContainText(expectedTitle);
  }

  async handleLoginRequiredDialog(email: string, password: string, expectedLoginUrl: string | RegExp, finalExpectedUrl: string | RegExp) {
    const loginRequiredDialog = this.page.getByRole('dialog');
    await expect(loginRequiredDialog).toBeVisible();
    await loginRequiredDialog.getByRole('button', { name: '확인' }).click({ force: true });

    await expect(this.page).toHaveURL(expectedLoginUrl, { timeout: 15000 });

    await this.login(email, password);
    await expect(this.page).toHaveURL(finalExpectedUrl, { timeout: 15000 });
  }
}
