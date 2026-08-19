import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/sports/soccer/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] Each match card should display correct information in vertical view', async ({ page, request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
        const games: any[] = soccerListPage.extractGames(await response.json());
        for (let i = 0; i < 5; i++) {
            const card = soccerListPage.matchCards.nth(i);
            const {
                matchTime, matchChatCount, matchEvent,
                homeTeam, homeTeamLogo, homeTeamRank,
                awayTeam, awayTeamLogo, awayTeamRank,
                playBtn, favBtn, broadCastBtn, openMatchBtn,
            } = soccerListPage.getMatchCardElements(card);

            // Read the team names from the card to find the matching game in the API response
            const homeName = (await homeTeam.innerText()).trim();
            const awayName = (await awayTeam.innerText()).trim();

            const game = games.find(g => g.teams?.home?.name === homeName && g.teams?.away?.name === awayName);
            expect(game, `API contains data for match: ${homeName} vs ${awayName}`).toBeDefined();

            const status: string = game.gameStatus;

            // ── matchTime ────────────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: matchTime (startDatetime → HH:mm local)`, async () => {
                const raw: string = game.startDatetime; // e.g. "2026-07-27T20:00:00"
                const kstDate = new Date(raw + '+09:00'); // API returns startDatetime in Seoul time (KST, UTC+9)
                const expectedTime = kstDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
                await expect.soft(matchTime.filter({ has: page.locator('visible=true') })).toHaveText(expectedTime);
            });

            // ── matchChatCount ───────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: matchChatCount (cheerCount visibility)`, async () => {
                const cheerCount: number = game.cheerCount ?? 0;
                if (cheerCount > 0) {
                    await expect.soft(matchChatCount.filter({ has: page.locator('visible=true') })).toBeVisible();
                    await expect.soft(matchChatCount.filter({ has: page.locator('visible=true') })).toContainText(String(cheerCount));
                } else {
                    await expect.soft(matchChatCount).not.toBeVisible();
                }
            });

            // ── matchEvent ───────────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: matchEvent (broadcast.playText)`, async () => {
                const playText: string | undefined = game.broadcast?.playText;
                if (playText) {
                    await expect.soft(matchEvent).toBeVisible();
                    await expect.soft(matchEvent).toContainText(playText);
                } else {
                    await expect.soft(matchEvent).not.toBeVisible();
                }
            });

            // ── homeTeam ─────────────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: homeTeam name`, async () => {
                await expect.soft(homeTeam).toContainText(game.teams.home.name);
            });

            await test.step(`Card ${i + 1}: homeTeamLogo`, async () => {
                const imgPath: string | undefined = game.teams?.home?.imgPath;
                const src = await homeTeamLogo.getAttribute('src');
                const isFallback = src?.includes('default_home_team_logo');
                if (imgPath && !isFallback) {
                    const segment = imgPath.split('/').pop()!.split('_')[0];
                    expect.soft(src).toContain(segment);
                } else {
                    expect.soft(src).toContain('default_home_team_logo');
                }
            });

            await test.step(`Card ${i + 1}: homeTeamRank ({rank}위 or hidden)`, async () => {
                const rank = game.teams?.home?.seasonTeamRanking;
                if (rank == null) {
                    await expect.soft(homeTeamRank).not.toBeVisible();
                } else {
                    await expect.soft(homeTeamRank).toBeVisible();
                    await expect.soft(homeTeamRank).toHaveText(`${rank}위`);
                }
            });

            // ── awayTeam ─────────────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: awayTeam name`, async () => {
                await expect.soft(awayTeam).toContainText(game.teams.away.name);
            });

            await test.step(`Card ${i + 1}: awayTeamLogo`, async () => {
                const imgPath: string | undefined = game.teams?.away?.imgPath;
                const src = await awayTeamLogo.getAttribute('src');
                const isFallback = src?.includes('default_away_team_logo');
                if (imgPath && !isFallback) {
                    const segment = imgPath.split('/').pop()!.split('_')[0];
                    expect.soft(src).toContain(segment);
                } else {
                    expect.soft(src).toContain('default_away_team_logo');
                }
            });

            await test.step(`Card ${i + 1}: awayTeamRank ({rank}위 or hidden)`, async () => {
                const rank = game.teams?.away?.seasonTeamRanking;
                if (rank == null) {
                    await expect.soft(awayTeamRank).not.toBeVisible();
                } else {
                    await expect.soft(awayTeamRank).toBeVisible();
                    await expect.soft(awayTeamRank).toHaveText(`${rank}위`);
                }
            });

            // ── Buttons ──────────────────────────────────────────────────────────
            await test.step(`Card ${i + 1}: playBtn (visible when IN_PROGRESS + videoLink)`, async () => {
                if (status === 'IN_PROGRESS' && game.videoLink) {
                    await expect.soft(playBtn).toBeVisible();
                } else {
                    await expect.soft(playBtn).not.toBeVisible();
                }
            });

            await test.step(`Card ${i + 1}: favBtn (always visible)`, async () => {
                await expect.soft(favBtn).toBeVisible();
            });

            await test.step(`Card ${i + 1}: broadCastBtn (visible when IN_PROGRESS or FINAL)`, async () => {
                if (status === 'IN_PROGRESS' || status === 'FINAL' || status === 'BREAK_TIME') {
                    await expect.soft(broadCastBtn).toBeVisible();
                } else {
                    await expect.soft(broadCastBtn).not.toBeVisible();
                }
            });

            await test.step(`Card ${i + 1}: openMatchBtn (always visible)`, async () => {
                await expect.soft(openMatchBtn).toBeVisible();
            });
        }
    });

    test('[Soccer] matchStatus should display correctly', async ({ page }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17668, https://vincoholdinglp.atlassian.net/browse/NOS-17670');
        const { nowMs, toKSTString, baseGame, mkTeam } = soccerListPage.getMockHelpers();

        const mockGames: any[] = [
            { id: 4, ...baseGame, gameStatus: 'BREAK_TIME', teams: { home: mkTeam('T7', 107), away: mkTeam('T8', 108) } },
            { id: 8, ...baseGame, gameStatus: 'IN_PROGRESS', period: 1, realStartDateTime: toKSTString(nowMs - 15 * 60_000), teams: { home: mkTeam('T15', 115), away: mkTeam('T16', 116) } },
            { id: 9, ...baseGame, gameStatus: 'IN_PROGRESS', period: 1, realStartDateTime: toKSTString(nowMs - 50 * 60_000), teams: { home: mkTeam('T17', 117), away: mkTeam('T18', 118) } },
            { id: 10, ...baseGame, gameStatus: 'IN_PROGRESS', period: 2, realStartDateTime: toKSTString(nowMs - 15 * 60_000), teams: { home: mkTeam('T19', 119), away: mkTeam('T20', 120) } },
            { id: 11, ...baseGame, gameStatus: 'IN_PROGRESS', period: 2, realStartDateTime: toKSTString(nowMs - 50 * 60_000), teams: { home: mkTeam('T21', 121), away: mkTeam('T22', 122) } },
            { id: 12, ...baseGame, gameStatus: 'IN_PROGRESS', period: 3, realStartDateTime: toKSTString(nowMs - 10 * 60_000), teams: { home: mkTeam('T23', 123), away: mkTeam('T24', 124) } },
            { id: 13, ...baseGame, gameStatus: 'IN_PROGRESS', period: 5, realStartDateTime: toKSTString(nowMs - 10 * 60_000), teams: { home: mkTeam('T25', 125), away: mkTeam('T26', 126) } },
            { id: 5, ...baseGame, gameStatus: 'READY', teams: { home: mkTeam('T9', 109), away: mkTeam('T10', 110) } },
            { id: 6, ...baseGame, gameStatus: 'READY', realStartDateTime: toKSTString(nowMs + 120 * 1000), teams: { home: mkTeam('T11', 111), away: mkTeam('T12', 112) } },
            { id: 7, ...baseGame, gameStatus: 'READY', realStartDateTime: toKSTString(nowMs - 1000), teams: { home: mkTeam('T13', 113), away: mkTeam('T14', 114) } },
            { id: 1, ...baseGame, gameStatus: 'FINAL', teams: { home: mkTeam('T1', 101), away: mkTeam('T2', 102) } },
            { id: 2, ...baseGame, gameStatus: 'POSTPONED', teams: { home: mkTeam('T3', 103), away: mkTeam('T4', 104) } },
            { id: 3, ...baseGame, gameStatus: 'CANCEL', teams: { home: mkTeam('T5', 105), away: mkTeam('T6', 106) } },
            { id: 14, ...baseGame, gameStatus: 'PENDING', teams: { home: mkTeam('T27', 127), away: mkTeam('T28', 128) } },
            { id: 15, ...baseGame, gameStatus: 'CUT', teams: { home: mkTeam('T29', 129), away: mkTeam('T30', 130) } },
        ];

        await page.route('**/v1.0/sports/soccer/today-games*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockGames)
            });
        });

        await soccerListPage.todayBtn.click();
        await page.waitForTimeout(3000);

        const cards = soccerListPage.matchCards;
        
        // Scroll down to render all cards in the virtual list
        await expect(async () => {
            await page.mouse.wheel(0, 500);
            await expect(cards).toHaveCount(mockGames.length, { timeout: 1000 });
        }).toPass({ timeout: 10000 });

        for (let i = 0; i < mockGames.length; i++) {
            const card = cards.nth(i);
            const { matchStatus } = soccerListPage.getMatchCardElements(card);
            const game = mockGames[i];
            const status = game.gameStatus;

            await test.step(`Card ${i + 1}: matchStatus (${status}${game.period ? `, period: ${game.period}` : ''})`, async () => {
                if (status === 'IN_PROGRESS') {
                    const expectedText = soccerListPage.getExpectedMatchStatusText(game);
                    if (["90'+", "45'+", '연장', '승부차기'].includes(expectedText)) {
                        await expect.soft(matchStatus).toContainText(expectedText);
                    } else {
                        const actualText = (await matchStatus.innerText()).trim();
                        const minuteMatch = actualText.match(/^(\d+)'$/);
                        expect.soft(minuteMatch, `Expected mm' format but got: "${actualText}"`).toBeTruthy();
                        const displayedMin = parseInt(minuteMatch![1]);
                        const expectedMin = parseInt(expectedText);
                        expect.soft(Math.abs(displayedMin - expectedMin)).toBeLessThanOrEqual(2);
                    }
                } else if (status === 'READY' && game.realStartDateTime) {
                    const expectedText = soccerListPage.getExpectedMatchStatusText(game);
                    if (expectedText === '대기 중') {
                        await expect.soft(matchStatus).toContainText('대기 중');
                    } else {
                        const actualText = (await matchStatus.innerText()).trim();
                        expect.soft(actualText, `Expected mm:ss countdown format but got: "${actualText}"`).toMatch(/^\d{2}:\d{2}$/);
                        const toSec = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
                        expect.soft(Math.abs(toSec(actualText) - toSec(expectedText))).toBeLessThanOrEqual(2);
                    }
                } else {
                    const expectedText = soccerListPage.getExpectedMatchStatusText(game);
                    if (expectedText) {
                        await expect.soft(matchStatus).toContainText(expectedText);
                    }
                }
            });
        }
    });

    test('[Soccer] Team scores should display correctly for various match states with mocked API', async ({ page }) => {
        const { baseGame, mkTeam } = soccerListPage.getMockHelpers();
        const mockGames: any[] = [
            { id: 7, ...baseGame, gameStatus: 'BREAK_TIME', teams: { home: mkTeam('T13', 113, [{ period: 1, score: 2 }]), away: mkTeam('T14', 114, [{ period: 1, score: 0 }]) } },
            { id: 2, ...baseGame, gameStatus: 'IN_PROGRESS', period: 1, teams: { home: mkTeam('T3', 103, [{ period: 1, score: 1 }]), away: mkTeam('T4', 104, [{ period: 1, score: 0 }]) } },
            { id: 3, ...baseGame, gameStatus: 'IN_PROGRESS', period: 5, teams: { home: mkTeam('T5', 105, [{ period: 1, score: 1 }, { period: 2, score: 1 }, { period: 5, score: 4 }]), away: mkTeam('T6', 106, [{ period: 1, score: 2 }, { period: 2, score: 0 }, { period: 5, score: 5 }]) } },
            { id: 1, ...baseGame, gameStatus: 'READY', teams: { home: mkTeam('T1', 101), away: mkTeam('T2', 102) } },
            { id: 4, ...baseGame, gameStatus: 'FINAL', teams: { home: mkTeam('T7', 107, [{ period: 1, score: 0 }, { period: 2, score: 3 }]), away: mkTeam('T8', 108, [{ period: 1, score: 0 }, { period: 2, score: 0 }]) } },
            { id: 8, ...baseGame, gameStatus: 'POSTPONED', teams: { home: mkTeam('T15', 115, [{ period: 1, score: 1 }]), away: mkTeam('T16', 116, [{ period: 1, score: 1 }]) } },
            { id: 5, ...baseGame, gameStatus: 'CANCEL', teams: { home: mkTeam('T9', 109), away: mkTeam('T10', 110) } },
            { id: 6, ...baseGame, gameStatus: 'PENDING', teams: { home: mkTeam('T11', 111, [{ period: 1, score: 1 }]), away: mkTeam('T12', 112, [{ period: 1, score: 1 }]) } },
        ];

        await page.route('**/v1.0/sports/soccer/today-games*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockGames)
            });
        });

        await soccerListPage.todayBtn.click();
        await page.waitForTimeout(3000);

        const cards = soccerListPage.matchCards;
        await expect(cards).toHaveCount(mockGames.length);

        for (let i = 0; i < mockGames.length; i++) {
            const card = cards.nth(i);
            const { homeTeamMainScore, homeTeamPenaltyScore, awayTeamMainScore, awayTeamPenaltyScore } = soccerListPage.getMatchCardElements(card);
            const game = mockGames[i];
            const hasResults = ['IN_PROGRESS', 'BREAK_TIME', 'FINAL', 'CANCEL', 'POSTPONED', 'PENDING'].includes(game.gameStatus);

            await test.step(`Card ${i + 1} (${game.gameStatus}): Score check`, async () => {
                if (hasResults) {
                    const hScore = soccerListPage.computeMainScore(game.teams?.home?.periodData);
                    await expect.soft(homeTeamMainScore).toContainText(String(hScore));
                } else {
                    await expect.soft(homeTeamMainScore.locator('span').first()).toHaveClass(/opacity-0/);
                }

                const hPenalty = soccerListPage.getPenaltyScore(game.teams?.home?.periodData);
                if (hPenalty != null) {
                    await expect.soft(homeTeamPenaltyScore).toBeVisible();
                    await expect.soft(homeTeamPenaltyScore).toHaveText(`${hPenalty}`);
                } else {
                    await expect.soft(homeTeamPenaltyScore).not.toBeVisible();
                }

                if (hasResults) {
                    const aScore = soccerListPage.computeMainScore(game.teams?.away?.periodData);
                    await expect.soft(awayTeamMainScore).toContainText(String(aScore));
                } else {
                    await expect.soft(awayTeamMainScore.locator('span').first()).toHaveClass(/opacity-0/);
                }

                const aPenalty = soccerListPage.getPenaltyScore(game.teams?.away?.periodData);
                if (aPenalty != null) {
                    await expect.soft(awayTeamPenaltyScore).toBeVisible();
                    await expect.soft(awayTeamPenaltyScore).toHaveText(`${aPenalty}`);
                } else {
                    await expect.soft(awayTeamPenaltyScore).not.toBeVisible();
                }
            });
        }
    });
});