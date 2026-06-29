import { FrameLocator, Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly keepLoginToggle: Locator;
  readonly keepLoginCheckedIcon: Locator;
  readonly keepLoginUncheckedIcon: Locator;
  readonly findIdLink: Locator;
  readonly resetPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly loginErrorForm: Locator;
  readonly inactiveAccountDialog: Locator;
  readonly inactiveAccountDialogContent: Locator;
  readonly inactiveAccountActivateButton: Locator;
  readonly goToMainPageButton: Locator;
  readonly verifyIpDialog: Locator;
  readonly emailVerificationDialog: Locator;
  readonly emailVerificationDialogContent: Locator;
  readonly verificationEmailInput: Locator;
  readonly sendOtpButton: Locator;
  readonly confirmButton: Locator;
  readonly otpInput: Locator;
  readonly verifyCompleteButton: Locator;
  readonly goBackButton: Locator;
  readonly recaptchaFrame: FrameLocator;
  readonly passwordVisibilityToggleBtn: Locator;
  readonly eyeOpenIcon: Locator;
  readonly eyeOffIcon: Locator;
  readonly emailValidationMsg: Locator;
  readonly resetPasswordButton: Locator;


  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: '이메일 또는 휴대폰 번호' });
    this.passwordInput = page.getByRole('textbox', { name: '비밀번호' });
    this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    this.keepLoginToggle = page.locator('button:has-text("로그인 상태 유지")');
    this.keepLoginCheckedIcon = page.locator('svg.tabler-icon-square-rounded-check.w-6.h-6');
    this.keepLoginUncheckedIcon = page.locator('svg.tabler-icon-square-rounded.w-6.h-6');
    this.findIdLink = page.getByRole('link', { name: '아이디 찾기' });
    this.resetPasswordLink = page.getByRole('link', { name: '비밀번호 재설정' });
    this.registerLink = page.getByRole('link', { name: '회원 가입' });
    this.loginErrorForm = page.locator('form');
    this.inactiveAccountDialog = page.getByRole('dialog', { name: 'Inactive Account' });
    this.inactiveAccountDialogContent = page.getByTestId('dialog-content');
    this.inactiveAccountActivateButton = page.getByTestId('inactive-account-activate-button');
    this.goToMainPageButton = page.getByRole('button', { name: '메인페이지로 이동' });
    this.verifyIpDialog = page.getByRole('dialog', { name: 'Unauthorized IP' });
    this.emailVerificationDialog = page.getByRole('dialog', { name: 'Phone or Email verification' });
    this.emailVerificationDialogContent = page.getByLabel('Phone or Email verification');
    this.verificationEmailInput = this.emailVerificationDialogContent.getByRole('textbox');
    this.sendOtpButton = page.getByTestId('button-root');
    this.confirmButton = page.getByRole('button', { name: '확인' });
    this.otpInput = page.getByTestId('input-otp-root');
    this.verifyCompleteButton = page.getByRole('button', { name: '인증 완료' });
    this.goBackButton = page.getByRole('button', { name: '뒤로 가기' });
    this.recaptchaFrame = page.frameLocator('iframe[title*="reCAPTCHA"]');
    this.passwordVisibilityToggleBtn = page.locator('div:has(> #password) > button');
    this.eyeOpenIcon = this.passwordVisibilityToggleBtn.locator('svg.tabler-icon-eye');
    this.eyeOffIcon = this.passwordVisibilityToggleBtn.locator('svg.tabler-icon-eye-off');
    this.emailValidationMsg = page.getByText('유효한 이메일 주소를 입력해 주세요.', { exact: true });
    this.resetPasswordButton = page.getByRole('button', { name: '비밀번호 재설정' });
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }

  async loginAs(email: string, pass: string, options?: { keepLogin?: boolean }) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    if (options?.keepLogin === false) {
      await this.toggleKeepLogin(false);
    }
    await this.loginButton.click();
  }

  async fillCredentials(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
  }

  async clickLoginButton(times: number) {
    for (let i = 0; i < times; i++) {
      await expect(this.loginButton).toBeEnabled({ timeout: 10000 });
      await this.loginButton.click();
    }
  }

  async triggerFailedLoginAttempts(email: string, pass: string, attempts: number) {
    await this.fillCredentials(email, pass);
    await this.clickLoginButton(attempts);
  }

  async waitForRecaptchaChallenge(text: string) {
    await expect(this.recaptchaFrame.getByText(text)).toBeVisible({ timeout: 20000 });
  }

  async expectKeepLoginDefaultChecked() {
    await expect(this.keepLoginCheckedIcon).toBeVisible();
    await expect(this.keepLoginUncheckedIcon).not.toBeVisible();
  }

  async expectLoginPage() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

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

  async toggleKeepLogin(checked: boolean) {
    const isChecked = await this.keepLoginCheckedIcon.isVisible();
    if (checked !== isChecked) {
      await this.keepLoginToggle.click();
      await expect(checked ? this.keepLoginCheckedIcon : this.keepLoginUncheckedIcon).toBeVisible();
    }
  }

  async togglePasswordVisibility() {
    await this.passwordVisibilityToggleBtn.click();
  }

  async verifyInactiveAccountDialog(expectedTexts: string[]) {
    await expect(this.inactiveAccountDialog).toBeVisible();
    for (const text of expectedTexts) {
      await expect(this.inactiveAccountDialogContent).toContainText(text);
    }
    await expect(this.inactiveAccountActivateButton).toBeVisible();
    await expect(this.goToMainPageButton).toBeVisible();
  }

  async proceedToEmailVerification() {
    await this.inactiveAccountActivateButton.click();
    await expect(this.emailVerificationDialog).toBeVisible();
    await expect(this.emailVerificationDialogContent).toContainText('이메일 인증');
  }

  async verifyEmailVerificationDefaultUI(email: string) {
    await expect(this.verificationEmailInput).toHaveValue(email);
    await expect(this.verificationEmailInput).toBeDisabled();
    await expect(this.sendOtpButton).toBeVisible();
  }

  async sendOtpAndProceedToInputScreen() {
    await this.sendOtpButton.click();
    await expect(this.confirmButton).toBeVisible();
    await this.confirmButton.click();
  }

  async verifyOtpScreenDefaultUI() {
    await expect(this.otpInput).toBeVisible();
    await expect(this.emailVerificationDialogContent).toContainText('인증번호 입력');
    await expect(this.emailVerificationDialogContent).toContainText('인증번호 6자리 입력');
    await expect(this.goBackButton).toBeVisible();
    await expect(this.verifyCompleteButton).toBeVisible();
    await expect(this.emailVerificationDialogContent).toContainText(/OTP 재전송은 \d+분 \d+초 후에 가능합니다/);
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
      await expect(this.emailVerificationDialogContent.locator('form')).toContainText('입력하신 인증 코드가 잘못되었습니다. 다시 시도해 주세요.');
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

  async handleReactivationSuccessAlert() {
    const successDialog = this.page.getByRole('dialog', { name: '알림' });
    await expect(successDialog).toBeVisible();
    await successDialog.getByRole('button', { name: '확인' }).click();
  }
}
