import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: '로그인' });
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

  async expectKeepLoginIndicatorVisible(expectedName: string) {
    const userProfile = this.page.getByText(expectedName, { exact: false });

    await expect(userProfile).toBeVisible();
    await expect(this.loginLink).toBeHidden();
  }

}
