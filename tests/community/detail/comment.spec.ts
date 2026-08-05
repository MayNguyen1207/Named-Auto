import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
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
            { index: 3, showAuthor: false, showReport: true },  // Comment assigned auhtor
            { index: 4, showAuthor: false, showReport: true },  // Comment assigned auhtor
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await expect(cmt.editCmtBtn).toBeHidden();
            await expect(cmt.deleteCmtBtn).toBeHidden();
            await expect(cmt.ipInfo).toBeHidden();
        }
    });

    test('[Community] Edit Label should be shown for comment that has been edited', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);
        const thirdCmt = detailFreePage.getCmtElements(2);
        await expect(thirdCmt.editLabel).toBeVisible();
        await thirdCmt.editLabel.hover();
        await expect(detailFreePage.hoverTooltip).toContainText(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}/);
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
            { index: 3, showAuthor: false, showMyCmt: false, showReport: true, showAction: false },  // Comment assigned auhtor
            { index: 4, showAuthor: false, showMyCmt: false, showReport: true, showAction: false },  // Comment assigned auhtor
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await (data.showMyCmt ? expect(cmt.myCmtLabel).toBeVisible() : expect(cmt.myCmtLabel).toBeHidden());
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await (data.showAction ? expect(cmt.editCmtBtn).toBeVisible() : expect(cmt.editCmtBtn).toBeHidden());
            await (data.showAction ? expect(cmt.deleteCmtBtn).toBeVisible() : expect(cmt.deleteCmtBtn).toBeHidden());
            await expect(cmt.ipInfo).toBeHidden();
        }
    })
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('[Community] Check the display of comment in admin view', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const cmtData = [
            { index: 0, showAuthor: true, showMyCmt: false, showReport: true },    // Author
            { index: 1, showAuthor: false, showMyCmt: false, showReport: true },   // Normal User
            { index: 2, showAuthor: false, showMyCmt: false, showReport: false },  // Other Admin
            { index: 3, showAuthor: false, showMyCmt: false, showReport: false },  // Other admin assigned auhtor
            { index: 4, showAuthor: false, showMyCmt: true, showReport: false },  // My comment but assigned auhtor
        ];

        for (const data of cmtData) {
            const cmt = detailFreePage.getCmtElements(data.index);
            await (data.showAuthor ? expect(cmt.authorLabel).toBeVisible() : expect(cmt.authorLabel).toBeHidden());
            await (data.showMyCmt ? expect(cmt.myCmtLabel).toBeVisible() : expect(cmt.myCmtLabel).toBeHidden());
            await expect(cmt.replyBtn).toBeVisible();
            await (data.showReport ? expect(cmt.reportCmtBtn).toBeVisible() : expect(cmt.reportCmtBtn).toBeHidden());
            await expect(cmt.editCmtBtn).toBeVisible();
            await expect(cmt.deleteCmtBtn).toBeVisible();
            await expect(cmt.ipInfo).toBeVisible();
        }
    })
});

test.describe('Verify Comment', () => {
    let detailFreePage: DetailFreePage;
    let sharedPostId: string;
    let sharedPostUrl: string;
    const totalCommentsToCreate = 88;

    test.beforeAll(async ({ request, apiBaseURL }) => {
        test.setTimeout(120000);
        const fs = require('fs');
        const adminStorageState = JSON.parse(fs.readFileSync('playwright/.auth/admin.json', 'utf8'));
        const sessionCookie = adminStorageState.cookies.find((c: any) => c.name.includes('session_id'));
        const adminToken = sessionCookie?.value;

        const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': adminToken },
            form: {
                board_type: 'free',
                subject: `Auto Test Comment Shared ${Date.now()}`,
                content: '<p>Bài viết dùng để test comment...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        sharedPostId = postJson.wr_id;
        sharedPostUrl = `/community/free/${sharedPostId}`;

        for (let i = 1; i <= totalCommentsToCreate; i++) {
            await request.post(`${apiBaseURL}/community/board/${sharedPostId}/comment`, {
                headers: { 'NAMED-SESSION': adminToken },
                form: {
                    wr_id: sharedPostId,
                    board_type: 'free',
                    content: `Auto comment number ${i}`,
                    comment_type: 'new'
                }
            });
        }
    });

    test.afterAll(async ({ request, apiBaseURL }) => {
        if (sharedPostId) {
            const fs = require('fs');
            const adminStorageState = JSON.parse(fs.readFileSync('playwright/.auth/admin.json', 'utf8'));
            const sessionCookie = adminStorageState.cookies.find((c: any) => c.name.includes('session_id'));
            const adminToken = sessionCookie?.value;

            await request.delete(`${apiBaseURL}/community/board/${sharedPostId}/`, {
                headers: { 'NAMED-SESSION': adminToken },
                form: {
                    wr_id: sharedPostId,
                    board_type: 'free',
                }
            });
        }
    });

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(sharedPostUrl);
    });

    test('[Community] Verify comment chronological order (Oldest first, Newest last)', async () => {
        await test.step('Verify the last comment', async () => {
            const lastCommentOnDefaultPage = detailFreePage.cmtItems.last();
            await expect(lastCommentOnDefaultPage).toContainText(`Auto comment number ${totalCommentsToCreate}`);
        });

        await test.step('Verify the first comment', async () => {
            await detailFreePage.clickPageNumber(1);
            const firstCommentOnFirstPage = detailFreePage.cmtItems.first();
            await expect(firstCommentOnFirstPage).toContainText('Auto comment number 1');
        });
    });

    test('[Community] Verify comment pagination', async ({ page }) => {
        await test.step('Verify default page is the last page', async () => {
            await detailFreePage.pagInput.scrollIntoViewIfNeeded();
            await expect(detailFreePage.getPageItem(9)).toHaveAttribute('aria-current', 'page');
        });

        await test.step('Verify pagination options list', async () => {
            await detailFreePage.verifyListItemsNumber();
            await page.keyboard.press('Escape');
        });

        await test.step('Verify default pagination option', async () => {
            await detailFreePage.clickPageNumber(1);
            await expect(detailFreePage.cmtItems).toHaveCount(10);
        });

        await test.step('Verify pagination option selection', async () => {
            await detailFreePage.verifySelectedOption(20);
            await detailFreePage.clickPageNumber(1);
            await expect(detailFreePage.cmtItems).toHaveCount(20);
        });

        await test.step('Verify pagination input field', async () => {
            await detailFreePage.pagInput.fill('');
            await detailFreePage.pagInput.focus();
            await page.keyboard.type('abc');
            await expect(detailFreePage.pagInput).toBeEmpty();

            await detailFreePage.goToPageViaInput('3', 3);
            await detailFreePage.goToPageViaInput('0', 1);
            await detailFreePage.goToPageViaInput('99', 5);
        });

        await test.step('Verify Next and Previous buttons', async () => {
            await detailFreePage.pagPreviousBtn.click();
            await page.waitForTimeout(500);
            await expect(detailFreePage.getPageItem(4)).toHaveAttribute('aria-current', 'page');

            await detailFreePage.pagNextBtn.click();
            await page.waitForTimeout(500);
            await expect(detailFreePage.getPageItem(5)).toHaveAttribute('aria-current', 'page');
        });
    });
})