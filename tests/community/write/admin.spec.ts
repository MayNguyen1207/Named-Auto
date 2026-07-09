import { test, expect } from '@playwright/test';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import { DetailFreePage } from '../../../pages/DetailFreePage';
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
});