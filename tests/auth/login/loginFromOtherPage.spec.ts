import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';
import { LoginPage } from '../../../pages/LoginPage';
import loginData from '../../../data-test/login-data.json';

test.describe('[Auth] Normal User Login Feature Tests - Login from Other Pages', () => {
    let homePage: HomePage;
    let loginPage: LoginPage;
    const { email, password, directLoginPages } = loginData.loginFromOtherPage;
    const handleLoginDialogAndLogin = async (page: Page, expectedLoginUrl: any, finalExpectedUrl: any) => {
        const loginRequiredDialog = page.getByRole('dialog');
        await expect(loginRequiredDialog).toBeVisible();
        await loginRequiredDialog.getByRole('button', { name: '확인' }).click({ force: true });

        await expect(page).toHaveURL(expectedLoginUrl);
        await page.waitForLoadState('networkidle');

        await loginPage.login(email, password);
        await expect(page).toHaveURL(finalExpectedUrl);
    };

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        loginPage = new LoginPage(page);
    });

    for (const pageInfo of directLoginPages) {
        test(`[Auth] Login from ${pageInfo.name}`, async ({ page }) => {
            if (pageInfo.url === '/home') {
                await homePage.navigate();
            } else {
                await page.goto(pageInfo.url);
            }
            await page.getByTestId('navigation-button-login').click();
            if (pageInfo.hasLoginUrlCheck) {
                await expect(page).toHaveURL('/login');
            }
            await loginPage.login(email, password);
            await expect(page).toHaveURL('/home');
        });
    }

    test('[Auth] Login from Main chat', async ({ page }) => {
        await homePage.navigate();
        await page.getByTestId('input-field').fill('a');
        await page.locator(".tabler-icon.tabler-icon-send-2").first().click();

        await handleLoginDialogAndLogin(page, '/login?callbackUrl=%2Fhome', '/home');
    });

    test('[Auth] Login from Match page when action is restricted (Chat)', async ({ page }) => {
        await page.goto('/match/soccer/11737634/odds');
        await page.getByRole('textbox', { name: '메세지를 입력하세요' }).fill('a');
        await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();

        await handleLoginDialogAndLogin(page, /\/login\?callbackUrl=.*%2Fmatch%2Fsoccer%2F11737634%2Fodds/, /\/match\/soccer\/11737634\/odds/);
    });

    test('[Auth] Login from PowerBall page when action is restricted', async ({ page }) => {
        await page.goto('/minigame/rball/double_dragon');
        await page.getByRole('button', { name: '바로가기' }).click();

        const loginRequiredDialog = page.getByRole('dialog');
        await expect(loginRequiredDialog).toBeVisible();
        await loginRequiredDialog.getByRole('button', { name: '확인' }).click({ force: true });

        await expect(page).toHaveURL(/\/login/);
        await page.waitForLoadState('networkidle');

        const pageBetgamepopup = page.waitForEvent('popup');
        await loginPage.login(email, password);
        const pageBetgame = await pageBetgamepopup;

        await expect(pageBetgame).toHaveURL(/games-stg\.named\.net/);
    });

    test('[Auth] Login from PowerBall page when action is restricted (Game Pick)', async ({ page }) => {
        await page.goto('/minigame/rball/double_dragon');
        await page.getByRole('tab', { name: '게임픽' }).click();
        await page.getByRole('button', { name: /^홀/ }).first().click();

        await handleLoginDialogAndLogin(page, /\/login/, /\/minigame\/rball\/double_dragon/);
    });

    test('[Auth] Login from Trusted Sites page when action is restricted (Write post)', async ({ page }) => {
        await page.goto('/trustedsites');
        await page.getByRole('link', { name: '후기' }).click();
        await page.getByRole('button', { name: '글쓰기' }).click();

        await handleLoginDialogAndLogin(page, /\/login/, /\/trustedsites\/review/);
    });

    test('[Auth] Login from Trusted Sites Details page when action is restricted (Comment)', async ({ page }) => {
        await page.goto('/trustedsites/4147');
        await page.getByRole('textbox', { name: /댓글 작성시 타인에 대한 배려와 책임을 담아주세요/ }).click();

        await handleLoginDialogAndLogin(page, /\/login/, /\/trustedsites\/4147/);
    });
});