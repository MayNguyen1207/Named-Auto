import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] User can search leagues and teams', async ({ page, request, sportsApiBaseURL }) => {
        const KEYWORD = 'a';

        const response = await request.get(
            `${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`
        );
        const games: any[] = soccerListPage.extractGames(await response.json());

        const leagueMap = new Map<number, { shortName: string; imgPath: string }>();
        const teamMap = new Map<number, { name: string; imgPath: string }>();

        for (const game of games) {
            const league = game.league;
            if (league && league.shortName?.includes(KEYWORD) && !leagueMap.has(league.id)) {
                leagueMap.set(league.id, {
                    shortName: league.shortName,
                    imgPath: league.nation?.imgPath ?? '',
                });
            }
            for (const side of ['home', 'away'] as const) {
                const team = game.teams?.[side];
                if (team && team.name?.includes(KEYWORD) && !teamMap.has(team.id)) {
                    teamMap.set(team.id, {
                        name: team.name,
                        imgPath: team.imgPath ?? '',
                    });
                }
            }
        }

        const MAX_RESULTS = 5;
        const expectedLeagues = [...leagueMap.values()].slice(0, MAX_RESULTS);
        const expectedTeams = [...teamMap.values()].slice(0, MAX_RESULTS);

        await expect(async () => {
            await soccerListPage.searchInput.fill(KEYWORD);
            await expect(soccerListPage.searchInput).toHaveValue(KEYWORD, { timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await page.waitForTimeout(500);

        if (expectedLeagues.length > 0) {
            await test.step('Verify league search results', async () => {
                await expect(soccerListPage.searchLeagueGroup).toBeVisible();
                await expect(soccerListPage.searchLeagueHeader).toBeVisible();
                await expect(soccerListPage.searchLeagueHeader).toContainText('리그');

                const leagueCount = await soccerListPage.searchLeagueResults.count();
                expect(leagueCount).toBeLessThanOrEqual(MAX_RESULTS);

                for (let i = 0; i < leagueCount; i++) {
                    const resultItem = soccerListPage.searchLeagueResults.nth(i);
                    const itemText = await resultItem.innerText();

                    const highlighted = resultItem.locator('span.text-primary');
                    const highlightCount = await highlighted.count();
                    expect(highlightCount).toBeGreaterThan(0);
                    for (let j = 0; j < highlightCount; j++) {
                        await expect(highlighted.nth(j)).toBeVisible();
                        await expect(highlighted.nth(j)).toHaveText(new RegExp(KEYWORD, 'i'));
                    }

                    const matchedLeague = expectedLeagues.find(l => itemText.includes(l.shortName));
                    if (matchedLeague && matchedLeague.imgPath) {
                        const img = resultItem.locator('img');
                        const src = await img.getAttribute('src');
                        const expectedSegment = matchedLeague.imgPath.split('/').pop()!.split('_')[0];
                        const isFallback = src?.includes('images/sports/common/default_home_team_logo.webp');
                        if (!isFallback) {
                            expect(src).toContain(expectedSegment);
                        }
                    }
                }
            });
        } else {
            await expect(soccerListPage.searchLeagueGroup).not.toBeVisible();
        }


        if (expectedTeams.length > 0) {
            await test.step('Verify team search results', async () => {
                await expect(soccerListPage.searchTeamGroup).toBeVisible();
                await expect(soccerListPage.searchTeamHeader).toBeVisible();
                await expect(soccerListPage.searchTeamHeader).toContainText('팀');

                const teamCount = await soccerListPage.searchTeamResults.count();
                expect(teamCount).toBeLessThanOrEqual(MAX_RESULTS);

                for (let i = 0; i < teamCount; i++) {
                    const resultItem = soccerListPage.searchTeamResults.nth(i);
                    const itemText = await resultItem.innerText();

                    const highlighted = resultItem.locator('span.text-primary');
                    const highlightCount = await highlighted.count();
                    expect(highlightCount).toBeGreaterThan(0);
                    for (let j = 0; j < highlightCount; j++) {
                        await expect(highlighted.nth(j)).toBeVisible();
                        await expect(highlighted.nth(j)).toHaveText(new RegExp(KEYWORD, 'i'));
                    }

                    const matchedTeam = expectedTeams.find(t => itemText.includes(t.name));
                    if (matchedTeam && matchedTeam.imgPath) {
                        const img = resultItem.locator('img');
                        const src = await img.getAttribute('src');
                        const expectedSegment = matchedTeam.imgPath.split('/').pop()!.split('_')[0];
                        const isFallback = src?.includes('images/sports/common/default_home_team_logo.webp');
                        if (!isFallback) {
                            expect(src).toContain(expectedSegment);
                        }
                    }
                }
            });
        } else {
            await expect(soccerListPage.searchTeamGroup).not.toBeVisible();
        }

        if (expectedLeagues.length === 0 && expectedTeams.length === 0) {
            await expect(soccerListPage.noResultTxt).toBeVisible();
        }
    });

    test('[Soccer] League results list should be displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const KEYWORD = 'a';
        await expect(async () => {
            await soccerListPage.searchInput.fill(KEYWORD);
            await expect(soccerListPage.searchInput).toHaveValue(KEYWORD, { timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await page.waitForTimeout(500);

        const firstLeagueResult = soccerListPage.searchLeagueResults.nth(0);
        const selectedLeagueName = (await firstLeagueResult.innerText()).trim();
        await firstLeagueResult.click();

        await expect(soccerListPage.searchInput).toHaveValue(selectedLeagueName);
        await expect(soccerListPage.searchList).not.toBeVisible();

        await page.waitForTimeout(1000);

        const matchCards = soccerListPage.matchCards;
        const count = await matchCards.count();
        const displayedMatchIds: number[] = [];
        const limit = Math.min(count, 5);

        for (let i = 0; i < limit; i++) {
            const card = matchCards.nth(i);
            const aTag = card.locator('a').first();
            const href = await aTag.getAttribute('href');
            if (href) {
                const match = href.match(/\/match\/soccer\/(\d+)/);
                if (match) {
                    displayedMatchIds.push(parseInt(match[1], 10));
                }
            }
        }

        const response = await request.get(
            `${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`
        );
        const games: any[] = soccerListPage.extractGames(await response.json());

        const expectedMatchIds = games
            .filter(game => game.league?.shortName === selectedLeagueName)
            .map(game => game.id);

        for (const id of displayedMatchIds) {
            expect(expectedMatchIds).toContain(id);
        }
    });

    test('[Soccer] Team results list should be displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const KEYWORD = 'a';
        await expect(async () => {
            await soccerListPage.searchInput.fill(KEYWORD);
            await expect(soccerListPage.searchInput).toHaveValue(KEYWORD, { timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await page.waitForTimeout(500);

        const firstTeamResult = soccerListPage.searchTeamResults.nth(0);
        const selectedTeamName = (await firstTeamResult.innerText()).trim();
        await firstTeamResult.click();

        await expect(soccerListPage.searchInput).toHaveValue(selectedTeamName);
        await expect(soccerListPage.searchList).not.toBeVisible();

        await page.waitForTimeout(1000);

        const matchCards = soccerListPage.matchCards;
        const count = await matchCards.count();
        const displayedMatchIds: number[] = [];
        const limit = Math.min(count, 5);

        for (let i = 0; i < limit; i++) {
            const card = matchCards.nth(i);
            const aTag = card.locator('a').first();
            const href = await aTag.getAttribute('href');
            if (href) {
                const match = href.match(/\/match\/soccer\/(\d+)/);
                if (match) {
                    displayedMatchIds.push(parseInt(match[1], 10));
                }
            }
        }

        const response = await request.get(
            `${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`
        );
        const games: any[] = soccerListPage.extractGames(await response.json());

        const expectedMatchIds = games
            .filter(game => game.teams?.home?.name === selectedTeamName || game.teams?.away?.name === selectedTeamName)
            .map(game => game.id);

        for (const id of displayedMatchIds) {
            expect(expectedMatchIds).toContain(id);
        }
    });

    test('[Soccer] User can clear the keyword', async ({ page }) => {
        const KEYWORD = 'abcdefgh';
        await expect(async () => {
            await soccerListPage.searchInput.fill(KEYWORD);
            await expect(soccerListPage.searchInput).toHaveValue(KEYWORD, { timeout: 1000 });
        }).toPass({ timeout: 10000 });

        await soccerListPage.clearBtn.click();
        await expect(soccerListPage.searchInput).not.toHaveValue(KEYWORD);
    });

    test('[Soccer] No result text should be shown  when there is no result', async ({ page }) => {
        const KEYWORD = 'abcdefgh';
        await expect(async () => {
            await soccerListPage.searchInput.fill(KEYWORD);
            await expect(soccerListPage.searchInput).toHaveValue(KEYWORD, { timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await page.waitForTimeout(500);
        await expect(soccerListPage.noResultTxt).toBeVisible();
    })
})