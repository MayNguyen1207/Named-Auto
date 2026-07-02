import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DetailFreePage extends BasePage {
    readonly page: Page;
    readonly postTitle: Locator;
    readonly postContent: Locator;
    readonly emojiImg: Locator;
    readonly postContentImg: Locator;
    readonly postVideoIframe: Locator;
    readonly postContentVideo: Locator;
    readonly postAuthor: Locator;
    readonly postCreationTime: Locator;

    readonly restrictedPostDialog: Locator;
    readonly restrictedPostBackBtn: Locator;
    readonly restrictedPostViewBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.postTitle = page.locator('h1:visible');
        this.postContent = page.getByLabel('게시글 내용');
        this.emojiImg = page.locator('.postContent img[src*="/editor/smileys/28.png"]');
        this.postContentImg = page.locator('.postContent img')
        this.postVideoIframe = page.locator("//figure[@class='media']//iframe");
        this.postContentVideo = page.locator('.postContent video');
        this.postAuthor = page.locator('article [data-testid="dropdown-menu-trigger"]').first();
        this.postCreationTime = page.getByRole('button', { name: 'Toggle date format' }).first();

        this.restrictedPostDialog = page.getByRole('dialog').filter({ hasText: '열람 제한 게시물 안내' });
        this.restrictedPostBackBtn = this.restrictedPostDialog.getByRole('button', { name: '이전 페이지' });
        this.restrictedPostViewBtn = this.restrictedPostDialog.getByRole('button', { name: '열람하기' });
    }

    async navigate(url: string) {
        await this.page.goto(url);
        await this.closeMainBannerIfPresent();
    }

    getPostIdFromUrl(url: string): string {
        return url.split('/').pop() || '';
    }
    async getCurrentPostId(page: Page): Promise<string> {
        const currentUrl = page.url();
        return this.getPostIdFromUrl(currentUrl);
    }
}