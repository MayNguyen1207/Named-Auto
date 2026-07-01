import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    //System Notice dialog
    readonly noticeDialog: Locator;
    readonly noticeDialogCancelBtn: Locator;

    //Verification requirement popup
    readonly verifyBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        
        this.noticeDialog = page.getByRole('dialog').filter({ hasText: '알림' });;
        this.noticeDialogCancelBtn = this.noticeDialog.getByRole('button', { name: '취소' });
        this.verifyBtn = this.noticeDialog.getByRole('button', { name: '본인 인증' });
    }

    // To close the main banner
    async closeMainBannerIfPresent() {
        const bannerDialog = this.page.getByRole('dialog').filter({ hasText: '오늘 하루 닫기' });
        const closeButton = bannerDialog.getByRole('button', { name: '오늘 하루 닫기' });
        await this.page.addLocatorHandler(bannerDialog, async () => {
            await closeButton.click({ force: true });
        });
    }

    // To close Verification campaign popup
    async closeVerificationPopup() {
        const verificationCampaignPopup = this.page.getByRole('dialog').filter({ hasText: '휴대전화 인증하시고 3,000 포인트를 놓치지 마세요!' });
        const cancelBtn = verificationCampaignPopup.getByRole('button', { name: '취소' });
        await this.page.addLocatorHandler(verificationCampaignPopup, async () => {
            await cancelBtn.click();
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