import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('No Data', () => {
    test('[Soccer] Table title and no data text should be displayed correctly', async ({ page }) => {
        const matchId = matchData.matchLink.noOddsData;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);

        await expect(soccerDetailPage.oddsTableTitle).toBeVisible();
        const tabs = [soccerDetailPage.normalBtn, soccerDetailPage.handicapBtn, soccerDetailPage.underOverBtn];
        for (const tab of tabs) {
            await tab.click();
            await expect(page.locator('td:has-text("배당 데이터가 없습니다.")')).toBeVisible();
        }
    });
});

test.describe('Have Data', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);
    });

    test('[Soccer] Table header should be displayed correctly', async () => {
        const tabs = [
            { locator: soccerDetailPage.normalBtn, headers: ['', '기준', '승', '무', '패'] },
            { locator: soccerDetailPage.handicapBtn, headers: ['', '기준', '승', '무', '패'] },
            { locator: soccerDetailPage.underOverBtn, headers: ['', '기준', '오버', '무', '언더'] },
        ];

        for (const tab of tabs) {
            await tab.locator.click();
            await expect(soccerDetailPage.oddsTableHeaderCells).toHaveText(tab.headers);
        }
    });

    test('[Soccer] User can click image to open odd site in new tab', async ({ context }) => {
        const pagePromise = context.waitForEvent('page');
        await soccerDetailPage.oddsTableContentCells.locator('img').first().click();
        const newPage = await pagePromise;

        await newPage.waitForLoadState();
        expect(newPage.url()).not.toBe('about:blank');
    });

    test('[Soccer] Data table should be displayed correctly in 일반 tab', async ({ request, sportsApiBaseURL }) => {
        test.fail(true, 'Investigating why YSB 88 is hidden');
        await soccerDetailPage.normalBtn.click();
        await soccerDetailPage.verifyOddsTableRows(request, sportsApiBaseURL, matchId, '1X2');
    });

    test('[Soccer] Data table should be displayed correctly in 핸디캡 tab', async ({ request, sportsApiBaseURL }) => {
        test.fail(true, 'Investigating why YSB 88 is hidden');
        await soccerDetailPage.handicapBtn.click();
        await soccerDetailPage.verifyOddsTableRows(request, sportsApiBaseURL, matchId, 'HANDICAP');
    });

    test('[Soccer] Data table should be displayed correctly in 언더/오버 tab', async ({ request, sportsApiBaseURL }) => {
        test.fail(true, 'Investigating why YSB 88 is hidden');
        await soccerDetailPage.underOverBtn.click();
        await soccerDetailPage.verifyOddsTableRows(request, sportsApiBaseURL, matchId, 'OVERUNDER');
    });
})