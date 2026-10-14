import { test, expect } from '../../../utils/fixtures';
import { WriteFreePage } from '../../../pages/community/WriteFreePage';
import { DetailFreePage } from '../../../pages/community/DetailFreePage';
import postData from '../../../data-test/write-post-data.json';

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] Admin can assign author for the post', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const selectedAuthor = await writeFreePage.selectFirstAuthor();
        expect(selectedAuthor).not.toBe('');

        await writeFreePage.writePost(`${Date.now()}` + postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });
        await expect(detailFreePage.postAuthor).toContainText(selectedAuthor);
    });

    test('[Community] Checkboxes for notice and comment should be displayed in Admin view', async () => {
        await expect(writeFreePage.checkBox.first().locator('svg')).toHaveClass(/tabler-icon-square-rounded/);
        await writeFreePage.checkBox.first().click();
        await expect(writeFreePage.checkBox.first().locator('svg')).toHaveClass(/tabler-icon-square-rounded-check/);

        await expect(writeFreePage.checkBox.last().locator('svg')).toHaveClass(/tabler-icon-square-rounded-check/);
        await writeFreePage.checkBox.last().click();
        await expect(writeFreePage.checkBox.last().locator('svg')).toHaveClass(/tabler-icon-square-rounded/);
    });

    const checkboxCases = [
        {
            label: 'Notice ON + Comment ON',
            clickNotice: true,
            clickComment: false,
            expectComment: true,
            expectInNotice: true,
        },
        {
            label: 'Notice ON + Comment OFF',
            clickNotice: true,
            clickComment: true,
            expectComment: false,
            expectInNotice: true,
        },
        {
            label: 'Notice OFF + Comment ON',
            clickNotice: false,
            clickComment: false,
            expectComment: true,
            expectInNotice: false,
        },
        {
            label: 'Notice OFF + Comment OFF',
            clickNotice: false,
            clickComment: true,
            expectComment: false,
            expectInNotice: false,
        },
    ];

    for (const { label, clickNotice, clickComment, expectComment, expectInNotice } of checkboxCases) {
        test(`[Community] Checkbox: ${label}`, async ({ page, browserName, request, apiBaseURL }) => {
            test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

            let detailFreePage = new DetailFreePage(page);
            let postId: string

            await test.step('Create the post', async () => {
                if (clickNotice) await writeFreePage.checkBox.first().click(); // notice: OFF→ON
                if (clickComment) await writeFreePage.checkBox.last().click(); // comment: ON→OFF

                await writeFreePage.writePost(label, `Auto Test Notice and Comment checkboxes ${Date.now()}`);
                await writeFreePage.writeBtn.click();
            });

            await test.step('Check the comment section', async () => {
                await expect(page).toHaveURL(/.*community\/free/);
                await expect(detailFreePage.postTitle).toHaveText(label, { timeout: 10000});

                if (expectComment) {
                    await expect(detailFreePage.cmtInput.first()).toBeVisible();
                    await expect(detailFreePage.submitCmtBtn).toBeVisible();
                } else {
                    await expect(detailFreePage.cmtInput.first()).not.toBeVisible();
                    await expect(detailFreePage.submitCmtBtn).not.toBeVisible();
                }
            });

            await test.step('Check the post existing in API response', async () => {
                postId = page.url().split('/').pop()!;
                console.log(`[${label}] wr_id: ${postId}`);

                const response = await request.get(`${apiBaseURL}/community/board/notice?board_type=free`);
                expect(response.ok()).toBeTruthy();

                const responseBody = await response.json();
                const postList: Array<{ wr_id?: number | string }> = Array.isArray(responseBody)
                    ? responseBody
                    : responseBody?.list ?? [];

                const found = postList.some((post) => String(post.wr_id) === String(postId));
                if (expectInNotice) {
                    expect(found, `[${label}] Expected wr_id=${postId} to be in notice list`).toBeTruthy();
                } else {
                    expect(found, `[${label}] Expected wr_id=${postId} to NOT be in notice list`).toBeFalsy();
                }
            });

            await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId!, 'free');
        });
    }
});