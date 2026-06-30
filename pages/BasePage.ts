import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // To close the main banner
    async closeMainBannerIfPresent() {
        const bannerDialog = this.page.getByTestId('dialog-content');
        const closeButton = bannerDialog.getByRole('button', { name: '오늘 하루 닫기' });
        await this.page.addLocatorHandler(bannerDialog, async () => {
            await closeButton.click({ force: true });
        });
    }

    // To check toast message
    getToastByType(type: 'error' | 'success' | 'info'): Locator {
        return this.page.locator(`[data-sonner-toast][data-type="${type}"]`);
    }
    async verifyToastMsg(type: 'error' | 'success' | 'info', expectedText: string) {
        const toast = this.getToastByType(type).filter({ hasText: expectedText });
        await expect(toast).toBeVisible();
    }
}