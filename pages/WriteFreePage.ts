import {expect, Locator, Page} from '@playwright/test';

export class WriteFreePage {
    readonly page:  Page;
    readonly titleInput: Locator;
    readonly contentInput: Locator;
    readonly writeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.titleInput = page.getByRole('textbox', {name: '글 제목을 입력해주세요'});
        this.contentInput = page.getByRole('textbox', {name: '리치 텍스트 편집기. 편집 영역: main'});
        this.writeButton = page.getByRole('button', {name: '글쓰기'});
    }

    async gotoWriteFreePage() {
        await this.page.goto('/community/create?boardType=free');
    }

    async enterTitle(title: string) {
        await this.titleInput.click();
        await this.titleInput.pressSequentially(title, {delay: 50});
        await this.titleInput.fill(title);
        await expect(this.titleInput).toHaveValue(title);
    }
    async enterContent(content: string) {
        await this.contentInput.click();
        await this.contentInput.pressSequentially(content, {delay: 50});
        await this.contentInput.fill(content);
        await expect(this.contentInput).toHaveValue(content);
    }
    async clickWriteButton() {
        await expect(this.writeButton).toBeEnabled({timeout: 1000});
        await this.writeButton.click();
    }
}