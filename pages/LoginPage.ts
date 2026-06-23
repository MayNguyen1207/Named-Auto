import { FrameLocator, Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorForm: Locator;
  readonly inactiveAccountDialog: Locator;
  readonly verifyIpDialog: Locator;
  readonly recaptchaFrame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: '이메일 또는 휴대폰 번호' });
    this.passwordInput = page.getByRole('textbox', { name: '비밀번호' });
    this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    this.loginErrorForm = page.locator('form');
    this.inactiveAccountDialog = page.getByRole('dialog', { name: 'Inactive Account' });
    this.verifyIpDialog = page.getByRole('dialog', { name: 'Unauthorized IP' });
    this.recaptchaFrame = page.frameLocator('iframe[title*="reCAPTCHA"]');
  }

  async navigate() {
    await this.page.goto('http://dev-v2.named.net/login');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
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
}
