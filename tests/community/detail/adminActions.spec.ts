import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import freePostData from '../../../data-test/free-post-data.json';
import loginData from '../../../data-test/login-data.json';
import { getExpectedRelativeTime } from '../../../utils/testRelativeTime';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Move Post popup should be shown when clicking Move Post button', async () => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.movePostBtn.click();
        await expect(detailFreePage.dialog.filter({ hasText: '게시물이동'})).toBeVisible();
    });

    test('[Community] Admin can add and remove a post from Best list', async ({ page, apiBaseURL, browserName }) => {
        test.skip(browserName !== 'chromium', 'Avoid conflict in parallel');

        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        const postId = detailFreePage.getPostIdFromUrl(freePostData.postUrl.normalPost);

        await expect(detailFreePage.bestBtn).toHaveText('베스트 게시물 추가');

        await detailFreePage.bestBtn.click();
        await expect(detailFreePage.bestBtn).toHaveText('베스트 제외하기');
        await expect(page.getByText(freePostData.bestMsg.add)).toBeVisible();

        const bestResponse = await page.request.get(`${apiBaseURL}/community/best`);
        expect(bestResponse.ok()).toBeTruthy();
        const bestJson = await bestResponse.json();
        const bestIds: string[] = (bestJson.list as Array<{ wr_id: string | number }>)
            .map((item) => String(item.wr_id));
        expect(bestIds).toContain(postId);

        await detailFreePage.bestBtn.click();
        await expect(detailFreePage.bestBtn).toHaveText('베스트 게시물 추가');
        await expect(page.getByText(freePostData.bestMsg.remove)).toBeVisible();

        const bestResponseAfter = await page.request.get(`${apiBaseURL}/community/best`);
        expect(bestResponseAfter.ok()).toBeTruthy();
        const bestJsonAfter = await bestResponseAfter.json();
        const bestIdsAfter: string[] = (bestJsonAfter.list as Array<{ wr_id: string | number }>)
            .map((item) => String(item.wr_id));
        expect(bestIdsAfter).not.toContain(postId);
    });

    test('[Community] Admin can add and remove a post from Suggested Post list', async ({ page, apiBaseURL, browserName }) => {
        test.skip(browserName !== 'chromium', 'Avoid conflict in parallel');
        test.setTimeout(150000);

        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        const postId = detailFreePage.getPostIdFromUrl(freePostData.postUrl.normalPost);

        await expect(detailFreePage.suggestBtn).toHaveText('추천 게시물 추가');

        await detailFreePage.suggestBtn.click();
        await expect(detailFreePage.noticeDialog).toContainText(freePostData.suggestMsg.add);
        await detailFreePage.dialogCancelBtn.click();
        await expect(detailFreePage.noticeDialog).toBeHidden();
        await expect(detailFreePage.suggestBtn).toHaveText('추천 게시물 추가');

        await detailFreePage.suggestBtn.click();
        await detailFreePage.dialogConfirmBtn.click();
        await expect(detailFreePage.suggestBtn).toHaveText('추천 게시물 해제');

        await page.waitForTimeout(60000);
        const suggestedResponse = await page.request.get(`${apiBaseURL}/community/board/feature`);
        expect(suggestedResponse.ok()).toBeTruthy();
        const suggestedJson = await suggestedResponse.json();
        const suggestedIds: string[] = (suggestedJson as Array<{ wr_id: string | number }>)
            .map((item) => String(item.wr_id));
        expect(suggestedIds).toContain(postId);

        await detailFreePage.suggestBtn.click();
        await expect(detailFreePage.noticeDialog).toContainText(freePostData.suggestMsg.remove);
        await detailFreePage.dialogCancelBtn.click();
        await expect(detailFreePage.noticeDialog).toBeHidden();
        await expect(detailFreePage.suggestBtn).toHaveText('추천 게시물 해제');

        await detailFreePage.suggestBtn.click();
        await detailFreePage.dialogConfirmBtn.click();
        await expect(detailFreePage.suggestBtn).toHaveText('추천 게시물 추가');

        await page.waitForTimeout(60000);
        const suggestedResponseAfter = await page.request.get(`${apiBaseURL}/community/board/feature`);
        expect(suggestedResponseAfter.ok()).toBeTruthy();
        const suggestedJsonAfter = await suggestedResponseAfter.json();
        const suggestedIdsAfter: string[] = (suggestedJsonAfter as Array<{ wr_id: string | number }>)
            .map((item) => String(item.wr_id));
        expect(suggestedIdsAfter).not.toContain(postId);
    });

    test('[Community] Admin can mark a post as Read', async ({ request, apiBaseURL }) => {
        const loginRes = await request.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.userC.email,
                password: loginData.userC.password,
            }
        });
        const loginJson = await loginRes.json();
        const userCToken = loginJson.session_id;

        const createRes = await request.post(`${apiBaseURL}/community/board/`, {
            headers: { 'NAMED-SESSION': userCToken },
            form: {
                board_type: 'free',
                subject: `Auto Test Read Mark ${Date.now()}`,
                content: 'Auto test content for read mark',
            }
        });
        expect(createRes.ok()).toBeTruthy();
        const createJson = await createRes.json();
        const newPostId = String(createJson.wr_id);

        await detailFreePage.navigate(`/community/free/${newPostId}`);

        await expect(detailFreePage.readBtn).toHaveText('읽음 표시');
        await expect(detailFreePage.adminRead).not.toBeVisible();

        await detailFreePage.readBtn.click();
        await expect(detailFreePage.readBtn).toHaveText('읽음 표시 완료');
        await expect(detailFreePage.readBtn).toBeDisabled();
        await expect(detailFreePage.adminRead).toBeVisible();

        await detailFreePage.deletePostViaAPI(request, apiBaseURL, newPostId);
    });
})