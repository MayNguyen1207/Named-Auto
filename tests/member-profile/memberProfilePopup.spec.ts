import { test, expect } from '../../utils/fixtures';
import { MemberProfilePage } from '../../pages/MemberProfilePage';
import { LoginPage } from '../../pages/LoginPage';
import loginData from '../../data-test/login-data.json';

test.describe('[Member Profile Popup]', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let memberProfilePage: MemberProfilePage;

    test.beforeEach(async ({ page }) => {
        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
        await memberProfilePage.profilePopupBtn.click();
        await expect(memberProfilePage.profilePopup).toBeVisible();
    });

    test('User can close Member Profile popup', async () => {
        await memberProfilePage.proCloseBtn.click();
        await expect(memberProfilePage.profilePopup).not.toBeVisible();
    });

    test('User background image, avatar, level icon, username are displayed', async () => {
        const { proBackgroundImg, proAvatarImg, proLevelIcon, proUsername } = memberProfilePage.getUserInfoElements(loginData.valid.expectedUsername);
        await expect(proBackgroundImg).toBeVisible();
        await expect(proAvatarImg).toBeVisible();
        await expect(proLevelIcon).toBeVisible();
        await expect(proUsername).toBeVisible();
    });

    test('Cash, Point, Bread numbers are displayed correctly', async ({ request, apiBaseURL }) => {
        const fs = require('fs');
        const path = require('path');
        const userState = JSON.parse(fs.readFileSync(path.resolve('playwright/.auth/user.json'), 'utf-8'));
        const sessionCookie = userState.cookies.find((c: any) => c.name === 'dev_session_id')?.value;

        const response = await request.get(`${apiBaseURL}/me`, {
            headers: {
                'NAMED-SESSION': sessionCookie
            }
        });
        const responseData = await response.json();
        const me = responseData.data || responseData;

        const formatNumber = (value: number | string) => {
            const num = Number(value);
            if (num === 0) return '0';
            if (num >= 1000000) return Math.floor(num / 100000) / 10 + 'M';
            if (num >= 1000) return Math.floor(num / 100) / 10 + 'k';
            return num.toString();
        };

        const expectedCash = `${formatNumber(me.cash)} 캐시`;
        const expectedPoint = `${formatNumber(me.point)} 포인트`;
        const expectedBread = `${formatNumber(me.total_medal)} 건빵`;

        await expect(memberProfilePage.proCashBtn).toContainText(expectedCash);
        await expect(memberProfilePage.proPointBtn).toContainText(expectedPoint);
        await expect(memberProfilePage.proBreadBtn).toContainText(expectedBread);
    });

    const screenTests = [
        { name: 'Cash', btn: 'proCashBtn', url: '/mypage/cash' },
        { name: 'Point', btn: 'proPointBtn', url: '/mypage/point' },
        { name: 'Bread', btn: 'proBreadBtn', url: '/mypage/bread' },
        { name: 'My Info', btn: 'proMyInfoBtn', url: '/mypage/info' },
        { name: 'Write', btn: 'proWriteBtn', url: '/community/create?boardType=free' },
        { name: 'Market', btn: 'proMarketBtn', url: '/market/market' },
    ] as const;

    for (const { name, btn, url } of screenTests) {
        test(`User can click ${name} button to go to ${name} screen`, async ({ page }) => {
            await memberProfilePage[btn].click();
            await expect(page).toHaveURL(url);
        });
    }

    const imageEditTests = [
        { type: 'background image', btn: 'proEditBackgroundBtn', toastText: '현재 보유하신 프로필 배경 이미지 변경 아이템이 없습니다.' },
        { type: 'avatar', btn: 'proEditAvatarBtn', toastText: '현재 보유하신 프로필 이미지 변경 아이템이 없습니다.' }
    ] as const;

    for (const { type, btn, toastText } of imageEditTests) {
        test(`User can edit ${type}`, async ({ page }) => {
            const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
            await memberProfilePage[btn].click();
            await memberProfilePage.proUploadImgBtn.click();

            const fileChooser = await fileChooserPromise;
            if (fileChooser) {
                expect(fileChooser).toBeTruthy();
            } else {
                const toastMessage = page.getByText(toastText);
                await expect(toastMessage).toBeVisible();
            }
        });
    }
});

test('[Member Profile Popup] User can log out normally', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginData.valid.email, loginData.valid.password);
    await page.waitForURL(/.*home/, { timeout: 7000 });

    const memberProfilePage = new MemberProfilePage(page);
    await memberProfilePage.navigateHome();
    await memberProfilePage.profilePopupBtn.click();

    await memberProfilePage.proLogoutBtn.click();
    await expect(page).toHaveURL('/home');
    await expect(memberProfilePage.profilePopupBtn).toBeHidden();

    await context.close();
});