import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import loginData from '../../../data-test/login-data.json';
import freePostData from '../../../data-test/free-post-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Move to Login popup should be shown when guest likes the post', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.likeBtn.scrollIntoViewIfNeeded();
        await expect(detailFreePage.likeBtn).toHaveText(/\d+/);
        await detailFreePage.likeBtn.click();
        await expect(detailFreePage.moveLogin).toBeVisible();
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test.describe('Tests that need a brand new post', () => {
        let sharedPostUrl = '';
        let sharedPostId = '';
        let dynamicToken = '';

        test.beforeAll(async ({ apiBaseURL, request }) => {
            const loginResponse = await request.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userB.email,
                    password: loginData.userB.password,
                }
            });
            expect(loginResponse.ok()).toBeTruthy();

            const loginJson = await loginResponse.json();
            dynamicToken = loginJson.session_id;

            const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
                headers: { 'NAMED-SESSION': `${dynamicToken}`, },
                form: {
                    board_type: 'free',
                    subject: `Auto Test Shared Post ${Date.now()}`,
                    content: '<p>Bài viết dùng chung để test Like, Report...</p>',
                    is_notice: 'false',
                    comment_allowed: 'true'
                }
            });
            expect(createPostResponse.ok()).toBeTruthy();
            const postJson = await createPostResponse.json();
            sharedPostId = postJson.wr_id;
            sharedPostUrl = `/community/free/${sharedPostId}`;
        });

        test('[Community] Normal user can like a post only 1 time', async ({ page }) => {
            await detailFreePage.navigate(sharedPostUrl);
            await page.waitForTimeout(500);
            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.likeMsg.success);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');

            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("error", freePostData.likeMsg.duplicateLike);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');
        });

        test('[Community] Normal user can report another user\'s post only 1 time', async ({ page }) => {
            await detailFreePage.navigate(sharedPostUrl);
            await page.waitForTimeout(500);
            await detailFreePage.reportBtn.click();
            await detailFreePage.verifyReportPopupOptions();
            await expect(detailFreePage.reportTextArea).toBeHidden();
            const reasonText = '이 게시물은 커뮤니티 규정을 위반합니다.';
            await detailFreePage.selectReportOptionAndFillReason('기타 부정행위', reasonText);
            await detailFreePage.popupReportBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.reportMsg.success);
            await page.waitForTimeout(500);

            await detailFreePage.reportBtn.click();
            await detailFreePage.selectReportOptionAndFillReason('비매너');
            await detailFreePage.popupReportBtn.click();
            await detailFreePage.verifyToastMsg("error", freePostData.reportMsg.duplicateReport);
        });
    });

    test('[Community] Normal user cannot like my own post, [Report] button is hidden in my own post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPost);
        await page.waitForTimeout(500);
        const likeNumber = await detailFreePage.likeBtn.locator('span').textContent() ?? '';
        await detailFreePage.likeBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.likeMsg.likeMyOwnPost);
        await expect(detailFreePage.likeBtn.locator('span')).toHaveText(likeNumber);
        await expect(detailFreePage.reportBtn).toBeHidden();
    });

    test('[Community] Report button is hidden in Notice post', async () => {
        await detailFreePage.navigate(freePostData.postUrl.noticePost);
        await expect(detailFreePage.reportBtn).toBeHidden();
    })
})