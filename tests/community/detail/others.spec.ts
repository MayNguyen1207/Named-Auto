import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/community/DetailFreePage';
import freePostData from '../../../data-test/free-post-data.json';
import { getExpectedRelativeTime } from '../../../utils/testRelativeTime';
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

    test('[Community] Context Menu should be shown when clicking post author nickname', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.postAuthor.click();
        await expect(page.getByTestId('dropdown-menu-content')).toBeVisible();
    });

    test('[Community] Number of post edition should be shown', async () => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        const editNum = await detailFreePage.editNumTxt.textContent();
        expect(editNum).toMatch(/수정 \d+/);
        await detailFreePage.editNumTxt.hover();
        await detailFreePage.hoverTooltip.waitFor({ state: 'visible', timeout: 5000 });
        const tooltipText = await detailFreePage.hoverTooltip.textContent();
        expect(tooltipText).toMatch(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}/);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] A modal should be shown when accessing blocked user post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.blockedUserPost);
        await expect(detailFreePage.noticeDialog).toContainText('차단한 회원의 게시글입니다. 차단 해제 후 열람할 수 있습니다.');
        await detailFreePage.dialogConfirmBtn.click();
        await expect(page).not.toHaveURL(freePostData.postUrl.blockedUserPost);
    });
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] A Free list are shown in Admin view', async () => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await expect(detailFreePage.listPost).toBeVisible();
    });

    test('[Community] User email, Login IP, Read Info should be shown in Admin view', async ({ page }) => {
        const detailFreePage2 = new DetailFreePage(page);
        const postId = detailFreePage2.getPostIdFromUrl(freePostData.postUrl.normalPost);

        let memberEmail = '';
        let wrIp = '';
        let managerRead = '';

        await page.route(`**/community/board/${postId}*`, async (route) => {
            const response = await route.fetch();
            const json = await response.json();

            memberEmail = json.member_info?.email ?? '';
            wrIp = json.wr_ip ?? '';
            managerRead = json.manager_read ?? '';

            await route.fulfill({ response, json });
        });

        await detailFreePage2.navigate(freePostData.postUrl.normalPost);

        await expect(detailFreePage2.emailInfo).toContainText(memberEmail);
        await expect(detailFreePage2.postIPInfo).toContainText(wrIp);
        await expect(detailFreePage2.adminRead).toContainText(managerRead);
    });
});

test.describe('Verify post creation date time display', () => {
    test.use({ timezoneId: 'Asia/Seoul' });

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

            const fakeSystemTime = dayjs().tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm:ssZ'); //Set current time to a fixed time
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
            const expectedDetailText = dayjs(mockCreatedTime).tz('Asia/Seoul').format('YYYY.MM.DD HH:mm');
            await expect(detailFreePage.hoverTooltip).toContainText(expectedDetailText);

            await detailFreePage.postCreationTime.click();
            await expect(detailFreePage.postCreationTime).toContainText(expectedDetailText);
            await page.mouse.move(0, 0);
            await page.waitForTimeout(200);
            await detailFreePage.postCreationTime.hover();
            await expect(detailFreePage.hoverTooltip).toContainText(expectedRelativeText);

            await detailFreePage.postCreationTime.click();
            await expect(detailFreePage.postCreationTime).toHaveText(expectedRelativeText);
        });
    }
});