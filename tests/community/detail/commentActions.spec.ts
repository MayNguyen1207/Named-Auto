import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import loginData from '../../../data-test/login-data.json';
import freePostData from '../../../data-test/free-post-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Guest cannot reply or report a comment', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.myPost);
        await page.waitForTimeout(500);

        const lastCmt = detailFreePage.getLastCmtElement();

        await lastCmt.replyBtn.click();
        await expect(detailFreePage.moveLogin).toBeVisible();
        await detailFreePage.moveLoginCancelBtn.click();

        await lastCmt.reportCmtBtn.click();
        await expect(detailFreePage.moveLogin).toBeVisible();
    });
});

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] Prisoner cannot edit a comment', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.prisonerPost);
        await page.waitForTimeout(500);

        const lastCmt = detailFreePage.getLastCmtElement();

        await lastCmt.editCmtBtn.click();
        await detailFreePage.submitCmtBtn.last().click();
        await detailFreePage.verifyToastMsg("error", freePostData.editCmtMsg.prisoner);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] User can report a comment only 1 time', async ({ page, apiBaseURL, playwright }) => {
        let loginResponse: any;
        let apiContext: any;
        let lastCmt: any;

        await test.step('Login via API to get session_id', async () => {
            apiContext = await playwright.request.newContext();
            loginResponse = await apiContext.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userD.email,
                    password: loginData.userD.password,
                }
            });
        });

        await test.step('Create a dummy comment', async () => {
            const loginJson = await loginResponse.json();
            const dynamicToken = loginJson.session_id;

            const postId = detailFreePage.getPostIdFromUrl(freePostData.postUrl.reportCmtPost);
            const createCmtResponse = await apiContext.post(`${apiBaseURL}/community/board/${postId}/comment`, {
                headers: { 'NAMED-SESSION': dynamicToken },
                form: {
                    wr_id: postId,
                    board_type: 'free',
                    content: `Auto test report comment ${Date.now()}`,
                    comment_type: 'new'
                }
            });
            expect(createCmtResponse.ok()).toBeTruthy();
        });

        await test.step('Go to the post', async () => {
            await detailFreePage.navigate(freePostData.postUrl.reportCmtPost);
            await page.waitForTimeout(500);
        });

        await test.step('Report comment for the first time', async () => {
            lastCmt = detailFreePage.getLastCmtElement();
            await lastCmt.reportCmtBtn.click();

            await detailFreePage.selectReportOptionAndFillReason('비매너');
            await detailFreePage.popupReportBtn.click();
            await detailFreePage.verifyToastMsg('success', freePostData.reportCmtMsg.success);
        });

        await test.step('Report comment for the second time', async () => {
            await lastCmt.reportCmtBtn.click();
            await detailFreePage.verifyToastMsg('error', freePostData.reportCmtMsg.duplicate);
        });
    });

    test('[Community] User can edit comment successfully', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPost);
        await page.waitForTimeout(500);

        const lastCmt = detailFreePage.getLastCmtElement();
        const cmtBefore = await detailFreePage.cmtText.last().textContent() as string;

        await lastCmt.editCmtBtn.click();
        await expect(detailFreePage.cmtInput.last()).toHaveText(cmtBefore);
        const cmtAfter = `${Date.now()}`;
        await detailFreePage.cmtInput.last().fill(cmtAfter);
        await detailFreePage.submitCmtBtn.last().click();
        await detailFreePage.verifyToastMsg("success", freePostData.editCmtMsg.success);
        await expect(detailFreePage.cmtText).toHaveText(cmtAfter);
    });

    test('[Community] User can delete a comment successfully', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.noticePost);
        await page.waitForTimeout(500);

        const cmtContent = "Comment to Delete";
        await detailFreePage.writeCmt(cmtContent);

        const lastCmt = detailFreePage.getCmtElementByText(cmtContent);

        await lastCmt.deleteCmtBtn.click();
        await expect(detailFreePage.dialog).toContainText("정말 삭제하시겠습니까?");

        await detailFreePage.dialogCancelBtn.click();
        await expect(detailFreePage.dialog).toBeHidden();

        await lastCmt.deleteCmtBtn.click();
        await detailFreePage.dialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("success", freePostData.deleteCmtMsg.success);
    });

    test('[Community] User can comment to depth3', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await page.waitForTimeout(500);

        const t = Date.now();
        const cmts = [`Depth 1 ${t}`, `Depth 2 ${t}`, `Depth 3 ${t}`];

        await detailFreePage.writeCmt(cmts[0]);
        await page.waitForTimeout(500);
        const el1 = detailFreePage.getCmtElementByText(cmts[0]);

        await el1.replyBtn.click();
        await detailFreePage.replyCmtInput.last().fill(cmts[1]);
        await detailFreePage.submitCmtBtn.last().click();
        await page.waitForTimeout(500);
        const el2 = detailFreePage.getCmtElementByText(cmts[1]);

        await el2.replyBtn.click();
        await detailFreePage.replyCmtInput.first().fill(cmts[2]);
        await detailFreePage.submitCmtBtn.nth(3).click();
        await page.waitForTimeout(500);
        const el3 = detailFreePage.getCmtElementByText(cmts[2]);

        await expect(el3.replyBtn).toBeHidden();
        await expect(el1.item.getByRole('button', { name: '답글 1', exact: true })).toBeVisible();
        await expect(el2.item.getByRole('button', { name: '답글 1', exact: true })).toBeVisible();
        await expect(detailFreePage.cmtCount).toHaveText('3');

        for (const el of [el3, el2, el1]) {
            await el.deleteCmtBtn.click();
            await detailFreePage.dialogConfirmBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.deleteCmtMsg.success);
            await page.waitForTimeout(500);
        }
    });
});