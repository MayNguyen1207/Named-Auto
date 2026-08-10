import { test as setup, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import loginData from '../data-test/login-data.json';
import path from 'path';

async function injectBannerBypass(page: Page) {
    await page.evaluate(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        localStorage.setItem('modalSeenDate', todayStr);
    });

    await page.waitForTimeout(300);
}

setup('Authenticate as Normal User', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.valid.email, loginData.valid.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    await injectBannerBypass(page);

    const userStatePath = path.resolve(__dirname, '../playwright/.auth/user.json');
    await page.context().storageState({ path: userStatePath });
});

setup('Authenticate as Admin', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.admin.email, loginData.admin.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    await injectBannerBypass(page);

    const adminStatePath = path.resolve(__dirname, '../playwright/.auth/admin.json');
    await page.context().storageState({ path: adminStatePath });
});

setup('Authenticate as Guest', async ({ page }) => {
    await page.goto('/');

    await injectBannerBypass(page);

    const guestStatePath = path.resolve(__dirname, '../playwright/.auth/guest.json');
    await page.context().storageState({ path: guestStatePath });
});

setup('Authenticate as Prisoner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.prisoner.email, loginData.prisoner.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    await injectBannerBypass(page);

    const adminStatePath = path.resolve(__dirname, '../playwright/.auth/prisoner.json');
    await page.context().storageState({ path: adminStatePath });
});

setup('Authenticate as Non-verified user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.nonverifiedUser.email, loginData.nonverifiedUser.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    await injectBannerBypass(page);

    const adminStatePath = path.resolve(__dirname, '../playwright/.auth/non-verified-user.json');
    await page.context().storageState({ path: adminStatePath });
});

setup('Authenticate as Non phone user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.unverifiedPhone.email, loginData.unverifiedPhone.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    await injectBannerBypass(page);

    const nonVerifiedPhoneStatePath = path.resolve(__dirname, '../playwright/.auth/non-phone-user.json');
    await page.context().storageState({ path: nonVerifiedPhoneStatePath });
});

