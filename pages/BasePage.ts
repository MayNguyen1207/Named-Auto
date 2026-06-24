import { Page } from '@playwright/test';

export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // To close the main banner
    async closeMainBannerIfPresent() {
        const bannerDialog = this.page.locator('div[role="dialog"]');
        const closeButton = bannerDialog.getByRole('button', { name: '오늘 하루 닫기' });
        try {
            await bannerDialog.waitFor({ state: 'visible', timeout: 1500 });
            await this.page.waitForTimeout(500);
            await closeButton.click({ force: true });
            await bannerDialog.waitFor({ state: 'hidden', timeout: 1000 });
            console.log("Closed main banner.");
        } catch (e) {
            // No banner found!
        }
    }
}