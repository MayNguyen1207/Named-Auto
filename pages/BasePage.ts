import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    //System Notice dialog
    readonly noticeDialog: Locator; //Notice popup
    readonly noticeDialogCancelBtn: Locator;
    readonly verifyBtn: Locator; //Verification requirement notice popup

    readonly moveLogin: Locator; //Move to Login popup
    readonly moveLoginCfBtn: Locator;
    readonly moveLoginCancelBtn: Locator;

    readonly hoverTooltip: Locator; //Tool-tip shown when hovering

    // Login form
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.noticeDialog = page.getByRole('dialog').filter({ hasText: '알림' });
        this.noticeDialogCancelBtn = this.noticeDialog.getByRole('button', { name: '취소' });
        this.verifyBtn = this.noticeDialog.getByRole('button', { name: '본인 인증' });

        this.moveLogin = page.getByRole('dialog').filter({ hasText: '로그인 화면으로 이동' });
        this.moveLoginCfBtn = this.moveLogin.getByRole('button', { name: '확인' });
        this.moveLoginCancelBtn = this.moveLogin.getByRole('button', { name: '취소' });

        this.hoverTooltip = page.getByTestId('tooltip-content');

        this.emailInput = page.getByRole('textbox', { name: '이메일 또는 휴대폰 번호' });
        this.passwordInput = page.getByRole('textbox', { name: '비밀번호' });
        this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    }

    async login(email: string, pass: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
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