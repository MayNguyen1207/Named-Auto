import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import loginData from '../data-test/login-data.json';

export class DetailFreePage extends BasePage {
    readonly page: Page;
    readonly editPostBtn: Locator;
    readonly movePostBtn: Locator;
    readonly deletePostBtn: Locator;

    readonly postAuthor: Locator;
    readonly postCreationTime: Locator;
    readonly editNumTxt: Locator;

    readonly emailInfo: Locator;
    readonly postIPInfo: Locator;
    readonly adminRead: Locator;

    readonly postTitle: Locator;
    readonly postContent: Locator;
    readonly emojiImg: Locator;
    readonly postContentImg: Locator;
    readonly postVideoIframe: Locator;
    readonly postContentVideo: Locator;

    readonly likeBtn: Locator;
    readonly reportBtn: Locator;

    readonly cmtInput: Locator;
    readonly submitCmtBtn: Locator;
    readonly cmtCount: Locator;
    readonly noCommentTxt: Locator;
    readonly cmtList: Locator;
    readonly cmtItems: Locator;
    readonly replyCmtInput: Locator;

    // Author picker
    readonly cmtAuthorPicker: Locator;
    readonly authorCommandRoot: Locator;
    readonly authorFirstItem: Locator;

    readonly suggestedPostTab: Locator;
    readonly postContainer: Locator;
    readonly postItem: Locator;
    readonly noSuggestedPostTxt: Locator;
    readonly sugPagiantion: Locator;
    readonly sugPrevBtn: Locator;
    readonly sugNextBtn: Locator;
    readonly otherPostContainer: Locator;
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

    readonly bestBtn: Locator;
    readonly suggestBtn: Locator;
    readonly readBtn: Locator;
    readonly listPost: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.editPostBtn = page.getByLabel('수정', { exact: true });
        this.movePostBtn = page.getByTestId('community-post-move-button');
        this.deletePostBtn = page.getByTestId('community-post-delete-button');

        this.postAuthor = page.locator('article').getByTestId('user-info-context-menu-nickname').first();
        this.postCreationTime = page.getByRole('button', { name: 'Toggle date format' }).first();
        this.editNumTxt = page.locator('span[data-testid="tooltip-trigger"]').filter({ hasText: '수정' }).first();

        this.emailInfo = page.getByTestId('community-admin-info-email-button');
        this.postIPInfo = page.getByTestId('community-admin-info-ip-button');
        this.adminRead = page.getByTestId('community-admin-info-manager-read-button');

        this.postTitle = page.locator('h1:visible');
        this.postContent = page.getByLabel('게시글 내용');
        this.emojiImg = page.locator('.postContent img[src*="/editor/smileys/28.png"]');
        this.postContentImg = page.locator('.postContent img')
        this.postVideoIframe = page.locator("//figure[@class='media']//iframe");
        this.postContentVideo = page.locator('.postContent video');

        this.likeBtn = page.getByTestId('community-post-recommend-button');
        this.reportBtn = page.getByTestId('community-post-report-button');

        this.cmtInput = page.locator('[id="comment-textarea"]');
        this.submitCmtBtn = page.getByRole('button', { name: '댓글 전송' });
        this.cmtCount = page.getByTestId('community-comment-count');
        this.noCommentTxt = page.getByText('댓글이 없습니다.', { exact: true });
        this.cmtList = page.getByTestId('community-comment-list');
        this.cmtItems = page.getByTestId('community-comment-item');
        this.replyCmtInput = page.getByRole('textbox', { name: '답글을 입력하세요…' });

        this.cmtAuthorPicker = page.getByTestId('community-comment-author-selection')
        this.authorCommandRoot = page.locator('[data-testid="command-root"]');
        this.authorFirstItem = this.authorCommandRoot.locator('[data-testid="command-item"]').first();

        this.suggestedPostTab = page.getByRole('tab', { name: '추천 게시물' });
        this.postContainer = page.getByTestId('community-related-posts-list');
        this.postItem = this.postContainer.locator('> div');
        this.noSuggestedPostTxt = page.getByText('추천 게시물이 없습니다.', { exact: true });
        this.sugPagiantion = page.getByTestId('community-related-posts-pagination');
        this.sugPrevBtn = this.sugPagiantion.locator('button').first();
        this.sugNextBtn = this.sugPagiantion.locator('button').last();
        this.otherPostContainer = page.getByTestId('community-related-posts-author-list');
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

