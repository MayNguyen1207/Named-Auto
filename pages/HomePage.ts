import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;

  readonly chatInput: Locator;
  readonly chatSendBtn: Locator;
  readonly chatMenuBtn: Locator;
  readonly tabSports: Locator;
  readonly tabMiniGame: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: '로그인' });

    this.chatInput = page.getByTestId('input-field');
    this.chatSendBtn = page.locator('.tabler-icon.tabler-icon-send-2');
    this.chatMenuBtn = page.getByRole('button', { name: '채팅', exact: true });
    this.tabSports = page.getByRole('radio', { name: '스포츠' });
    this.tabMiniGame = page.getByRole('radio', { name: '미니게임' });
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

  async sendChatMessage(message: string) {
    await this.chatInput.fill(message);
    await this.chatInput.press('Enter');
  }

  async openChatMenu(menuItem: string) {
    await this.chatMenuBtn.click();
    await this.page.getByRole('menuitem', { name: menuItem }).click();
  }

  async switchChatChannel(channelName: string, currentButtonName: string | RegExp = '일반 채팅') {
    await this.page.getByRole('button', { name: currentButtonName }).first().click();
    await this.page.getByTestId('dropdown-menu-sub-trigger').click();
    await this.page.getByRole('menuitem', { name: channelName }).click();
  }
}
