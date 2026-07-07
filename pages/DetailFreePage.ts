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
    readonly reportBtn: Locator;
    readonly cmtInput: Locator;
    readonly submitCmtBtn: Locator;
    readonly assignCmtAuthor: Locator;
    readonly cmtCount: Locator;
    readonly noCommentTxt: Locator;
    readonly cmtItems: Locator;
    readonly cmtFirstPageBtn: Locator;

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

    // Report popup
    readonly reportPopup: Locator;
    readonly popupReportBtn: Locator;
    readonly popupCancelBtn: Locator;
    readonly popupRadioGroup: Locator;
    readonly popupReasonInput: Locator;

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
        this.reportBtn = page.getByRole('button', { name: '신고' });
        this.cmtInput = page.locator('[id="comment-textarea"]');
        this.submitCmtBtn = page.getByRole('button', { name: '댓글 전송' });
        this.assignCmtAuthor = page.getByTestId('popover-trigger').nth(3);
        this.cmtCount = page.locator('div.flex.items-center.gap-2.mx-4'); //Need to update
        this.noCommentTxt = page.getByText('댓글이 없습니다.', { exact: true });
        this.cmtItems = page.locator('li.relative.border-b.border-b-gray-100.py-4'); //Need to update
        this.cmtFirstPageBtn = page.locator('nav[role="navigation"]').first().locator('li[data-slot="pagination-item"]').filter({ hasText: /^1$/ });

        this.suggestedPostTab = page.getByRole('tab', { name: '추천 게시물' });
        this.postContainer = page.locator('div.space-y-0'); //Need to update
        this.postItem = this.postContainer.locator('> div');
        this.noSuggestedPostTxt = page.getByText('추천 게시물이 없습니다.', { exact: true });
        this.sugPagiantion = page.locator('div.flex.items-center.justify-center.gap-2.bg-white.p-4.rounded-b-large'); //Need to update
        this.sugPrevBtn = this.sugPagiantion.locator('button').first();
        this.sugNextBtn = this.sugPagiantion.locator('button').last();
        this.otherPostTab = page.getByRole('tab', { name: '글쓴이의 게시물 더보기' });
        this.noOtherPostTxt = page.getByText('글쓴이의 다른 게시물이 없습니다.', { exact: true });

        this.restrictedPostDialog = page.getByRole('dialog').filter({ hasText: '열람 제한 게시물 안내' });
        this.restrictedPostBackBtn = this.restrictedPostDialog.getByRole('button', { name: '이전 페이지' });
        this.restrictedPostViewBtn = this.restrictedPostDialog.getByRole('button', { name: '열람하기' });

        this.reportPopup = page.getByTestId('popover-content').filter({ hasText: '신고를 접수하시겠습니까?' });
        this.popupReportBtn = this.reportPopup.getByRole('button', { name: '신고' });
        this.popupCancelBtn = this.reportPopup.getByRole('button', { name: '취소' });
        this.popupRadioGroup = page.getByRole('radiogroup');
        this.popupReasonInput = page.getByPlaceholder('신고내용을 작성해주세요.');
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

    get reportRadioGroup() { return this.popupRadioGroup; }
    get reportTextArea() { return this.popupReasonInput; }

    getReportOption(optionText: string) {
        return this.reportRadioGroup.getByRole('radio', { name: optionText });
    }

    async verifyReportPopupOptions() {
        const expectedOptions = [
            '비매너',
            '멤버 낚시',
            '운영자, 싸이트 비방',
            '개인정보 노출',
            '개인, 불법적인 홍보행위',
            '기타 부정행위'
        ];
        for (const optionText of expectedOptions) {
            const option = this.getReportOption(optionText);
            await expect(option).toBeVisible();
        }
    }

    async selectReportOptionAndFillReason(optionText: string, detailReason?: string) {
        const option = this.getReportOption(optionText);
        await option.click();
        await expect(option).toHaveAttribute('aria-checked', 'true');

        if (detailReason) {
            await expect(this.reportTextArea).toBeVisible();
            await this.reportTextArea.fill(detailReason);
            await expect(this.reportTextArea).toHaveValue(detailReason);
        }
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

    getPostItemLink(postElement: Locator) {
        return postElement.locator('a').first();
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