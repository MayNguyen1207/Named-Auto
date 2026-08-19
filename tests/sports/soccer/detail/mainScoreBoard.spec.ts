import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/sports/soccer/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Tests that need API data', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;
    let data: any;

    test.beforeAll(async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        data = await response.json();
    })

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);
    });

    test('[Soccer] User can click the leagueName and leagueName is correct', async ({ page }) => {
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

    test('[Soccer] Team name and logo should be displayed', async () => {
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
                    const isFallback = src?.includes('default_away_team_logo');
                    if (!isFallback) {
                        expect(src).toContain(expectedSegment);
                    }
                }
            }
        });
    });

    test('[Soccer] Match time should be displayed correctly', async () => {
        const startDatetime = data.startDatetime;
        const date = new Date(startDatetime + '+09:00');

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const daysInKorean = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = daysInKorean[date.getDay()];

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const expectedMatchTime = `${month}.${day} (${dayOfWeek}) ${hours}:${minutes}`;

        await expect(soccerDetailPage.matchTime).toHaveText(expectedMatchTime);
    });

    test('[Soccer] Scores should be displayed correctly', async () => {
        const homeTeam = data.teams?.home;
        const awayTeam = data.teams?.away;

        const calculateTotalScore = (teamInfo: any) => {
            let total = 0;
            for (let i = 1; i <= 4; i++) {
                total += soccerDetailPage.getScoreByTeam(teamInfo, i);
            }
            return total.toString();
        };

        if (homeTeam) {
            const expectedHomeScore = calculateTotalScore(homeTeam);
            await expect(soccerDetailPage.homeTeamScore).toHaveText(expectedHomeScore);
        }

        if (awayTeam) {
            const expectedAwayScore = calculateTotalScore(awayTeam);
            await expect(soccerDetailPage.awayTeamScore).toHaveText(expectedAwayScore);
        }
    });

    test('[Soccer] PK result should be displayed separately', async () => {
        const homeTeam = data.teams?.home;
        const awayTeam = data.teams?.away;

        const homePkScore = soccerDetailPage.getScoreByTeam(homeTeam, 5);
        const awayPkScore = soccerDetailPage.getScoreByTeam(awayTeam, 5);
        const hasPk = homeTeam?.periodData?.some((p: any) => p.period === 5 || p.id === 5)
            || awayTeam?.periodData?.some((p: any) => p.period === 5 || p.id === 5);

        if (!hasPk) {
            test.skip(true, 'No PK period data available for this match');
            return;
        }

        await test.step('Verify pkScoreTxt label is visible', async () => {
            await expect(soccerDetailPage.pkScoreTxt).toBeVisible();
            await expect(soccerDetailPage.pkScoreTxt).toContainText('승부차기');
        });

        await test.step('Verify pkScore displays home - away format for period 5', async () => {
            const expectedPkScore = `${homePkScore}-${awayPkScore}`;
            await expect(soccerDetailPage.pkScore).toContainText(expectedPkScore);
        });

        await test.step('Verify winning team PK score has text-primary class', async () => {
            const homeScoreEl = soccerDetailPage.pkScore.locator('p').first();
            const awayScoreEl = soccerDetailPage.pkScore.locator('p').last();

            if (homePkScore > awayPkScore) {
                await expect(homeScoreEl).toHaveClass(/text-primary/);
                await expect(awayScoreEl).not.toHaveClass(/text-primary/);
            } else if (awayPkScore > homePkScore) {
                await expect(awayScoreEl).toHaveClass(/text-primary/);
                await expect(homeScoreEl).not.toHaveClass(/text-primary/);
            } else {
                await expect(homeScoreEl).not.toHaveClass(/text-primary/);
                await expect(awayScoreEl).not.toHaveClass(/text-primary/);
            }
        });
    });
});

