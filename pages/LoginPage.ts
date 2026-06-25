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
  readonly verifyIpDialog: Locator;
  readonly recaptchaFrame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: '이메일 또는 휴대폰 번호' });
    this.passwordInput = page.getByRole('textbox', { name: '비밀번호' });
    this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    this.keepLoginToggle = page.locator('button:has-text("로그인 상태 유지"), div.flex.items-center.p-1.bg-border.rounded-full.h-9');
    this.keepLoginCheckedIcon = page.locator('svg.tabler-icon-square-rounded-check.w-6.h-6');
    this.keepLoginUncheckedIcon = page.locator('svg.tabler-icon-square-rounded.w-6.h-6');
    this.findIdLink = page.getByRole('link', { name: '아이디 찾기' });
    this.resetPasswordLink = page.getByRole('link', { name: '비밀번호 재설정' });
    this.registerLink = page.getByRole('link', { name: '회원 가입' });
    this.loginErrorForm = page.locator('form');
    this.inactiveAccountDialog = page.getByRole('dialog', { name: 'Inactive Account' });
    this.verifyIpDialog = page.getByRole('dialog', { name: 'Unauthorized IP' });
    this.recaptchaFrame = page.frameLocator('iframe[title*="reCAPTCHA"]');
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
}
