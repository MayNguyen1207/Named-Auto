import {test, expect} from '@playwright/test';
// import {LoginPage} from '../pages/LoginPage';
import {WriteFreePage} from '../pages/WriteFreePage';

// import loginData from '../data-test/login-data.json';
import postData from '../data-test/write-post-data.json';

test.describe('Normal User Flow', () => {
    
    test('[Community] User can write Free post with valid data', async ({page}) => {
    /* const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.valid.email, loginData.valid.password);
    await expect(page).toHaveURL('/home'); */

        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await expect(page).toHaveURL(/.*community\/free/);
        await expect(page.locator('h1:visible')).toHaveText(postData.valid.title);
        await expect(page.getByLabel('게시글 내용')).toContainText(postData.valid.content);
    });
});