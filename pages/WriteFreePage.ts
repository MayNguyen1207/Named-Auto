import {expect, Locator, Page} from '@playwright/test';
import { BasePage } from './BasePage';

export class WriteFreePage extends BasePage {
    readonly page:  Page;
    readonly titleInput: Locator;
    readonly contentInput: Locator;
    readonly emojiBtn: Locator;
    readonly writeBtn: Locator;
    readonly cancelBtn: Locator;
    readonly titleErrorMsg: Locator;
    readonly termsLnk: Locator;
    readonly prisonTermsLnk: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.titleInput = page.getByPlaceholder('글 제목을 입력해주세요.');
        this.contentInput = page.getByRole('textbox', {name: '리치 텍스트 편집기. 편집 영역: main'});
        this.emojiBtn = page.getByRole('button', { name: 'Emoji 28', exact: true });
        this.writeBtn = page.getByRole('button', {name: '글쓰기'});
        this.cancelBtn = page.getByText('취소', { exact: true });
        this.titleErrorMsg = page.getByText('제목을 입력해 주세요.', { exact: true });
        this.termsLnk = page.getByRole('link', { name: '이용약관' });
        this.prisonTermsLnk = page.getByRole('link', { name: '영창/수감규정' });
    }

    async navigate() {
        await this.page.goto('/community/create?boardType=free');
        await this.closeMainBannerIfPresent();
    }

    async enterTitle(title: string) {
        await this.titleInput.fill(title);
    }

    async enterContent(content: string) {
        await this.contentInput.click();
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            await this.contentInput.pressSequentially(lines[i]);
            if (i < lines.length - 1) {
                await this.page.keyboard.press('Enter');
            }
        }
    }
    async clickWriteBtn() {
        await this.writeBtn.click();
    }

    async writePost(title: string, content: string) {
        await this.closeMainBannerIfPresent()
        await this.enterTitle(title);
        await this.enterContent(content);
    }

    async insertEmoji() {
        await this.emojiBtn.click();
    }

    async clickCancelBtn() {
        await this.cancelBtn.click();
    }

    async clearTitleInput() {
        await this.titleInput.clear();
    }

    async clickTermsLnk() {
        const newPagePromise = this.page.context().waitForEvent('page');
        await this.termsLnk.click();
        return await newPagePromise;
    }

    async clickPrisonTermsLnk() {
        const newPagePromise = this.page.context().waitForEvent('page');
        await this.prisonTermsLnk.click();
        return await newPagePromise;
    }
}