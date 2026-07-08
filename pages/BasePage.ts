import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    //System Notice dialog
    readonly noticeDialog: Locator; //Notice popup
    readonly noticeDialogCancelBtn: Locator;
    readonly noticeDialogConfirmBtn: Locator;
    readonly verifyBtn: Locator; //Verification requirement notice popup

    readonly moveLogin: Locator; //Move to Login popup
    readonly moveLoginCfBtn: Locator;
    readonly moveLoginCancelBtn: Locator;

    readonly hoverTooltip: Locator; //Tool-tip shown when hovering

    //Prisoner popup
    readonly jailPoster: Locator;
    readonly prisonNotice: Locator;
    readonly previousPageBtn: Locator;

    readonly noDataLogo: Locator;

    //Pagiantion
    readonly pagCombo: Locator;
    readonly pagSelectedValue: Locator;
    readonly pagInput: Locator;
    readonly pagPreviousBtn: Locator;
    readonly pagNextBtn: Locator;
    readonly pagComboList: Locator;
    readonly pagOption: Locator;

    constructor(page: Page) {
        this.page = page;

        this.noticeDialog = page.getByRole('dialog').filter({ hasText: '알림' });
        this.noticeDialogCancelBtn = this.noticeDialog.getByRole('button', { name: '취소' });
        this.noticeDialogConfirmBtn = this.noticeDialog.getByRole('button', { name: '확인' });
        this.verifyBtn = this.noticeDialog.getByRole('button', { name: '본인 인증' });

        this.moveLogin = page.getByRole('dialog').filter({ hasText: '로그인 화면으로 이동' });
        this.moveLoginCfBtn = this.moveLogin.getByRole('button', { name: '확인' });
        this.moveLoginCancelBtn = this.moveLogin.getByRole('button', { name: '취소' });

        this.hoverTooltip = page.getByTestId('tooltip-content');

        this.jailPoster = page.getByRole('img', { name: 'jailed-poster' });
        this.prisonNotice = page.locator("//div[@role='alert']");
        this.previousPageBtn = page.getByRole('button', { name: '이전 페이지' });

        this.noDataLogo = page.getByRole('img', { name: 'no data' });

        this.pagCombo = page.getByRole('combobox');
        this.pagSelectedValue = page.locator('span[data-testid="select-value"]');
        this.pagInput = page.getByRole('textbox', { name: '페이지로 이동' });
        this.pagPreviousBtn = page.locator('[data-slot="pagination-item"]').first();
        this.pagNextBtn = page.locator('[data-slot="pagination-item"]').last();
        this.pagComboList = page.getByRole('listbox');
        this.pagOption = page.getByRole('option');
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

    // To check pagination
    async clickPageNumber(num: number) {
        await this.page.locator('[data-slot="pagination-item"]').filter({ hasText: `"${num}"` }).click();
    }
    
    async goToPageViaInput(num: string) {
        await this.pagInput.fill(num);
        await this.pagInput.press('Enter');
    }
}