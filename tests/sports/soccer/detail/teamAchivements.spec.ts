import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Have Data', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.teamAchivements;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);
    });

    test('[Soccer] 상대전적 table title and header should be displayed correctly', async () => {
        await expect(soccerDetailPage.vsRecordTableTitle).toBeVisible();

        const headers = ['경기일', '홈팀', '점수', '원정팀', '결과'];
        await expect(soccerDetailPage.vsRecordTableHeaderCells).toHaveText(headers);
    });

    test('[Soccer] 상대전적 table data should be displayed correctly', async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const json = await response.json();
        const vsRecord: any[] = json.vsRecord;

        const rows = soccerDetailPage.vsRecordTableRows;
        const rowCount = await rows.count();
        expect.soft(rowCount).toBe(vsRecord.length);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const testId = await row.getAttribute('data-testid');
            const gameId = testId?.match(/\d+$/)?.[0];
            if (!gameId) continue;

            const expectedData = vsRecord.find((d: any) => d.gameId.toString() === gameId);
            expect(expectedData).toBeDefined();

            const date = new Date(expectedData.startDateTime);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const expectedDate = `${month}.${day}`;

            const calcScore = (periodData: { period: number; score: number }[]) =>
                periodData.filter(p => p.period >= 1 && p.period <= 4).reduce((sum, p) => sum + p.score, 0);
            const homeScore = calcScore(expectedData.home.periodData);
            const awayScore = calcScore(expectedData.away.periodData);
            const expectedScore = `${homeScore}:${awayScore}`;

            const cells = row.locator('td');
            await expect(cells.nth(0)).toHaveText(expectedDate);
            await expect(cells.nth(1)).toHaveText(expectedData.home.name);
            await expect(cells.nth(2)).toHaveText(expectedScore);
            await expect(cells.nth(3)).toHaveText(expectedData.away.name);
            await expect(cells.nth(4)).toHaveText('');

            await expect(row.locator(soccerDetailPage.expandBtn)).toBeVisible();
        }
    });

    test('[Soccer] User can click 상대전적 row to view detail record', async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}/record`);
        const json = await response.json();
        const firstRecord = json.vsRecord[0];
        const home = firstRecord.home;
        const away = firstRecord.away;

        await soccerDetailPage.vsRecordTableRows.first().click();
        await expect(soccerDetailPage.comparisonGrid).toBeVisible();

        const getP = (pd: any[], period: number): number | null =>
            pd.find((p: any) => p.period === period)?.score ?? null;

        const getExtra = (pd: any[]): number | null => {
            const extra = pd.filter((p: any) => p.period >= 3 && p.period <= 4);
            return extra.length > 0 ? extra.reduce((sum: number, p: any) => sum + p.score, 0) : null;
        };

        const fmt = (val: number | null): string => val !== null ? String(val) : '-';

        const homeP1 = getP(home.periodData, 1);
        const homeP2 = getP(home.periodData, 2);
        const homeExtra = getExtra(home.periodData);
        const homeTotal = (homeP1 ?? 0) + (homeP2 ?? 0) + (homeExtra ?? 0);

        const awayP1 = getP(away.periodData, 1);
        const awayP2 = getP(away.periodData, 2);
        const awayExtra = getExtra(away.periodData);
        const awayTotal = (awayP1 ?? 0) + (awayP2 ?? 0) + (awayExtra ?? 0);

        const totalExtra = (homeExtra !== null || awayExtra !== null)
            ? (homeExtra ?? 0) + (awayExtra ?? 0)
            : null;

        const getRow = (index: number) => soccerDetailPage.comparisonGridRows.nth(index).locator('> div');

        const expectedRows = [
            ['', '전반', '후반', '연장', '합계', '기준', '배당'], // Row 1: header labels
            [home.name, fmt(homeP1), fmt(homeP2), fmt(homeExtra), String(homeTotal), '-', '-'], // Row 2: home team
            [away.name, fmt(awayP1), fmt(awayP2), fmt(awayExtra), String(awayTotal), '-', '-'], // Row 3: away team
            ['', fmt((homeP1 ?? 0) + (awayP1 ?? 0) || null), fmt((homeP2 ?? 0) + (awayP2 ?? 0) || null), fmt(totalExtra), String(homeTotal + awayTotal), '-', '-'], // Row 4: totals
        ];

        for (let i = 0; i < expectedRows.length; i++) {
            const row = getRow(i);
            for (let j = 0; j < expectedRows[i].length; j++) {
                await expect(row.nth(j)).toHaveText(expectedRows[i][j]);
            }
        }
    });
})