import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/sports/soccer/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Line Up', () => {
    test('[Soccer] No line up text should be displayed', async ({ page }) => {
        const matchId = matchData.matchLink.normal;

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateLineUp(matchId);

        await expect(soccerDetailPage.noLineUpTxt).toBeVisible();
    });
});

test.describe('Broadcast', () => {
    test('[Soccer] Broadcast table should be hidden', async ({ page }) => {
        const matchId = matchData.matchLink.noBroadcast;

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateBroadcast(matchId);

        await expect(soccerDetailPage.broadcastTable).toBeHidden();
    });

    test('[Soccer] Broadcast table should be displayed', async ({ page }) => {
        const matchId = matchData.matchLink.normal;

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateBroadcast(matchId);

        await expect(soccerDetailPage.broadcastTable).toBeVisible();
    });
});

test.describe('Record', () => {
    test('[Soccer] No Record text should be displayed', async ({ page }) => {
        const matchId = matchData.matchLink.noRecord;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateRecord(matchId);

        await expect(soccerDetailPage.noRecordTxt).toBeVisible();
    });

    test('[Soccer] Waiting for record text should be displayed', async ({ page, request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
        expect(response.ok()).toBeTruthy();
        const games = await response.json();

        const readyMatch = games.find((game: any) => game.gameStatus === 'READY');
        expect(readyMatch, 'No READY match found').toBeDefined();

        const matchId = readyMatch.id;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateRecord(matchId);

        await expect(soccerDetailPage.waitForRecordTxt).toBeVisible();
    });

    test.describe('Have Record data', () => {
        let soccerDetailPage: SoccerDetailPage;
        const matchId = matchData.matchLink.normal;

        let home: any;
        let away: any;

        test.beforeAll(async ({ request, sportsApiBaseURL }) => {
            const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/team/game-stat`);
            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            home = data.home;
            away = data.away;
        })

        test.beforeEach(async ({ page }) => {
            soccerDetailPage = new SoccerDetailPage(page);
            await soccerDetailPage.navigateRecord(matchId);
        });

        test('[Soccer] Record table title and Home team, Away team should be displayed', async () => {
            await test.step('Verify table title', async () => {
                await expect(soccerDetailPage.recordTableTitle).toBeVisible();
            });

            await test.step('Verify home team', async () => {
                if (home) {
                    await expect(soccerDetailPage.recordHomeTeamName).toContainText(home.name);

                    if (home.imgPath) {
                        const src = await soccerDetailPage.recordHomeTeamLogo.getAttribute('src');
                        const expectedSegment = home.imgPath.split('/').pop()!.split('_')[0];
                        const isFallback = src?.includes('default_home_team_logo');
                        if (!isFallback) {
                            expect(src).toContain(expectedSegment);
                        }
                    }
                }
            });

            await test.step('Verify VS text', async () => {
                await expect(soccerDetailPage.vsTxt).toBeVisible();
            });

            await test.step('Verify away team', async () => {
                if (away) {
                    await expect(soccerDetailPage.recordAwayTeamName).toContainText(away.name);

                    if (away.imgPath) {
                        const src = await soccerDetailPage.recordAwayTeamLogo.getAttribute('src');
                        const expectedSegment = away.imgPath.split('/').pop()!.split('_')[0];
                        const isFallback = src?.includes('default_away_team_logo');
                        if (!isFallback) {
                            expect(src).toContain(expectedSegment);
                        }
                    }
                }
            });
        });

        test('[Soccer] Record statistic bar should be displayed correctly', async ({ page }) => {
            const skipFields = new Set(['id', 'name', 'shortName', 'imgPath', 'gameTeamId', 'interception2', 'formation']); // Fields to skip (non-numeric or not shown in record bars)
            const floatFields = new Set(['possession', 'expectedGoal']);

            const fieldLabelMap: Record<string, string> = {
                expectedGoal: '예상 골(%)',
                bigChance: '득점 기회',
                attack: '공격 횟수',
                dangerousAttack: '위험 공격',
                shooting: '슈팅',
                shotsOnTarget: '유효슈팅',
                missedShot: '실축',
                blockedShot: '슈팅 막힘',
                foul: '파울',
                corner: '코너킥',
                freeKick: '프리킥',
                offside: '오프사이드',
                yellowCardCount: '옐로카드',
                redCardCount: '레드카드',
                passAttempted: '패스 횟수',
                passCompleted: '패스 성공',
                save: '세이브',
                interception1: '인터셉트',
                tackle: '태클',
                hitWoodwork: '골대 맞추기',
                shotInsideBox: '박스 안 슛',
                shotOutsideBox: '박스 밖 슛',
                touchOpponentBox: '상대 박스 안 터치',
            };

            const formatValue = (field: string, value: number): string => {
                if (floatFields.has(field)) {
                    return value.toFixed(2);
                }
                return String(value);
            };

            for (const field of Object.keys(home)) {
                if (skipFields.has(field)) continue;

                const homeValue = home[field];
                const awayValue = away[field];

                if (typeof homeValue !== 'number' || typeof awayValue !== 'number') continue;

                await test.step(`Verify record bar: ${field}`, async () => {
                    const recordBar = page.getByTestId(`record-table-${field}`);

                    if (homeValue === 0 && awayValue === 0) {
                        await expect(recordBar).toBeHidden();
                        return;
                    }

                    await expect(recordBar).toBeVisible();

                    const expectedLabel = fieldLabelMap[field];
                    if (expectedLabel) {
                        const labelDiv = recordBar.locator('> div').nth(1);
                        await expect(labelDiv).toContainText(expectedLabel);
                    }

                    const homeCell = page.getByTestId(`record-table-${field}-home`);
                    const awayCell = page.getByTestId(`record-table-${field}-away`);

                    await expect(homeCell).toContainText(formatValue(field, homeValue));
                    await expect(awayCell).toContainText(formatValue(field, awayValue));

                    if (homeValue !== awayValue) {
                        const homeWrapper = homeCell.locator('..');
                        const awayWrapper = awayCell.locator('..');

                        if (homeValue > awayValue) {
                            await expect(homeWrapper).toHaveClass(/bg-primary/);
                            await expect(awayWrapper).toHaveClass(/bg-input/);
                        } else {
                            await expect(homeWrapper).toHaveClass(/bg-input/);
                            await expect(awayWrapper).toHaveClass(/bg-primary/);
                        }
                    }
                });
            }
        })
    })
})