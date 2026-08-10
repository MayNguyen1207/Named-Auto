import { test, expect } from '@playwright/test';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import postData from '../../../data-test/write-post-data.json';

test.describe('Phone number Non-verified User Flow', () => {
    test.use({ storageState: 'playwright/.auth/non-verified-user.json' });

    test('[Community] Non-verified user should be prevented from writing Free post', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.click({ force: true });
        await expect(writeFreePage.noticeDialog).toContainText(
            "본인 인증을 거치지 않은 경우 글쓰기가 제한됩니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await writeFreePage.dialogCancelBtn.click();
        await expect(page).toHaveURL('/community\/create\?boardType=free');

        await writeFreePage.writeBtn.click({ force: true });
        await writeFreePage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});