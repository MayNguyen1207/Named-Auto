import {expect, Locator, Page} from '@playwright/test';
import { BasePage } from './BasePage';

export class WriteFreePage extends BasePage {
    readonly page:  Page;
    readonly titleInput: Locator;
    readonly contentInput: Locator;
    readonly writeButton: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.titleInput = page.getByPlaceholder('글 제목을 입력해주세요.');
        this.contentInput = page.getByRole('textbox', {name: '리치 텍스트 편집기. 편집 영역: main'});
        this.writeButton = page.getByRole('button', {name: '글쓰기'});
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

    async writePost(title: string, content: string) {
        await this.enterTitle(title);
        await this.enterContent(content);
        await this.writeButton.click();
    }
}