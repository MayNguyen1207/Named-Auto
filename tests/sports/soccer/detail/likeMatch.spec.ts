import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/sports/soccer/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test('[Soccer] Star button should be hidden for the match older than 15 days', async ({ page }) => {
    const matchId = matchData.matchLink.noStarMatch
    const soccerDetailPage = new SoccerDetailPage(page);
    await soccerDetailPage.navigateOdds(matchId);

    await expect(soccerDetailPage.favBtn).toBeHidden();
    await expect(soccerDetailPage.removeFavBtn).toBeHidden();
});

test.describe('Like the match', () => {
    let soccerDetailPage: SoccerDetailPage;
    let matchId: any;

    test.beforeAll(async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
        expect(response.ok()).toBeTruthy();
        const games = await response.json();

        const readyGame = games.find((game: any) => game.gameStatus === 'READY');
        expect(readyGame, 'No READY match found').toBeDefined();
        matchId = readyGame.id;
    });

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);
    });

    test('[Soccer] Guest can like and unlike the match', async ({ page }) => {
        await expect(async () => {
            await soccerDetailPage.favBtn.click();
            await expect(soccerDetailPage.favBtn).toBeHidden();
            await expect(soccerDetailPage.removeFavBtn).toBeVisible();
        }).toPass({ intervals: [1000], timeout: 10000 });

        await page.reload();
        await expect(soccerDetailPage.removeFavBtn).toBeVisible();

        await soccerDetailPage.removeFavBtn.click();
        await expect(soccerDetailPage.removeFavBtn).toBeHidden();
        await expect(soccerDetailPage.favBtn).toBeVisible();
    });

    const roles = [
        { name: 'Normal User', storageState: 'playwright/.auth/user.json' },
        { name: 'Admin', storageState: 'playwright/.auth/admin.json' }
    ];
    for (const role of roles) {
        test.describe(`${role.name} Flow`, () => {
            test.use({ storageState: role.storageState });

            test(`[Soccer] ${role.name} can like and unlike the match`, async ({ page, request, apiBaseURL }) => {
                const cookies = await page.context().cookies();
                const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
                const headers: Record<string, string> = sessionCookie ? { 'NAMED-SESSION': sessionCookie.value } : {};

                await test.step('Like the match', async () => {
                    await expect(async () => {
                        await soccerDetailPage.favBtn.click();
                        await expect(soccerDetailPage.favBtn).toBeHidden();
                        await expect(soccerDetailPage.removeFavBtn).toBeVisible();
                    }).toPass({ intervals: [1000], timeout: 10000 });

                    await page.reload();
                    await expect(soccerDetailPage.removeFavBtn).toBeVisible();
                });

                await test.step('Verify that liked matches are saved in DB via API', async () => {
                    const response = await request.get(`${apiBaseURL}/sport/interest-games?sports_ids=1`, { headers });
                    expect(response.ok()).toBeTruthy();
                    const body = await response.json();
                    const responseGameIds = body.soccer || [];

                    expect(responseGameIds).toContain(matchId);
                });

                await test.step('Unlike the match', async () => {
                    await soccerDetailPage.removeFavBtn.click();
                    await expect(soccerDetailPage.removeFavBtn).toBeHidden();
                    await expect(soccerDetailPage.favBtn).toBeVisible();
                });

                await test.step('Verify that liked matches are removed from DB via API', async () => {
                    await expect.poll(async () => {
                        const response = await request.get(`${apiBaseURL}/sport/interest-games?sports_ids=1`, { headers });
                        expect(response.ok()).toBeTruthy();
                        const body = await response.json();
                        return body.soccer || [];
                    }, { intervals: [1000], timeout: 15000 }).not.toContain(matchId);
                });
            })
        })
    }
})