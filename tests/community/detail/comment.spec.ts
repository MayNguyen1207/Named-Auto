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

        const firstCmt = detailFreePage.getCmtElements(0);
        await expect(firstCmt.authorLabel).toBeVisible();
        await expect(firstCmt.replyBtn).toBeVisible();
        await expect(firstCmt.reportBtn).toBeVisible();
        await expect(firstCmt.editBtn).toBeHidden();
        await expect(firstCmt.deleteBtn).toBeHidden();

        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.authorLabel).toBeHidden();
        await expect(secondCmt.replyBtn).toBeVisible();
        await expect(secondCmt.reportBtn).toBeVisible();
        await expect(secondCmt.editBtn).toBeHidden();
        await expect(secondCmt.deleteBtn).toBeHidden();

        const thirdCmt = detailFreePage.getCmtElements(2);
        await expect(thirdCmt.authorLabel).toBeHidden();
        await expect(thirdCmt.replyBtn).toBeVisible();
        await expect(thirdCmt.reportBtn).toBeHidden();
        await expect(thirdCmt.editBtn).toBeHidden();
        await expect(thirdCmt.deleteBtn).toBeHidden();
    });

    test('[Community] Edit Label should be shown for comment that has been edited', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);
        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.editLabel).toBeVisible();
        await secondCmt.editLabel.hover();
        await expect(detailFreePage.hoverTooltip).toContainText('2026.07.07 18:57:23');
    });

    test('[Community] Guest cannot comment in post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.cmtInput.scrollIntoViewIfNeeded();
        await detailFreePage.cmtInput.click();
        await expect(detailFreePage.moveLogin).toBeVisible();

        await detailFreePage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.cmtInput.click();
        await detailFreePage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(/.*\/login/);
        const loginPage = new LoginPage(page);
        await page.waitForTimeout(500);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);
    });

    test('[Community] Verify comment chronological order and pagination (Oldest first, Newest last)', async ({ page, apiBaseURL, request }) => {
        let postUrl = '';
        let postId = '';
        let dynamicToken = '';

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
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Auto Test Comment Pagination ${Date.now()}`,
                content: '<p>Bài viết dùng để test Comment Pagination...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        postId = postJson.wr_id;
        postUrl = `/community/free/${postId}`;

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

        await detailFreePage.cmtFirstPageBtn.click();
        await page.waitForTimeout(500);
        const firstCommentOnFirstPage = detailFreePage.cmtItems.first();
        await expect(firstCommentOnFirstPage).toContainText('Auto comment number 1');
    });
});

test.describe('Prisoner Flow', () => {
    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await page.waitForTimeout(500);
        await loginPage.login(loginData.prisoner.email, loginData.prisoner.password);
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Prisoner cannot comment on a Free post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.writeCmt(`${Date.now()}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.prisoner);
    })
});

test.describe('Non-verified User Flow', () => {
    test('[Community] Non-verified user cannot comment on a Free post', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await page.waitForTimeout(500);
        await loginPage.login(loginData.nonverifiedUser.email, loginData.nonverifiedUser.password);

        let detailFreePage: DetailFreePage;
        detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await page.waitForTimeout(1000);
        await detailFreePage.writeCmt(`${Date.now}`);
        await expect(detailFreePage.noticeDialog).toContainText(
            "댓글은 본인 인증을 해야만 쓰실 수 있습니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await detailFreePage.noticeDialogCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.writeCmt(`${Date.now}`);
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

    test('[Community] Normal user can write a comment successfully', async ({ page, apiBaseURL, playwright }) => {
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
        const newPostUrl = `/community/free/${postJson.wr_id}`;

        await detailFreePage.navigate(newPostUrl);
        await page.waitForTimeout(500);
        await expect(detailFreePage.noCommentTxt).toBeVisible();
        await expect(detailFreePage.cmtCount).toHaveText("0");

        const myCommentText = `Auto comment at ${Date.now()}`;
        await detailFreePage.cmtInput.fill(myCommentText);
        await detailFreePage.submitCmtBtn.click();

        await detailFreePage.verifyToastMsg("success", freePostData.cmtMsg.success);
        await expect(detailFreePage.cmtItems.first()).toContainText(myCommentText);
        await expect(detailFreePage.noCommentTxt).toBeHidden();
        await expect(detailFreePage.cmtCount).toHaveText("1");
    });

    for (const data of freePostData.invalidCmt) {
        test(`[Community] ${data.name}`, async () => {
            await detailFreePage.navigate(freePostData.postUrl.normalPost);
            await detailFreePage.writeCmt(data.content);
            await detailFreePage.verifyToastMsg("error", data.errorMsg)
        });
    }

    test('[Community] User cannot comment in a post whose author has blocked the user', async () => {
        await detailFreePage.navigate(freePostData.postUrl.blockedPost);
        await detailFreePage.writeCmt(`${Date.now}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.block)
    });

    test('[Community] Check the display of comment in normal user view', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const firstCmt = detailFreePage.getCmtElements(0);
        await expect(firstCmt.authorLabel).toBeVisible();
        await expect(firstCmt.myCmtLabel).toBeHidden();
        await expect(firstCmt.replyBtn).toBeVisible();
        await expect(firstCmt.reportBtn).toBeVisible();
        await expect(firstCmt.editBtn).toBeHidden();
        await expect(firstCmt.deleteBtn).toBeHidden();

        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.authorLabel).toBeHidden();
        await expect(secondCmt.myCmtLabel).toBeVisible();
        await expect(secondCmt.replyBtn).toBeVisible();
        await expect(secondCmt.reportBtn).toBeHidden();
        await expect(secondCmt.editBtn).toBeVisible();
        await expect(secondCmt.deleteBtn).toBeVisible();

        const thirdCmt = detailFreePage.getCmtElements(2);
        await expect(thirdCmt.authorLabel).toBeHidden();
        await expect(thirdCmt.myCmtLabel).toBeHidden();
        await expect(thirdCmt.replyBtn).toBeVisible();
        await expect(thirdCmt.reportBtn).toBeHidden();
        await expect(thirdCmt.editBtn).toBeHidden();
        await expect(thirdCmt.deleteBtn).toBeHidden();
    })
})