        this.bestBtn = page.getByTestId('community-admin-post-action-best-button')
        this.suggestBtn = page.getByTestId('community-admin-post-action-cast-button')
        this.readBtn = page.getByTestId('community-admin-post-action-read-button')
        this.listPost = page.locator('div.w-full.mx-auto');
    }

    async navigate(url: string) {
        await this.page.goto(url);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => {});
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async writeCmt(content: string) {
        await this.cmtInput.first().fill(content);
        await this.submitCmtBtn.first().click();
    }

    getPostIdFromUrl(url: string): string {
        return url.split('/').pop() || '';
    }
    async getCurrentPostId(page: Page): Promise<string> {
        const currentUrl = page.url();
        return this.getPostIdFromUrl(currentUrl);
    }

    getCmtElements(index: number) {
        const cmtItem = this.cmtItems.nth(index);
        return {
            item: cmtItem,
            commentWriter: cmtItem.getByTestId('user-info-context-menu-nickname'),
            authorLabel: cmtItem.getByText('작성자', { exact: true }),
            myCmtLabel: cmtItem.getByText('내 댓글', { exact: true }),
            editLabel: cmtItem.getByText('수정됨', { exact: true }),
            replyBtn: cmtItem.getByText('답글', { exact: true }),
            reportCmtBtn: cmtItem.getByText('신고', { exact: true }),
            editCmtBtn: cmtItem.getByText('수정', { exact: true }),
            deleteCmtBtn: cmtItem.getByText('삭제', { exact: true }),
            ipInfo: cmtItem.getByTestId('community-comment-item-ip'),
            cmtText: cmtItem.getByTestId('community-comment-item-content')
        };
    }

    getCmtElementByText(text: string) {
        const cmtItem = this.cmtItems.filter({ hasText: text }).last();
        return {
            item: cmtItem,
            commentWriter: cmtItem.getByTestId('user-info-context-menu-nickname'),
            authorLabel: cmtItem.getByText('작성자', { exact: true }),
            myCmtLabel: cmtItem.getByText('내 댓글', { exact: true }),
            editLabel: cmtItem.getByText('수정됨', { exact: true }),
            replyBtn: cmtItem.getByText('답글', { exact: true }),
            reportCmtBtn: cmtItem.getByText('신고', { exact: true }),
            editCmtBtn: cmtItem.getByText('수정', { exact: true }),
            deleteCmtBtn: cmtItem.getByText('삭제', { exact: true }),
            ipInfo: cmtItem.getByTestId('community-comment-item-ip'),
            cmtText: cmtItem.getByTestId('community-comment-item-content')
        };
    }

    getLastCmtElement() {
        const cmtItem = this.cmtItems.last();
        return {
            item: cmtItem,
            commentWriter: cmtItem.getByTestId('user-info-context-menu-nickname'),
            authorLabel: cmtItem.getByText('작성자', { exact: true }),
            myCmtLabel: cmtItem.getByText('내 댓글', { exact: true }),
            editLabel: cmtItem.getByText('수정됨', { exact: true }),
            replyBtn: cmtItem.getByText('답글', { exact: true }),
            reportCmtBtn: cmtItem.getByText('신고', { exact: true }),
            editCmtBtn: cmtItem.getByText('수정', { exact: true }),
            deleteCmtBtn: cmtItem.getByText('삭제', { exact: true }),
            ipInfo: cmtItem.getByTestId('community-comment-item-ip'),
            cmtText: cmtItem.getByTestId('community-comment-item-content')
        };
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
        return {
            boardName: postElement.getByTestId('community-related-posts-item-category'),
            postTitle: postElement.getByTestId('community-related-posts-item-link'),
            writerNickname: postElement.getByTestId('user-info-context-menu-trigger'),
            creationTime: postElement.getByRole('button', { name: 'Toggle date format' }).first(),
            viewCount: postElement.getByTestId('community-related-posts-item-view-count'),

            commentCount: postElement.getByTestId('community-related-posts-item-comment-count'),
            imageIcon: postElement.locator('img[src="/images/home/image.svg"]')
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

    async selectFirstCmtAuthor(): Promise<string> {
        await this.cmtAuthorPicker.first().click();
        await expect(this.authorCommandRoot).toBeVisible();
        await this.page.waitForTimeout(1000);
        const firstItem = this.authorFirstItem;
        const fullText = (await firstItem.textContent())?.trim() ?? '';
        const authorName = fullText.split('(')[0].trim();
        await firstItem.click({ force: true });
        return authorName;
    }

    // Delete post via API
    async deletePostViaAPI(request: import('@playwright/test').APIRequestContext, apiBaseURL: string, postId: string, boardType: string) {
        const fs = require('fs');
        const adminStorageState = JSON.parse(fs.readFileSync('playwright/.auth/admin.json', 'utf8'));
        const sessionCookie = adminStorageState.cookies.find((c: any) => c.name.includes('session_id'));
        const adminToken = sessionCookie?.value;

        const deleteRes = await request.delete(`${apiBaseURL}/community/board/${postId}/`, {
            headers: { 'NAMED-SESSION': `${adminToken}` },
            form: {
                wr_id: postId,
                board_type: boardType,
            }
        });
        expect(deleteRes.ok()).toBeTruthy();
    }
}