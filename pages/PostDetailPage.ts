import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostDetailPage extends BasePage {
    readonly page: Page;
    readonly postTitle: Locator;
    readonly postContent: Locator;
    readonly emojiImg: Locator;
    readonly postContentImg: Locator;
    readonly postVideoIframe: Locator;
    readonly postContentVideo: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.postTitle = page.locator('h1:visible');
        this.postContent = page.getByLabel('게시글 내용');
        this.emojiImg = page.locator('.postContent img[src*="/editor/smileys/28.png"]');
        this.postContentImg = page.locator('.postContent img')
        this.postVideoIframe = page.locator("//figure[@class='media']//iframe");
        this.postContentVideo = page.locator('.postContent video');
    }
}