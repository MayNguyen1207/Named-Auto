import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Head-To-Head', () => {
    test('[Soccer] Head-To-Head Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatHeadToHead;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);

        await expect(soccerDetailPage.vsRecordTableTitle).toBeHidden();
        await expect(soccerDetailPage.vsRecordTableHeaderCells).toBeHidden();
    });

    test('[Soccer] Head-To-Head table data should be displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const matchId = matchData.matchLink.statHeadToHead;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const recordJson = await response.json();

        await test.step('Verify table title', async () => {
            await expect(soccerDetailPage.vsRecordTableTitle).toBeVisible();
        });

        await test.step('Verify table header', async () => {
            const headers = ['경기일', '홈팀', '점수', '원정팀', '결과'];
            await expect(soccerDetailPage.vsRecordTableHeaderCells).toHaveText(headers);
        });

        await test.step('Verify table data', async () => {
            const vsRecord: any[] = recordJson.vsRecord;
            await soccerDetailPage.verifyGameRecordTableRows(soccerDetailPage.vsRecordTableRows, vsRecord);
            await soccerDetailPage.verifyComparisonGridRecord(recordJson.vsRecord[0], soccerDetailPage.vsRecordTableRows);
        });
    });
});

test.describe('Recent 5 Matches', () => {
    test('[Soccer] Recent 5 Matches table title, tabs, headers and data are displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const matchId = matchData.matchLink.statRecentFive;

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        const json = await response.json();
        const homeTeamName = json.teams.home.name;
        const awayTeamName = json.teams.away.name;

        const responseRecord = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const recordJson = await responseRecord.json();

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailPage.recentFiveTableTitle).toBeVisible();
        });

        await test.step('Verify buttons name', async () => {
            await expect(soccerDetailPage.recentHomeTeamBtn).toHaveText(homeTeamName);
            await expect(soccerDetailPage.recentAwayTeamBtn).toHaveText(awayTeamName);
        });

        const headers = ['경기일', '홈팀', '점수', '원정팀', '결과'];

        await test.step('[Soccer] Table data should be displayed correctly for Home team', async () => {
            await expect(soccerDetailPage.recentFiveTableHeaderCells).toHaveText(headers);
            await soccerDetailPage.verifyGameRecordTableRows(soccerDetailPage.recentFiveTableRows, recordJson.recentHomeRecord);
            await soccerDetailPage.verifyComparisonGridRecord(recordJson.recentHomeRecord[0], soccerDetailPage.recentFiveTableRows);
        });

        await test.step('[Soccer] Table data should be displayed correctly for Away team', async () => {
            await soccerDetailPage.recentAwayTeamBtn.click();
            await expect(soccerDetailPage.recentFiveTableHeaderCells).toHaveText(headers);
            await soccerDetailPage.verifyGameRecordTableRows(soccerDetailPage.recentFiveTableRows, recordJson.recentAwayRecord);
            await soccerDetailPage.verifyComparisonGridRecord(recordJson.recentAwayRecord[0], soccerDetailPage.recentFiveTableRows);
        });
    });
});

test.describe('Next Matches', () => {
    test('[Soccer] Next Matches Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatNextMatches;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);

        await expect(soccerDetailPage.nextMatchTableTitle).toBeHidden();
        await expect(soccerDetailPage.nextMatchTableHeaderCells).toBeHidden();
    });

    test('[Soccer] Next Matches Table title, tabs, headers and data are displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const matchId = matchData.matchLink.statNextMatches;

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        const json = await response.json();
        const homeTeamName = json.teams.home.name;
        const awayTeamName = json.teams.away.name;

        const responseRecord = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const recordJson = await responseRecord.json();

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailPage.nextMatchTableTitle).toBeVisible();
        });

        await test.step('Verify buttons name', async () => {
            await expect(soccerDetailPage.nextMatchHomeTeamBtn).toHaveText(homeTeamName);
            await expect(soccerDetailPage.nextMatchAwayTeamBtn).toHaveText(awayTeamName);
        });

        const headers = ['경기일시', '홈팀', '', '원정팀', '리그명'];

        await test.step('Verify Home team next matches data', async () => {
            await expect(soccerDetailPage.nextMatchTableHeaderCells).toHaveText(headers);
            await soccerDetailPage.verifyNextMatchTableRows(soccerDetailPage.nextMatchTableRows, recordJson.nextHomeRecord);
        });

        await test.step('Verify Away team next matches data', async () => {
            await soccerDetailPage.nextMatchAwayTeamBtn.click();
            await soccerDetailPage.verifyNextMatchTableRows(soccerDetailPage.nextMatchTableRows, recordJson.nextAwayRecord);
            await expect(soccerDetailPage.nextMatchTableHeaderCells).toHaveText(headers);
        });
    });
});

test.describe('Team Ranking', () => {
    test('[Soccer] Team Ranking Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatTeamRanking;
        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateOdds(matchId);

        await expect(soccerDetailPage.rankingTableTitle).toBeHidden();
        await expect(soccerDetailPage.rankingTableHeaderCells).toBeHidden();
    });

    test('[Soccer] Team Ranking Table title, tabs, headers and data are displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17714');

        const matchId = matchData.matchLink.statTeamRanking;
        const responseRanking = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/rank`);
        const recordJson = await responseRanking.json();
        const seasonRanking = recordJson.seasonRanking;
        const apiGroups = [...new Set(seasonRanking.total.map((item: any) => item.tournamentGroup))].filter(Boolean);
        const groups = apiGroups.length > 0 ? apiGroups : [''];
        const headers = ['순위팀명', '경기', '승점', '승', '무', '패', '득점', '실점', '득실'];

        const soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailPage.rankingTableTitle).toBeVisible();
        });
        
        for (const group of groups) {
            await test.step(`Verify ${group} group data`, async () => {
                const groupBtn = soccerDetailPage.getTournamentGroupBtn(group as string);
                await expect(groupBtn).toBeVisible();
                await groupBtn.click();
                
                await expect(soccerDetailPage.rankingTableHeaderCells).toHaveText(headers);
                const expectedTotal = seasonRanking.total.filter((item: any) => (item.tournamentGroup || '') === group);
                await soccerDetailPage.verifyRankingTableRows(soccerDetailPage.rankingTableRows, expectedTotal);
            });
        }

        await test.step('Verify Home match data', async () => {
            await soccerDetailPage.rankingHomeMatchBtn.click();
            await expect(soccerDetailPage.rankingTableHeaderCells).toHaveText(headers);
            await soccerDetailPage.verifyRankingTableRows(soccerDetailPage.rankingTableRows, seasonRanking.homeStandard);
        });

        await test.step('Verify Away match data', async () => {
            await soccerDetailPage.rankingAwayMatchBtn.click();
            await expect(soccerDetailPage.rankingTableHeaderCells).toHaveText(headers);
            await soccerDetailPage.verifyRankingTableRows(soccerDetailPage.rankingTableRows, seasonRanking.awayStandard);
        });
    });
})