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

    test('[Community] Guest cannot comment in post', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.cmtInput.first().scrollIntoViewIfNeeded();
        await detailFreePage.cmtInput.first().click();
        await expect(detailFreePage.moveLogin).toBeVisible();

        await detailFreePage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.cmtInput.first().click();
        await detailFreePage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(/.*\/login/);
        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL(freePostData.postUrl.normalPost, { timeout: 10000 });
    });
});

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] Prisoner cannot comment on a Free post', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.writeCmt(`${Date.now()}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.prisoner);
    })
});

test.describe('Non-verified User Flow', () => {
    test.use({ storageState: 'playwright/.auth/non-verified-user.json' });

    test('[Community] Non-verified user cannot comment on a Free post', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.writeCmt(`${Date.now()}`);
        await expect(detailFreePage.noticeDialog).toContainText(
            "댓글은 본인 인증을 해야만 쓰실 수 있습니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await detailFreePage.dialogCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.writeCmt(`${Date.now()}`);
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

    test('[Community] Normal user can write a comment successfully', async ({ page, apiBaseURL, playwright, request }) => {
        const apiContext = await playwright.request.newContext();
        const loginResponse = await apiContext.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.valid.email,
                password: loginData.valid.password,
            }
        });
        const loginJson = await loginResponse.json();
        const dynamicToken = loginJson.session_id;

        const createPostResponse = await apiContext.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Post for UI Comment Test ${Date.now()}`,
                content: '<p>Bài viết sạch dùng để test viết comment...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        const postId = postJson.wr_id
        const newPostUrl = `/community/free/${postId}`;

        await detailFreePage.navigate(newPostUrl);
        await expect(detailFreePage.noCommentTxt).toBeVisible();
        await expect(detailFreePage.cmtCount).toHaveText("0");

        const myCommentText = `Auto comment at ${Date.now()}`;
        await detailFreePage.cmtInput.first().fill(myCommentText);
        await detailFreePage.submitCmtBtn.click();

        await detailFreePage.verifyToastMsg("success", freePostData.cmtMsg.success);
        await expect(detailFreePage.cmtItems.first()).toContainText(myCommentText);
        await expect(detailFreePage.noCommentTxt).toBeHidden();
        await expect(detailFreePage.cmtCount).toHaveText("1");

        await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId, 'free');
    });

    for (const data of freePostData.invalidCmt) {
        test(`[Community] User cannot submit a comment that ${data.name}`, async () => {
            await detailFreePage.navigate(freePostData.postUrl.normalPost);
            await detailFreePage.writeCmt(data.content);
            await detailFreePage.verifyToastMsg("error", data.errorMsg)
        });
    }

    test('[Community] User cannot comment in a post whose author has blocked the user', async () => {
        await detailFreePage.navigate(freePostData.postUrl.blockedPost);
        await detailFreePage.writeCmt(`${Date.now()}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.block)
    });
})