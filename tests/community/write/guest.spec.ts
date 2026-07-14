import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import loginData from '../../../data-test/login-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Guest is navigated to Login page when accessing Write Post page', async ({ page }) => {
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await expect(page).toHaveURL(/\/login\?callbackUrl=\/community\/create\?boardType=free/);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL('/community\/create\?boardType=free');
    });
});