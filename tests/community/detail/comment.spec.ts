import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import loginData from '../../../data-test/login-data.json';
import freePostData from '../../../data-test/free-post-data.json';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

test.describe('Guest Flow', () => {

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Reply and Report Cmt button should be shown in guest view', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const cmtData = [
            { index: 0, showAuthor: true, showReport: true },   // Author
            { index: 1, showAuthor: false, showReport: true },  // Normal user
            { index: 2, showAuthor: false, showReport: false }, // Admin
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await expect(cmt.editCmtBtn).toBeHidden();
            await expect(cmt.deleteCmtBtn).toBeHidden();
        }
    });

    test('[Community] Edit Label should be shown for comment that has been edited', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);
        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.editLabel).toBeVisible();
        await secondCmt.editLabel.hover();
        await expect(detailFreePage.hoverTooltip).toContainText(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}/);
    });

    test('[Community] Verify comment chronological order (Oldest first, Newest last)', async ({ page, apiBaseURL, request }) => {
        const loginResponse = await request.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.userC.email,
                password: loginData.userC.password,
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const loginJson = await loginResponse.json();
        const dynamicToken = loginJson.session_id;

        const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Auto Test Comment chronological order ${Date.now()}`,
                content: '<p>Bài viết dùng để test thứ tự hiển thị comment...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        const postId = postJson.wr_id;
        const postUrl = `/community/free/${postId}`;

        const totalCommentsToCreate = 25;
        for (let i = 1; i <= totalCommentsToCreate; i++) {
            await request.post(`${apiBaseURL}/community/board/${postId}/comment`, {
                headers: { 'NAMED-SESSION': `${dynamicToken}` },
                form: {
                    wr_id: postId,
                    board_type: 'free',
                    content: `Auto comment number ${i}`,
                    comment_type: 'new'
                }
            });
        }

        await detailFreePage.navigate(postUrl);
        await page.waitForTimeout(500);

        const lastCommentOnDefaultPage = detailFreePage.cmtItems.last();
        await expect(lastCommentOnDefaultPage).toContainText(`Auto comment number ${totalCommentsToCreate}`);

        await detailFreePage.clickPageNumber(1);
        await page.waitForTimeout(500);
        const firstCommentOnFirstPage = detailFreePage.cmtItems.first();
        await expect(firstCommentOnFirstPage).toContainText('Auto comment number 1');

        await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId);
    });

    test('[Community] Verify comment pagination', async ({ page, apiBaseURL, request }) => {
        test.setTimeout(45000);
        const loginResponse = await request.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.userD.email,
                password: loginData.userD.password,
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const loginJson = await loginResponse.json();
        const dynamicToken = loginJson.session_id;

        const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Auto Test Comment Pagination ${Date.now()}`,
                content: '<p>Bài viết dùng để test comment pagination...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        const postId = postJson.wr_id;
        const postUrl = `/community/free/${postId}`;

        const totalCommentsToCreate = 88;
        for (let i = 1; i <= totalCommentsToCreate; i++) {
            await request.post(`${apiBaseURL}/community/board/${postId}/comment`, {
                headers: { 'NAMED-SESSION': `${dynamicToken}` },
                form: {
                    wr_id: postId,
                    board_type: 'free',
                    content: `Auto comment number ${i}`,
                    comment_type: 'new'
                }
            });
        }

        await detailFreePage.navigate(postUrl);
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');

        await detailFreePage.pagInput.scrollIntoViewIfNeeded();
        await expect(detailFreePage.getPageItem(9)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.verifyListItemsNumber();
        await page.keyboard.press('Escape');

        await detailFreePage.clickPageNumber(1);
        await expect(detailFreePage.cmtItems).toHaveCount(10);
        await detailFreePage.verifySelectedOption(20);
        await detailFreePage.clickPageNumber(1);
        await page.waitForTimeout(500);
        await expect(detailFreePage.cmtItems).toHaveCount(20);

        await detailFreePage.pagInput.fill('');
        await detailFreePage.pagInput.focus();
        await page.keyboard.type('abc');
        await expect(detailFreePage.pagInput).toBeEmpty();

        await detailFreePage.goToPageViaInput('3');
        await page.waitForTimeout(500);
        await expect(detailFreePage.getPageItem(3)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.goToPageViaInput('0');
        await page.waitForTimeout(500);
        await expect(detailFreePage.getPageItem(1)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.goToPageViaInput('99');
        await page.waitForTimeout(500);
        await expect(detailFreePage.getPageItem(5)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.pagPreviousBtn.click();
        await page.waitForTimeout(500);
        await expect(detailFreePage.getPageItem(4)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.pagNextBtn.click();
        await page.waitForTimeout(500);
        await expect(detailFreePage.getPageItem(5)).toHaveAttribute('aria-current', 'page');

        await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('[Community] Check the display of comment in normal user view', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const cmtData = [
            { index: 0, showAuthor: true, showMyCmt: false, showReport: true, showAction: false }, // Author
            { index: 1, showAuthor: false, showMyCmt: true, showReport: false, showAction: true }, // My comment
            { index: 2, showAuthor: false, showMyCmt: false, showReport: false, showAction: false }, // Admin
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await (data.showMyCmt ? expect(cmt.myCmtLabel).toBeVisible() : expect(cmt.myCmtLabel).toBeHidden());
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await (data.showAction ? expect(cmt.editCmtBtn).toBeVisible() : expect(cmt.editCmtBtn).toBeHidden());
            await (data.showAction ? expect(cmt.deleteCmtBtn).toBeVisible() : expect(cmt.deleteCmtBtn).toBeHidden());
        }
    })
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('[Community] Check the display of comment in admin view', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const cmtData = [
            { index: 0, showAuthor: true, showReport: true },    // Author
            { index: 1, showAuthor: false, showReport: true },   // Normal User
            { index: 2, showAuthor: false, showReport: false },  // Other Admin
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await expect(cmt.myCmtLabel).toBeHidden();
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await expect(cmt.editCmtBtn).toBeVisible();
            await expect(cmt.deleteCmtBtn).toBeVisible();
        }
    })
})