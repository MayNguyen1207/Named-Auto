import { expect, Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly keepLoginIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: '로그인' });
    this.keepLoginIndicator = page.locator('div.flex.items-center.p-1.bg-border.rounded-full.h-9');
  }

  async navigate() {
    await this.page.goto('/home');
  }

  async openLogin() {
    await expect(this.loginLink).toBeVisible();
    await this.loginLink.click();
  }

  async navigateToLogin() {
    await this.navigate();
    await this.openLogin();
  }

  async expectKeepLoginIndicatorVisible() {
    await expect(this.keepLoginIndicator).toBeVisible();
  }
}
