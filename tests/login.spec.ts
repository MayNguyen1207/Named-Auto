import {test, expect} from '@playwright/test';
import {LoginPage} from '../pages/LoginPage';
import validLoginData from '../data-test/login-valid-data.json';

test('[Auth] User can login successfully', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLoginPage();
    await loginPage.enterEmail(validLoginData.email);
    await loginPage.enterPassword(validLoginData.password);
    await loginPage.clickLoginButton();
    await expect(page).toHaveURL(/.*home/);
});