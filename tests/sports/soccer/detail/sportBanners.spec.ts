import { test, expect } from '../../../../utils/fixtures';
import { Locator } from '@playwright/test';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Guest Flow', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigate(matchId);
    });

    test('[Soccer] Sport banners should be random displayed', async ({ page }) => {
        await expect(soccerDetailPage.sportBannerLeft.locator('img')).toBeVisible();
        await expect(soccerDetailPage.sportBannerRight.locator('img')).toBeVisible();

        const firstLeftSrc = await soccerDetailPage.sportBannerLeft.locator('img').getAttribute('src');
        const firstRightSrc = await soccerDetailPage.sportBannerRight.locator('img').getAttribute('src');

        let leftIsRandom = false;
        let rightIsRandom = false;

        for (let i = 0; i < 2; i++) {
            await page.reload({ waitUntil: 'domcontentloaded' });

            await expect(soccerDetailPage.sportBannerLeft.locator('img')).toBeVisible({ timeout: 10000 });
            await expect(soccerDetailPage.sportBannerRight.locator('img')).toBeVisible({ timeout: 10000 });

            const nextLeftSrc = await soccerDetailPage.sportBannerLeft.locator('img').getAttribute('src');
            const nextRightSrc = await soccerDetailPage.sportBannerRight.locator('img').getAttribute('src');

            if (nextLeftSrc !== firstLeftSrc) leftIsRandom = true;
            if (nextRightSrc !== firstRightSrc) rightIsRandom = true;
        }

        expect(leftIsRandom).toBeTruthy();
        expect(rightIsRandom).toBeTruthy();
    });

    test('[Soccer] User can open link of sport banners in new tab', async ({ page }) => {
        test.setTimeout(60000);

        const verifyBanner = async (bannerLocator: Locator) => {
            const href = await bannerLocator.getAttribute('href');
            if (href) {
                const pagePromise = page.context().waitForEvent('page');
                await bannerLocator.click();
                const newPage = await pagePromise;

                await newPage.waitForLoadState();
                expect(newPage.url()).not.toBe('blank');
                await newPage.close();
            }
        };

        await test.step('Click left banner', async () => {
            await verifyBanner(soccerDetailPage.sportBannerLeft);
        });

        await test.step('Click right banner', async () => {
            await verifyBanner(soccerDetailPage.sportBannerRight);
        });
    });
})