test.describe('Tests that need mocking data', () => {
    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;
    let data: any;

    test.beforeAll(async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        data = await response.json();
    })

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
    });

    test('[Soccer] Match status should be displayed correctly', async ({ page }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17798');
        test.setTimeout(120000);

        const nowMs = Date.now();
        const toKSTString = (ms: number) => {
            const date = new Date(ms + 9 * 60 * 60 * 1000);
            return date.toISOString().replace('Z', '');
        };

        const baseGame = { ...data };

        const mockGames = [
            { case: '1', gameStatus: 'BREAK_TIME' },
            { case: '2', gameStatus: 'IN_PROGRESS', period: 1, realStartDateTime: toKSTString(nowMs - 15 * 60_000) },
            { case: '3', gameStatus: 'IN_PROGRESS', period: 1, realStartDateTime: toKSTString(nowMs - 50 * 60_000) },
            { case: '4', gameStatus: 'IN_PROGRESS', period: 2, realStartDateTime: toKSTString(nowMs - 15 * 60_000) },
            { case: '5', gameStatus: 'IN_PROGRESS', period: 2, realStartDateTime: toKSTString(nowMs - 50 * 60_000) },
            { case: '6', gameStatus: 'IN_PROGRESS', period: 3, realStartDateTime: toKSTString(nowMs - 10 * 60_000) },
            { case: '7', gameStatus: 'IN_PROGRESS', period: 5, realStartDateTime: toKSTString(nowMs - 10 * 60_000) },
            { case: '8', gameStatus: 'READY', realStartDateTime: toKSTString(nowMs + 120 * 1000) },
            { case: '9', gameStatus: 'READY', realStartDateTime: toKSTString(nowMs + 90 * 1000) },
            { case: '10', gameStatus: 'READY', realStartDateTime: toKSTString(nowMs - 1000) },
            { case: '11', gameStatus: 'READY', realStartDateTime: toKSTString(nowMs + 40 * 3600 * 1000) },
            { case: '12', gameStatus: 'FINAL' },
            { case: '13', gameStatus: 'POSTPONED' },
            { case: '14', gameStatus: 'CANCEL' },
            { case: '15', gameStatus: 'PENDING' },
            { case: '16', gameStatus: 'CUT' },
        ];

        for (let i = 0; i < mockGames.length; i++) {
            const mockData = mockGames[i];
            const game = { ...baseGame, ...mockData };
            const status = game.gameStatus;
            const testCase = game.case;

            await page.route(`**/v1.0/sports/soccer/games/${matchId}`, async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(game)
                });
            });

            await soccerDetailPage.navigateOdds(matchId);

            await test.step(`Case ${testCase}: Verify matchStatus (${status}${game.period ? `, period: ${game.period}` : ''})`, async () => {
                if (status === 'IN_PROGRESS') {
                    const expectedText = soccerDetailPage.getExpectedMatchStatusText(game);
                    if (["90'+", "45'+", '연장', '승부차기'].includes(expectedText)) {
                        await expect.soft(soccerDetailPage.matchStatus).toContainText(expectedText);
                    } else {
                        const actualText = (await soccerDetailPage.matchStatus.innerText()).trim();
                        const minuteMatch = actualText.match(/^(\d+)'$/);
                        expect.soft(minuteMatch, `Expected mm' format but got: "${actualText}"`).toBeTruthy();
                        const displayedMin = parseInt(minuteMatch![1]);
                        const expectedMin = parseInt(expectedText);
                        expect.soft(Math.abs(displayedMin - expectedMin)).toBeLessThanOrEqual(2);
                    }
                } else if (status === 'READY') {
                    const expectedText = soccerDetailPage.getExpectedMatchStatusText(game);
                    if (expectedText.endsWith('일 후') || expectedText === '00:00:00') {
                        await expect.soft(soccerDetailPage.matchStatus).toContainText(expectedText);
                    } else {
                        const actualText = (await soccerDetailPage.matchStatus.innerText()).trim();
                        const freshExpectedText = soccerDetailPage.getExpectedMatchStatusText(game);
                        if (freshExpectedText === '00:00:00') {
                            expect.soft(actualText, `Expected '00:00:00' or empty after countdown expired but got: "${actualText}"`)
                                .toMatch(/^(00:00:00)?$/);
                        } else {
                            const toSec = (t: string) => {
                                const parts = t.split(':');
                                if (parts.length === 3) {
                                    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                                } else {
                                    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                }
                            };
                            const expectedSec = toSec(freshExpectedText);
                            if (expectedSec < 3600) {
                                expect.soft(actualText, `Expected mm:ss format for time under 1 hour but got: "${actualText}"`).toMatch(/^\d{2}:\d{2}$/);
                            } else {
                                expect.soft(actualText, `Expected HH:mm:ss format for time 1 hour or more but got: "${actualText}"`).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                            }
                            expect.soft(Math.abs(toSec(actualText) - expectedSec)).toBeLessThanOrEqual(2);
                        }
                    }
                } else {
                    const expectedText = soccerDetailPage.getExpectedMatchStatusText(game);
                    if (expectedText) {
                        await expect.soft(soccerDetailPage.matchStatus).toContainText(expectedText);
                    }
                }
            });

            await page.unroute(`**/v1.0/sports/soccer/games/${matchId}`);
        }
    });

    test('[Soccer] LIVE button should be displayed for match that has livestream', async ({ page }) => {
        const videoLink = 'https://www.youtube.com/watch?v=Qh1TpY3VhRQ';
        const mockGame = {
            ...data,
            gameStatus: 'IN_PROGRESS',
            videoLink,
        };

        await page.route(`**/v1.0/sports/soccer/games/${matchId}`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockGame)
            });
        });

        await soccerDetailPage.navigateOdds(matchId);

        await test.step('liveBtn should be visible when game is IN_PROGRESS and has videoLink', async () => {
            await expect(soccerDetailPage.liveBtn).toBeVisible();
        });

        await test.step('Clicking liveBtn should open videoLink in a new tab', async () => {
            const [newPage] = await Promise.all([
                page.context().waitForEvent('page'),
                soccerDetailPage.liveBtn.click()
            ]);
            await newPage.waitForLoadState();
            expect(newPage.url()).toContain('watch?v=Qh1TpY3VhRQ');
        });
    })
})