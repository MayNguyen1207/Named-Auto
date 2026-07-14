import { test, expect } from '../../../utils/fixtures';
import { LoginPage } from '../../../pages/LoginPage';
import { FreeListPage } from '../../../pages/FreeListPage';
import loginData from '../../../data-test/login-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Move to Login popup should be shown when guest clicks Write button', async ({ page }) => {
        const freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
        await freeListPage.writeBtn.click();
        await expect(freeListPage.moveLogin).toBeVisible();

        await freeListPage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL('/community/free');

        await freeListPage.writeBtn.click();
        await freeListPage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(/.*\/login/);
        const loginPage = new LoginPage(page);
        await page.waitForTimeout(500);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL('/community/free');
    });
});

test.describe('Non-verified user Flow', () => {
    test.use({ storageState: 'playwright/.auth/non-verified-user.json' });

    test('[Community] User can move to Write Post screen when clicking Write button', async ({ page }) => {
        const freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
        await page.waitForTimeout(2000);
        await freeListPage.writeBtn.click();
        await expect(freeListPage.noticeDialog).toContainText(
            "본인 인증을 거치지 않은 경우 글쓰기가 제한됩니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await freeListPage.dialogCancelBtn.click();
        await expect(page).toHaveURL('/community/free');

        await freeListPage.writeBtn.click();
        await freeListPage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] A modal should be shown when prisoner accesses Write Post page', async ({ page }) => {
        const freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
        await page.waitForTimeout(2000);
        await freeListPage.writeBtn.click();
        await expect(freeListPage.jailPoster).toBeVisible();
        await expect(freeListPage.prisonNotice).toContainText(
            "서비스 이용 제한 안내" +
            loginData.prisoner.expectedUsername + "님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.");

        await freeListPage.previousPageBtn.click();
        await expect(page).toHaveURL('/community/free');
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('[Community] User can move to Write Post screen when clicking Write button', async ({ page }) => {
        const freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
        await freeListPage.writeBtn.click();
        await expect(page).toHaveURL('/community/create?boardType=free');
    });
})