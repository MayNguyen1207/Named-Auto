import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
    protected page: Page;

    //System Notice dialog
    readonly dialog: Locator;
    readonly noticeDialog: Locator; //Notice popup
    readonly dialogCancelBtn: Locator;
    readonly dialogConfirmBtn: Locator;
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

    //Pagination
    readonly pagCombo: Locator;
    readonly pagSelectedValue: Locator;
    readonly pagInput: Locator;
    readonly pagPreviousBtn: Locator;
    readonly pagNextBtn: Locator;
    readonly pagComboList: Locator;
    readonly pagOptions: Locator;

    //Checkbox
    readonly checkBox: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dialog = page.getByRole('dialog')
        this.noticeDialog = this.dialog.filter({ hasText: '알림' });
        this.dialogCancelBtn = this.dialog.getByRole('button', { name: '취소' });
        this.dialogConfirmBtn = this.dialog.getByRole('button', { name: '확인' });
        this.verifyBtn = this.dialog.getByRole('button', { name: '본인 인증' });

        this.moveLogin = page.getByRole('dialog').filter({ hasText: '로그인 화면으로 이동' });
        this.moveLoginCfBtn = this.moveLogin.getByRole('button', { name: '확인' });
        this.moveLoginCancelBtn = this.moveLogin.getByRole('button', { name: '취소' });

        this.hoverTooltip = page.getByTestId('tooltip-content');

        this.jailPoster = page.getByRole('img', { name: 'jailed-poster' });
        this.prisonNotice = page.locator("//div[@role='alert']");
        this.previousPageBtn = page.getByRole('button', { name: '이전 페이지' });

        this.noDataLogo = page.getByRole('img', { name: 'no data' });

        this.pagCombo = page.getByTestId('select-trigger').last();
        this.pagSelectedValue = page.locator('span[data-testid="select-value"]').last();
        this.pagInput = page.getByRole('textbox', { name: '페이지로 이동' });
        this.pagPreviousBtn = page.locator('[data-slot="pagination-item"]').first();
        this.pagNextBtn = page.locator('[data-slot="pagination-item"]').last();
        this.pagComboList = page.getByRole('listbox');
        this.pagOptions = page.getByRole('option');

        this.checkBox = page.locator('button.flex.flex-row.gap-2.items-center').or(page.getByTestId('checkbox-root')); // Tobe updated page.getByTestId('checkbox-root')
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
        const toast = this.getToastByType(type).filter({ hasText: expectedText }).first();
        await expect(toast).toBeVisible();
    }

    // To check pagination
    getPageItem(pageNumber: number | string) {
        return this.page
            .locator('nav[aria-label="pagination"] a, nav[aria-label="pagination"] button')
            .filter({ hasText: new RegExp(`^${pageNumber}$`) });
    }

    async clickPageNumber(num: number) {
        await this.page.getByRole('button', { name: new RegExp(`^${num}$`) }).click();
    }

    async goToPageViaInput(pageNumber: string, expectedPage: number | string) {
        await this.pagInput.fill(pageNumber);
        await this.pagInput.press('Enter');
        await this.page.waitForTimeout(500);
        await expect(this.getPageItem(expectedPage)).toHaveAttribute('aria-current', 'page');
    }

    async verifySelectedOption(num: number) {
        await expect(this.pagSelectedValue).toHaveText("10개씩 보기");
        await this.pagCombo.click();
        await this.page.waitForTimeout(200);
        await this.pagOptions.filter({ hasText: `${num}`}).click();
        await expect(this.pagSelectedValue).toHaveText(`${num}`+"개씩 보기");
    }
    async verifyListItemsNumber() {
        await this.pagCombo.click();
        const actualOptions = await this.pagOptions.allInnerTexts();
        const cleanedOptions = actualOptions.map(text => text.trim());
        const expectedOptions = ['10', '20', '30', '40', '50'];
        expect(cleanedOptions).toEqual(expectedOptions);
    }

    // To check checkbox
    async selectAllCheckBox() {
        await this.checkBox.first().click();
        const count = await this.checkBox.count();
        for (let i = 0; i < count; i++) {
            await expect(this.checkBox.nth(i).locator('svg')).toHaveClass(/tabler-icon-square-rounded-check/);
        }
    }

    async deselectAllCheckBox() {
        await this.checkBox.first().click();
        const count = await this.checkBox.count();
        for (let i = 0; i < count; i++) {
            await expect(this.checkBox.nth(i).locator('svg')).toHaveClass(/tabler-icon-square-rounded/);
        }
    }

    async selectAndDeselectCheckBox() {
        await this.checkBox.nth(1).click();
        await expect(this.checkBox.locator('svg')).toHaveClass(/tabler-icon-square-rounded-check/);

        await this.checkBox.nth(1).click();
        await expect(this.checkBox.locator('svg')).toHaveClass(/tabler-icon-square-rounded/);
    }
}