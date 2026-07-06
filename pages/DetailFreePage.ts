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
    readonly editNumTxt: Locator;
    readonly likeBtn: Locator;
    readonly cmtInput: Locator;
    readonly submitCmtBtn: Locator;

    readonly suggestedPostTab: Locator;
    readonly postContainer: Locator;
    readonly postItem: Locator;
    readonly noSuggestedPostTxt: Locator;
    readonly sugPagiantion: Locator;
    readonly sugPrevBtn: Locator;
    readonly sugNextBtn: Locator;
    readonly otherPostTab: Locator;
    readonly noOtherPostTxt: Locator;

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
        this.editNumTxt = page.locator('span[data-testid="tooltip-trigger"]').filter({ hasText: '수정' });
        this.likeBtn = page.locator('section').nth(2).locator('button[data-testid="button-root"]'); //Need to update
        this.cmtInput = page.locator('[id="comment-textarea"]');
        this.submitCmtBtn = page.getByRole('button', { name: '댓글 전송' });

        this.suggestedPostTab = page.getByRole('tab', { name: '추천 게시물' });
        this.postContainer = page.locator('div.space-y-0'); //Need to update
        this.postItem = this.postContainer.locator('> div');
        this.noSuggestedPostTxt = page.getByText('추천 게시물이 없습니다.', { exact: true });
        this.sugPagiantion = page.locator('div.flex.items-center.justify-center.gap-2'); //Need to update
        this.sugPrevBtn = this.sugPagiantion.locator('button').first();
        this.sugNextBtn = this.sugPagiantion.locator('button').last();
        this.otherPostTab = page.getByRole('tab', { name: '글쓴이의 게시물 더보기' });
        this.noOtherPostTxt = page.getByText('글쓴이의 다른 게시물이 없습니다.', { exact: true });

        this.restrictedPostDialog = page.getByRole('dialog').filter({ hasText: '열람 제한 게시물 안내' });
        this.restrictedPostBackBtn = this.restrictedPostDialog.getByRole('button', { name: '이전 페이지' });
        this.restrictedPostViewBtn = this.restrictedPostDialog.getByRole('button', { name: '열람하기' });
    }

    async navigate(url: string) {
        await this.page.goto(url);
        await this.page.waitForTimeout(3000);
    }

    getPostIdFromUrl(url: string): string {
        return url.split('/').pop() || '';
    }
    async getCurrentPostId(page: Page): Promise<string> {
        const currentUrl = page.url();
        return this.getPostIdFromUrl(currentUrl);
    }

    getSuggestedPostElements(postElement: Locator) {
        return { //To update locator
            boardName: postElement.locator('.text-xxs, .text-xs').first(),
            postTitle: postElement.locator('h3, a.min-w-0 h1, .line-clamp-1:not([data-testid="dropdown-menu-trigger"])').first(),
            writerNickname: postElement.locator('[data-testid="dropdown-menu-trigger"]').first(),
            creationTime: postElement.getByRole('button', { name: 'Toggle date format' }).first(),
            viewCount: postElement.locator('span.text-neutral-300'),

            commentCount: postElement.locator('span.text-primary, span.text-red-500').first(),
            imageIcon: postElement.locator('svg.tabler-icon-image, img[src*="image"]').first()
        };
    }

    async verifySuggestedPostContainer() {
        const currentCount = await this.postItem.count();

        for (let i = 0; i < currentCount; i++) {
            const currentPost = this.postItem.nth(i);
            const elements = this.getSuggestedPostElements(currentPost);

            await expect(elements.boardName).not.toBeEmpty();
            await expect(elements.postTitle).not.toBeEmpty();
            await expect(elements.writerNickname).not.toBeEmpty();
            await expect(elements.creationTime).not.toBeEmpty();
            await expect(elements.viewCount).not.toBeEmpty();

            const hasComment = await elements.commentCount.isVisible();
            const hasImageIcon = await elements.imageIcon.isVisible();
            console.log(`Post [${i + 1}] -> Has Comment: ${hasComment}, Has Image Icon: ${hasImageIcon}`);
        }
    }

    async verifyOtherPostWriter() {
        const author = await this.postAuthor.textContent();
        const currentCount = await this.postItem.count();

        for (let i = 0; i < currentCount; i++) {
            const currentPost = this.postItem.nth(i);
            const elements = this.getSuggestedPostElements(currentPost);
            const currentWriter = await elements.writerNickname.textContent();
            expect(currentWriter?.trim()).toBe(author?.trim());
        }
    }
}