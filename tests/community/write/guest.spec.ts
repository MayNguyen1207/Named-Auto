import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { WriteFreePage } from '../../../pages/community/WriteFreePage';
import loginData from '../../../data-test/login-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Guest is navigated to Login page when accessing Write Post page', async ({ page }) => {
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcommunity%2Fcreate%3FboardType%3Dfree/);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL('/community/create?boardType=free');
    });
});