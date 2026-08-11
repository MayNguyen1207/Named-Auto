import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Guest Flow', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);
    });

    test('[Soccer] User can click the leagueName and leagueName is correct', async ({ request, page, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const leagueName = data.league.shortName;

        await test.step('Verify that leagueName is correct', async () => {
            await expect(soccerDetailPage.leagueName).toHaveText(leagueName);
        });

        await test.step('Click the leagueName and verify the URL', async () => {
            await soccerDetailPage.leagueName.click();
            const searchParams = new URLSearchParams({ search: leagueName });
            const regexSearch = searchParams.toString().replace(/\+/g, '\\+');
            await expect(page).toHaveURL(new RegExp(`/scorecenter/soccer.*${regexSearch}`));
        });
    });

    test('[Soccer] User can open the match in new window', async ({ page }) => {
        let newPage: any;

        await expect(async () => {
            const pagePromise = page.context().waitForEvent('page', { timeout: 1500 });
            await soccerDetailPage.openNewWindow.click({ force: true });
            newPage = await pagePromise;
            expect(newPage).toBeTruthy();
        }).toPass({ intervals: [1000], timeout: 10000 });

        await newPage.waitForLoadState();
        await expect(newPage).toHaveURL(new RegExp(`/match/soccer/${matchId}`));
    });

    test('[Soccer] Team name and logo should be displayed', async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const homeTeam = data.teams?.home;
        const awayTeam = data.teams?.away;

        await test.step('Verify home team', async () => {
            if (homeTeam) {
                await expect(soccerDetailPage.homeTeamName).toContainText(homeTeam.name);

                if (homeTeam.seasonTeamRanking != null) {
                    await expect(soccerDetailPage.homeTeamRank).toHaveText(`${homeTeam.seasonTeamRanking}위`);
                    await expect(soccerDetailPage.homeTeamRank).toBeVisible();
                } else {
                    await expect(soccerDetailPage.homeTeamRank).toBeHidden();
                }

                if (homeTeam.imgPath) {
                    const src = await soccerDetailPage.homeTeamLogo.getAttribute('src');
                    const expectedSegment = homeTeam.imgPath.split('/').pop()!.split('_')[0];
                    const isFallback = src?.includes('default_home_team_logo');
                    if (!isFallback) {
                        expect(src).toContain(expectedSegment);
                    }
                }
            }
        });

        await test.step('Verify away team', async () => {
            if (awayTeam) {
                await expect(soccerDetailPage.awayTeamName).toContainText(awayTeam.name);

                if (awayTeam.seasonTeamRanking != null) {
                    await expect(soccerDetailPage.awayTeamRank).toHaveText(`${awayTeam.seasonTeamRanking}위`);
                    await expect(soccerDetailPage.awayTeamRank).toBeVisible();
                } else {
                    await expect(soccerDetailPage.awayTeamRank).toBeHidden();
                }

                if (awayTeam.imgPath) {
                    const src = await soccerDetailPage.awayTeamLogo.getAttribute('src');
                    const expectedSegment = awayTeam.imgPath.split('/').pop()!.split('_')[0];
                    const isFallback = src?.includes('default_away_team_logo') || src?.includes('default_home_team_logo');
                    if (!isFallback) {
                        expect(src).toContain(expectedSegment);
                    }
                }
            }
        });
    });

    test('[Soccer] Guest can like and unlike the match', async ({ page }) => {
        await expect(async () => {
            await soccerDetailPage.favBtn.click();
            await expect(soccerDetailPage.favBtn).toBeHidden();
            await expect(soccerDetailPage.removeFavBtn).toBeVisible();
        }).toPass({ intervals: [1000], timeout: 10000 });

        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(soccerDetailPage.removeFavBtn).toBeVisible();

        await soccerDetailPage.removeFavBtn.click();
        await expect(soccerDetailPage.removeFavBtn).toBeHidden();
        await expect(soccerDetailPage.favBtn).toBeVisible();
    });

    test('[Soccer] Score board should be displayed correctly', async ({ request, sportsApiBaseURL }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17695');

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const homeTeam = data.teams?.home;
        const periods = homeTeam?.periodData || [];
        const hasPeriod = (p: number) => periods.some((period: any) => period.period === p || period.id === p);

        await test.step('Verify table header', async () => {
            const expectedHeaders = ['전반', '후반'];

            if (hasPeriod(3) && hasPeriod(4)) {
                expectedHeaders.push('연장1', '연장2');
            }

            if (hasPeriod(5)) {
                expectedHeaders.push('슛아웃');
            }

            const headerLocators = soccerDetailPage.scoreTableHeader.locator('p');
            const headerTexts = await headerLocators.allTextContents();
            expect(headerTexts).toEqual(expectedHeaders);

            await expect(soccerDetailPage.scoreTableHeader.locator('> div').last()).toContainText('합계');
        });

        const teamsToVerify = [
            { name: 'home', data: data.teams?.home, rowLocator: soccerDetailPage.scoreTableHomeRow },
            { name: 'away', data: data.teams?.away, rowLocator: soccerDetailPage.scoreTableAwayRow }
        ];

        for (const team of teamsToVerify) {
            await test.step(`Verify ${team.name} team row`, async () => {
                const teamData = team.data;
                expect(teamData).toBeDefined();
                const columns = team.rowLocator.locator('> div');

                const firstCol = columns.first();
                await expect(firstCol).toContainText(teamData.name);

                if (teamData.imgPath) {
                    const src = await firstCol.locator('img').getAttribute('src');
                    const expectedSegment = teamData.imgPath.split('/').pop()!.split('_')[0];
                    const isFallback = src?.includes('default_away_team_logo') || src?.includes('default_home_team_logo');
                    if (!isFallback) {
                        expect(src).toContain(expectedSegment);
                    }
                }

                const getScoreByTeam = (teamInfo: any, p: number) => {
                    const periods = teamInfo?.periodData || [];
                    const pd = periods.find((period: any) => period.period === p || period.id === p);
                    return pd ? parseInt(pd.score) || 0 : 0;
                };

                const opponentData = team.name === 'home' ? data.teams?.away : data.teams?.home;

                const periodsList = [1, 2];
                if (hasPeriod(3) && hasPeriod(4)) {
                    periodsList.push(3, 4);
                }

                let totalScore = 0;
                let oppTotalScore = 0;

                for (let i = 0; i < periodsList.length; i++) {
                    const p = periodsList[i];
                    const myScore = getScoreByTeam(teamData, p);
                    const oppScore = getScoreByTeam(opponentData, p);

                    totalScore += myScore;
                    oppTotalScore += oppScore;

                    const cell = columns.nth(i + 1);
                    await expect(cell).toContainText(myScore.toString());
                }

                let nextColIndex = periodsList.length + 1;

                if (hasPeriod(5)) {
                    const myScore = getScoreByTeam(teamData, 5);
                    const oppScore = getScoreByTeam(opponentData, 5);

                    const cell = columns.nth(nextColIndex);
                    await expect(cell).toContainText(myScore.toString());

                    nextColIndex++;
                }

                const totalCell = columns.last();
                await expect(totalCell).toContainText(totalScore.toString());

                if (totalScore > oppTotalScore) {
                    await expect(totalCell).toHaveClass(/text-primary/);
                } else {
                    await expect(totalCell).toHaveClass(/text-light-grey/);
                }
            });
        }
    });
})