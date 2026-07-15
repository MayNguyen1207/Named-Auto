import { test, expect } from '../../../utils/fixtures';
import { FreeListPage } from '../../../pages/FreeListPage';

test.describe('Guest Flow', () => {

    let freeListPage: FreeListPage;

    test.beforeEach(async ({ page }) => {
        freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
    });

    test('[Community] My Posts and My Comment tabs should not be shown in Guest view', async () => {
        await expect(freeListPage.myPostTab).toBeHidden();
        await expect(freeListPage.myCmtTab).toBeHidden();
    });

    test('[Community] Verify list pagination', async ({ page }) => {
        await test.step('Mock API to create Notice posts', async () => {
            await page.route('**/community/board/notice?*board_type=free*', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        list: [
                            { wr_id: 'n1', wr_subject: 'Notice 1', wr_name: 'Admin', wr_datetime: new Date().toISOString(), wr_hit: 100, wr_good: 10, wr_comment: 0, is_notice: true },
                            { wr_id: 'n2', wr_subject: 'Notice 2', wr_name: 'Admin', wr_datetime: new Date().toISOString(), wr_hit: 200, wr_good: 20, wr_comment: 0, is_notice: true }
                        ]
                    }),
                });
            });
        });

        await test.step('Mock API to create normal posts', async () => {
            const totalItems = 88;
            await page.route('**/community/board?*board_type=free*', async route => {
                const url = new URL(route.request().url());
                const pageNum = Number(url.searchParams.get('page') || '1');
                const limit = Number(url.searchParams.get('limit') || '10');

                const startIdx = (pageNum - 1) * limit;
                const endIdx = Math.min(startIdx + limit, totalItems);

                const list = [];
                for (let i = startIdx + 1; i <= endIdx; i++) {
                    list.push({
                        wr_id: `p${i}`,
                        wr_subject: `Normal Post ${i}`,
                        wr_name: `User ${i}`,
                        wr_datetime: new Date().toISOString(),
                        wr_hit: i,
                        wr_good: i,
                        wr_comment: i % 5,
                        is_notice: false
                    });
                }

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        list: list,
                        total_cnt: totalItems
                    }),
                });
            });
        });

        await test.step('Open Free list screen', async () => {
            await freeListPage.navigate();
            await page.keyboard.press('Escape');
        });

        await test.step('Verify pagination options list', async () => {
            await freeListPage.pagInput.scrollIntoViewIfNeeded();
            await freeListPage.verifyListItemsNumber();
            await page.keyboard.press('Escape');
        });

        await test.step('Verify default pagination option', async () => {
            await expect(freeListPage.getPageItem(1)).toHaveAttribute('aria-current', 'page');
            await expect(freeListPage.listItems).toHaveCount(12);
        });

        await test.step('Verify pagination option selection', async () => {
            await freeListPage.verifySelectedOption(20);
            await expect(freeListPage.listItems).toHaveCount(22);
        });

        await test.step('Verify pagination number input field', async () => {
            await freeListPage.pagInput.fill('');
            await freeListPage.pagInput.focus();
            await page.keyboard.type('abc');
            await expect(freeListPage.pagInput).toBeEmpty();

            await freeListPage.goToPageViaInput('3', 3);
            await freeListPage.goToPageViaInput('99', 5);
            await freeListPage.goToPageViaInput('0', 1);
        });

        await test.step('Verify Next and Previous buttons', async () => {
            await freeListPage.pagNextBtn.click();
            await page.waitForTimeout(500);
            await expect(freeListPage.getPageItem(2)).toHaveAttribute('aria-current', 'page');

            await freeListPage.pagPreviousBtn.click();
            await page.waitForTimeout(500);
            await expect(freeListPage.getPageItem(1)).toHaveAttribute('aria-current', 'page');
        })
    });

    test('[Community] User can click post title to go to post detail screen', async ({ page }) => {
        const randomIndex = Math.floor(Math.random() * 10);
        const randomItem = freeListPage.listItems.nth(randomIndex);

        const href = await randomItem.locator('a').first().getAttribute('href');

        await randomItem.click();
        await page.waitForURL(`**${href}*`);
        expect(page.url()).toContain(href as string);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let freeListPage: FreeListPage;

    test.beforeEach(async ({ page }) => {
        freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
    });

    const tabs = [
        { name: 'All', type: 'all', getLocator: (page: FreeListPage) => page.allTab },
        { name: 'Best', type: 'best', getLocator: (page: FreeListPage) => page.bestTab },
        { name: 'My Post', type: 'my_wr', getLocator: (page: FreeListPage) => page.myPostTab },
        { name: 'My Comment', type: 'my_cm', getLocator: (page: FreeListPage) => page.myCmtTab }
    ] as const;

    test('[Community] Post data should be displayed correctly in all tabs', async ({ page, request, apiBaseURL }) => {
        for (const tab of tabs) {
            if (tab.type !== 'all') {
                await tab.getLocator(freeListPage).click();
            }

            await page.waitForTimeout(1000);
            await freeListPage.verifyPostList(page, request, apiBaseURL, tab.type);
        }
    });

    test('[Community] No item text should be displayed if list is empty', async ({ page }) => {
        // Mock API
        await page.route('**/community/board?*board_type=free*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    list: [],
                    total_count: 0
                }),
            });
        });

        await page.route('**/community/board/notice?*board_type=free*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    list: []
                }),
            });
        });

        await freeListPage.navigate();

        for (const tab of tabs) {
            await tab.getLocator(freeListPage).click();
            await expect(freeListPage.noItemText).toBeVisible();
            await expect(freeListPage.listItems).toHaveCount(0);
        }
    });
});