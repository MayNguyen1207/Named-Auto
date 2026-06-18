import {test, expect} from '@playwright/test';
import {LoginPage} from '../pages/LoginPage';
import loginData from '../data-test/login-valid-data.json';

test('[Auth] User can login successfully', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLoginPage();
    await loginPage.enterEmail(loginData.email);
    await loginPage.enterPassword(loginData.password);
    await loginPage.clickLoginButton();
    await expect(page).toHaveURL(/.*home/);
});