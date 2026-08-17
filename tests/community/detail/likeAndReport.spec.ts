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

test.describe('Non-verified User Flow', () => {
    test.use({ storageState: 'playwright/.auth/non-verified-user.json' });

    test('[Community] Non-verified user cannot report a post', async ({ page }) => { 
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);

        await detailFreePage.reportBtn.click();
        await expect.soft(detailFreePage.noticeDialog).toContainText(
            "신고 기능은 본인 인증을 해야만 이용 가능합니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await detailFreePage.dialogCancelBtn.click();
        await expect(detailFreePage.noticeDialog).toBeHidden();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.reportBtn.click();
        await detailFreePage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Normal user can like and report a post only 1 time', async ({ page, request, apiBaseURL }) => {
        let sharedPostUrl = '';
        let sharedPostId = '';
        let dynamicToken = '';

        await test.step('Create a brand new post', async () => {
            const loginResponse = await request.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userD.email,
                    password: loginData.userD.password,
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

        await test.step('Normal user can like a post only 1 time', async () => {
            await detailFreePage.navigate(sharedPostUrl);
            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.likeMsg.success);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');

            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("error", freePostData.likeMsg.duplicateLike);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');
        });

        await test.step('Normal user can report a post only 1 time', async () => {
            await detailFreePage.navigate(sharedPostUrl);
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

        await test.step('Clean up: delete post via API', async () => {
            await detailFreePage.deletePostViaAPI(request, apiBaseURL, sharedPostId, 'free');
        });
    });

    test('[Community] Normal user cannot like my own post, [Report] button is hidden in my own post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPost);
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