import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import loginData from '../../../data-test/login-data.json';
import postData from '../../../data-test/write-post-data.json';

test.describe('Phone number Non-verified User Flow', () => {
    test('[Community] Non-verified user should be prevented from writing Free post', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        let writeFreePage: WriteFreePage;
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.nonverifiedUser.email, loginData.nonverifiedUser.password);
        await writeFreePage.closeVerificationPopup();

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.click();
        await expect(writeFreePage.noticeDialog).toContainText(
            "본인 인증을 거치지 않은 경우 글쓰기가 제한됩니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await writeFreePage.dialogCancelBtn.click();
        await expect(page).toHaveURL('/community\/create\?boardType=free');

        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});