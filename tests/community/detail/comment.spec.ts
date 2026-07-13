import { test, expect } from '../../../utils/fixtures';
import { LoginPage } from '../../../pages/LoginPage';
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
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Check the display of comment in normal user view', async () => {
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

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Check the display of comment in admin view', async () => {
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