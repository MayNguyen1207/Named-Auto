import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailStatPage } from '../../../../pages/sports/soccer/SoccerDetailStatPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Head-To-Head', () => {
    test('[Soccer] Head-To-Head Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatHeadToHead;
        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await expect(soccerDetailStatPage.vsRecordTableTitle).toBeHidden();
        await expect(soccerDetailStatPage.vsRecordTableHeaderCells).toBeHidden();
    });

    test('[Soccer] Head-To-Head table data should be displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const matchId = matchData.matchLink.statHeadToHead;
        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const recordJson = await response.json();

        await test.step('Verify table title', async () => {
            await expect(soccerDetailStatPage.vsRecordTableTitle).toBeVisible();
        });

        await test.step('Verify table header', async () => {
            const headers = ['경기일', '홈팀', '점수', '원정팀', '결과'];
            await expect(soccerDetailStatPage.vsRecordTableHeaderCells).toHaveText(headers);
        });

        await test.step('Verify table data', async () => {
            const vsRecord: any[] = recordJson.vsRecord;
            await soccerDetailStatPage.verifyGameRecordTableRows(soccerDetailStatPage.vsRecordTableRows, vsRecord);
            await soccerDetailStatPage.verifyComparisonGridRecord(recordJson.vsRecord[0], soccerDetailStatPage.vsRecordTableRows);
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

        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailStatPage.recentFiveTableTitle).toBeVisible();
        });

        await test.step('Verify buttons name', async () => {
            await expect(soccerDetailStatPage.recentHomeTeamBtn).toHaveText(homeTeamName);
            await expect(soccerDetailStatPage.recentAwayTeamBtn).toHaveText(awayTeamName);
        });

        const headers = ['경기일', '홈팀', '점수', '원정팀', '결과'];

        await test.step('[Soccer] Table data should be displayed correctly for Home team', async () => {
            await expect(soccerDetailStatPage.recentFiveTableHeaderCells).toHaveText(headers);
            await soccerDetailStatPage.verifyGameRecordTableRows(soccerDetailStatPage.recentFiveTableRows, recordJson.recentHomeRecord);
            await soccerDetailStatPage.verifyComparisonGridRecord(recordJson.recentHomeRecord[0], soccerDetailStatPage.recentFiveTableRows);
        });

        await test.step('[Soccer] Table data should be displayed correctly for Away team', async () => {
            await soccerDetailStatPage.recentAwayTeamBtn.click();
            await expect(soccerDetailStatPage.recentFiveTableHeaderCells).toHaveText(headers);
            await soccerDetailStatPage.verifyGameRecordTableRows(soccerDetailStatPage.recentFiveTableRows, recordJson.recentAwayRecord);
            await soccerDetailStatPage.verifyComparisonGridRecord(recordJson.recentAwayRecord[0], soccerDetailStatPage.recentFiveTableRows);
        });
    });
});

test.describe('Next Matches', () => {
    test('[Soccer] Next Matches Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatNextMatches;
        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await expect(soccerDetailStatPage.nextMatchTableTitle).toBeHidden();
        await expect(soccerDetailStatPage.nextMatchTableHeaderCells).toBeHidden();
    });

    test('[Soccer] Next Matches Table title, tabs, headers and data are displayed correctly', async ({ page, request, sportsApiBaseURL }) => {
        const matchId = matchData.matchLink.statNextMatches;

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        const json = await response.json();
        const homeTeamName = json.teams.home.name;
        const awayTeamName = json.teams.away.name;

        const responseRecord = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const recordJson = await responseRecord.json();

        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailStatPage.nextMatchTableTitle).toBeVisible();
        });

        await test.step('Verify buttons name', async () => {
            await expect(soccerDetailStatPage.nextMatchHomeTeamBtn).toHaveText(homeTeamName);
            await expect(soccerDetailStatPage.nextMatchAwayTeamBtn).toHaveText(awayTeamName);
        });

        const headers = ['경기일시', '홈팀', '', '원정팀', '리그명'];

        await test.step('Verify Home team next matches data', async () => {
            await expect(soccerDetailStatPage.nextMatchTableHeaderCells).toHaveText(headers);
            await soccerDetailStatPage.verifyNextMatchTableRows(soccerDetailStatPage.nextMatchTableRows, recordJson.nextHomeRecord);
        });

        await test.step('Verify Away team next matches data', async () => {
            await soccerDetailStatPage.nextMatchAwayTeamBtn.click();
            await soccerDetailStatPage.verifyNextMatchTableRows(soccerDetailStatPage.nextMatchTableRows, recordJson.nextAwayRecord);
            await expect(soccerDetailStatPage.nextMatchTableHeaderCells).toHaveText(headers);
        });
    });
});

test.describe('Team Ranking', () => {
    test('[Soccer] Team Ranking Data Table should be hidden when there is no data', async ({ page }) => {
        const matchId = matchData.matchLink.noStatTeamRanking;
        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await expect(soccerDetailStatPage.rankingTableTitle).toBeHidden();
        await expect(soccerDetailStatPage.rankingTableHeaderCells).toBeHidden();
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

        const soccerDetailStatPage = new SoccerDetailStatPage(page);
        await soccerDetailStatPage.navigateStat(matchId);

        await test.step('Verify table title', async () => {
            await expect(soccerDetailStatPage.rankingTableTitle).toBeVisible();
        });
        
        for (const group of groups) {
            await test.step(`Verify ${group} group data`, async () => {
                const groupBtn = soccerDetailStatPage.getTournamentGroupBtn(group as string);
                await expect(groupBtn).toBeVisible();
                await groupBtn.click();
                
                await expect(soccerDetailStatPage.rankingTableHeaderCells).toHaveText(headers);
                const expectedTotal = seasonRanking.total.filter((item: any) => (item.tournamentGroup || '') === group);
                await soccerDetailStatPage.verifyRankingTableRows(soccerDetailStatPage.rankingTableRows, expectedTotal);
            });
        }

        await test.step('Verify Home match data', async () => {
            await soccerDetailStatPage.rankingHomeMatchBtn.click();
            await expect(soccerDetailStatPage.rankingTableHeaderCells).toHaveText(headers);
            await soccerDetailStatPage.verifyRankingTableRows(soccerDetailStatPage.rankingTableRows, seasonRanking.homeStandard);
        });

        await test.step('Verify Away match data', async () => {
            await soccerDetailStatPage.rankingAwayMatchBtn.click();
            await expect(soccerDetailStatPage.rankingTableHeaderCells).toHaveText(headers);
            await soccerDetailStatPage.verifyRankingTableRows(soccerDetailStatPage.rankingTableRows, seasonRanking.awayStandard);
        });
    });
})