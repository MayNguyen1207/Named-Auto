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

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 5회 이상
            게시물을 열람하시겠습니까?`
        );

        await detailFreePage.restrictedPostBackBtn.click();;
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedFiveTimePost);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click View button to View post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeHidden();
        await detailFreePage.restrictedPostViewBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeVisible();
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 10 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedTenTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 10회 이상`
        );
        await expect(detailFreePage.restrictedPostViewBtn).toBeHidden();
        await detailFreePage.restrictedPostBackBtn.click();
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedTenTimePost);
    })
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 5회 이상
            게시물을 열람하시겠습니까?`
        );

        await detailFreePage.restrictedPostBackBtn.click()
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedFiveTimePost);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click View button to View post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeHidden();
        await detailFreePage.restrictedPostViewBtn.click()
        await expect(page).toHaveURL(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeVisible();
    });
});