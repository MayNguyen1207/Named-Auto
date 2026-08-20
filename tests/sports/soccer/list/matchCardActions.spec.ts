import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/sports/soccer/SoccerListPage';
import matchData from '../../../../data-test/match-list-data.json';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] User can click Play button to view livestream', async ({ page }) => {
        const { baseGame, mkTeam } = soccerListPage.getMockHelpers();
        const mockGame = {
            id: 1,
            ...baseGame,
            gameStatus: 'IN_PROGRESS',
            videoLink: 'https://www.youtube.com/watch?v=Qh1TpY3VhRQ',
            teams: { home: mkTeam('Home', 1), away: mkTeam('Away', 2) }
        };

        await page.route('**/v1.0/sports/soccer/today-games*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([mockGame])
            });
        });

        await soccerListPage.todayBtn.click();
        await page.waitForTimeout(1000);

        const card = soccerListPage.matchCards.first();
        const { playBtn } = soccerListPage.getMatchCardElements(card);

        await expect(playBtn).toBeVisible({ timeout: 10000 });

        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            playBtn.click()
        ]);

        await newPage.waitForLoadState();
        expect(newPage.url()).toContain('watch?v=Qh1TpY3VhRQ');
    });

    const broadcastCases = [
        { desc: 'User can click Broadcast button to see broadcast content', id: matchData.broadCast.haveData, expectedText: null },
        { desc: 'No broadcast content text should be displayed', id: matchData.broadCast.noData, expectedText: '경기 데이터가 아직 없습니다.' },
    ];
    for (const testCase of broadcastCases) {
        test(`[Soccer] ${testCase.desc}`, async ({ page }) => {
            const { baseGame, mkTeam } = soccerListPage.getMockHelpers();
            const mockGame = {
                id: testCase.id,
                ...baseGame,
                gameStatus: 'IN_PROGRESS',
                teams: { home: mkTeam('Home', 1), away: mkTeam('Away', 2) }
            };

            await page.route('**/v1.0/sports/soccer/today-games*', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([mockGame])
                });
            });

            await soccerListPage.todayBtn.click();
            await page.waitForTimeout(1000);

            const card = soccerListPage.matchCards.first();
            const { broadCastBtn } = soccerListPage.getMatchCardElements(card);

            await broadCastBtn.click();
            if (testCase.expectedText) {
                await expect(soccerListPage.broadCastContainer).toContainText(testCase.expectedText);
            } else {
                await expect(soccerListPage.broadCastContainer).toBeVisible();
            }
        });
    }

    test('[Soccer] User can open the match in new window', async ({ page }) => {
        const card = soccerListPage.matchCards.first();
        const matchLink = await card.locator('a').first().getAttribute('href');
        const { openMatchBtn } = soccerListPage.getMatchCardElements(card);

        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            openMatchBtn.click()
        ]);

        await newPage.waitForLoadState();
        expect(newPage.url()).toContain(matchLink!);
    });

    test('[Soccer] User can click to open the match', async ({ page }) => {
        const card = soccerListPage.matchCards.first();
        const matchLink = await card.locator('a').first().getAttribute('href');

        await card.click();
        await expect(page).toHaveURL(`${matchLink}`);
    })
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] Admin can open the match in new window', async ({ page }) => {
        const card = soccerListPage.matchCards.first();
        const matchLink = await card.locator('a').first().getAttribute('href');

        const { threeDotsBtn } = soccerListPage.getMatchCardElements(card);
        await threeDotsBtn.click();
        await page.waitForTimeout(500);

        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            soccerListPage.adminOpenMatchBtn.click()
        ]);

        await newPage.waitForLoadState();
        expect(newPage.url()).toContain(matchLink!);
    });

    test('[Soccer] Admin can open Caster page in new window', async ({ page }) => {
        const card = soccerListPage.matchCards.first();
        const matchLink = await card.locator('a').first().getAttribute('href');
        const matchId = matchLink?.match(/\/match\/soccer\/(\d+)/)?.[1];

        const { threeDotsBtn } = soccerListPage.getMatchCardElements(card);
        await threeDotsBtn.click();
        await page.waitForTimeout(500);

        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            soccerListPage.adminCasterBtn.click()
        ]);
        expect(newPage.url()).toContain(`caster.named.net/new_score_center/game_form/game_form.html?mode=update&gameId=${matchId}&sportsId=1`);
    });
})