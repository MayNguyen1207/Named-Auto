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

    test('[Community] Post data should be displayed correctly in All tab', async ({ page, request, apiBaseURL }) => {
        await freeListPage.verifyPostList(page, request, apiBaseURL, 'all');
    });

    test('[Community] Post data should be displayed correctly in Best tab', async ({ page, request, apiBaseURL }) => {
        await freeListPage.bestTab.click();
        await freeListPage.verifyPostList(page, request, apiBaseURL, 'best');
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let freeListPage: FreeListPage;

    test.beforeEach(async ({ page }) => {
        freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
    });

    test('[Community] Post data should be displayed correctly in My Post tab', async ({ page, request, apiBaseURL }) => {
        await freeListPage.myPostTab.click();
        await freeListPage.verifyPostList(page, request, apiBaseURL, 'my_wr');
    });

    test('[Community] Post data should be displayed correctly in My Comment tab', async ({ page, request, apiBaseURL }) => {
        await freeListPage.myCmtTab.click();
        await freeListPage.verifyPostList(page, request, apiBaseURL, 'my_cm');
    });
});