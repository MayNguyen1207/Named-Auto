import { test, expect } from '@playwright/test';
import { DetailFreePage } from '../pages/DetailFreePage';
import freePostData from '../data-test/free-post-data.json';
import { getExpectedRelativeTime, getExpectedDetailTime } from '../utils/testRelativeTime';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

test.describe('Guest Flow', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

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
    });

    test('[Community] Context Menu should be shown when clicking post author nickname', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.postAuthor.click();
        await expect(page.getByTestId('dropdown-menu-content')).toBeVisible();
    });
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

test.describe('Verify post creation date time display', () => {
    test.use({ storageState: { cookies: [], origins: [] }, timezoneId: 'Asia/Seoul' });

    const timeTestCases = [
        { value: 30, unit: 'second', expectedRelative: '방금' },
        { value: 45, unit: 'minute', expectedRelative: '45분 전' },
        { value: 5, unit: 'hour', expectedRelative: '5시간 전' },
        { value: 3, unit: 'day', expectedRelative: '3일 전' },
        { value: 2, unit: 'week', expectedRelative: '2주 전' },
        { value: 6, unit: 'month', expectedRelative: '6개월 전' },
        { value: 14, unit: 'month', expectedRelative: '1년 전' },
    ];

    for (const data of timeTestCases) {
        test(`[Community] Post creation date time should be displayed in correct format (${data.value} ${data.unit}(s) ago)`, async ({ page }) => {
            const detailFreePage = new DetailFreePage(page);
            const postId = detailFreePage.getPostIdFromUrl(freePostData.postUrl.normalPost);

            const fakeSystemTime = '2026-06-30T12:00:00Z'; //Set current time to a fixed time
            await page.clock.setFixedTime(fakeSystemTime);

            const mockCreatedTime = dayjs(fakeSystemTime) //Calculate the post creation time
                .subtract(data.value, data.unit as dayjs.ManipulateType)
                .toISOString();

            await page.route(`**/community/board/${postId}*`, async (route) => {
                const response = await route.fetch();
                const json = await response.json();
                json.wr_datetime = dayjs(mockCreatedTime).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
                await route.fulfill({ response, json });
            });

            await detailFreePage.navigate(freePostData.postUrl.normalPost);

            const expectedRelativeText = data.expectedRelative || getExpectedRelativeTime(mockCreatedTime);
            await expect(detailFreePage.postCreationTime).toHaveText(expectedRelativeText);

            await detailFreePage.postCreationTime.hover();
            const expectedDetailText = getExpectedDetailTime(mockCreatedTime);
            await expect(detailFreePage.hoverTooltip).toContainText(expectedDetailText);

            await detailFreePage.postCreationTime.click();
            await expect(detailFreePage.postCreationTime).toContainText(expectedDetailText);
        });
    }
});