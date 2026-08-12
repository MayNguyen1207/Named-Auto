import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

export class SoccerDetailStatPage extends BasePage {
    readonly page: Page;

    readonly expandBtn: Locator;

    readonly vsRecordTable: Locator;
    readonly vsRecordTableTitle: Locator;
    readonly vsRecordTableHeaderCells: Locator;
    readonly vsRecordTableRows: Locator;

    readonly recentFiveTable: Locator;
    readonly recentFiveTableTitle: Locator;
    readonly recentHomeTeamBtn: Locator;
    readonly recentAwayTeamBtn: Locator;
    readonly recentFiveTableHeaderCells: Locator;
    readonly recentFiveTableRows: Locator;

    readonly comparisonGrid: Locator;
    readonly comparisonGridRows: Locator;

    readonly nextMatchTable: Locator;
    readonly nextMatchTableTitle: Locator;
    readonly nextMatchHomeTeamBtn: Locator;
    readonly nextMatchAwayTeamBtn: Locator;
    readonly nextMatchTableHeaderCells: Locator;
    readonly nextMatchTableRows: Locator;
    readonly vsTxt: Locator;

    readonly rankingTable: Locator;
    readonly rankingTableTitle: Locator;
    readonly rankingHomeMatchBtn: Locator;
    readonly rankingAwayMatchBtn: Locator;
    readonly rankingTableHeaderCells: Locator;
    readonly rankingTableRows: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;

        this.expandBtn = page.getByLabel('Expand', { exact: true });

        this.vsRecordTable = page.getByTestId('stats-vs-record-table');
        this.vsRecordTableTitle = this.vsRecordTable.getByText('상대전적', { exact: true });
        this.vsRecordTableHeaderCells = this.vsRecordTable.locator('thead th');
        this.vsRecordTableRows = this.vsRecordTable.locator('tr[data-testid^="stats-vs-record-table-row-"]');

        this.recentFiveTable = page.getByTestId('stats-recent5-table');
        this.recentFiveTableTitle = this.recentFiveTable.getByText('최근 5경기', { exact: true });
        this.recentHomeTeamBtn = this.recentFiveTable.locator('button').first();
        this.recentAwayTeamBtn = this.recentFiveTable.locator('button').nth(1);
        this.recentFiveTableHeaderCells = this.recentFiveTable.locator('thead th');
        this.recentFiveTableRows = this.recentFiveTable.locator('tr[data-testid^="stats-recent5-table-row-"]');

        this.comparisonGrid = page.getByTestId('team-comparison-grid');
        this.comparisonGridRows = this.comparisonGrid.locator('> div');

        this.nextMatchTable = page.getByTestId('next-match-table');
        this.nextMatchTableTitle = this.nextMatchTable.getByText('다음 일정', { exact: true });
        this.nextMatchHomeTeamBtn = this.nextMatchTable.locator('button').first();
        this.nextMatchAwayTeamBtn = this.nextMatchTable.locator('button').nth(1);
        this.nextMatchTableHeaderCells = this.nextMatchTable.locator('div.grid-cols-12.bg-border.border-b:visible > div'); //Tobe updated
        this.nextMatchTableRows = this.nextMatchTable.locator('div.grid.grid-cols-10');
        this.vsTxt = this.nextMatchTable.locator('div').filter({ hasText: 'VS' });

        this.rankingTable = page.getByTestId('team-ranking-table');
        this.rankingTableTitle = this.rankingTable.getByText('팀 순위', { exact: true });
        this.rankingHomeMatchBtn = this.rankingTable.locator('button:has-text("홈경기")');
        this.rankingAwayMatchBtn = this.rankingTable.locator('button:has-text("원정경기")');
        this.rankingTableHeaderCells = this.rankingTable.locator('thead th');
        this.rankingTableRows = this.rankingTable.locator('tbody tr');
    }

    async navigateStat(id: number) {
        await this.page.goto(`/match/soccer/${id}/stat`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async verifyGameRecordTableRows(rows: Locator, recordArray: any[]) {
        const rowCount = await rows.count();
        expect(rowCount).toBe(recordArray.length);

        const calcScore = (periodData: { period: number; score: number }[]) =>
            periodData.filter(p => p.period >= 1 && p.period <= 4).reduce((sum, p) => sum + p.score, 0);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const testId = await row.getAttribute('data-testid');
            const gameId = testId?.match(/\d+$/)?.[0];
            if (!gameId) continue;

            const expectedData = recordArray.find((d: any) => d.gameId.toString() === gameId);
            expect(expectedData).toBeDefined();

            const date = new Date(expectedData.startDateTime);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const expectedDate = `${month}.${day}`;

            const homeScore = calcScore(expectedData.home.periodData);
            const awayScore = calcScore(expectedData.away.periodData);
            const expectedScore = `${homeScore}:${awayScore}`;

            const cells = row.locator('td');
            await expect(cells.nth(0)).toHaveText(expectedDate);
            await expect(cells.nth(1)).toHaveText(expectedData.home.name);
            await expect(cells.nth(2)).toHaveText(expectedScore);
            await expect(cells.nth(3)).toHaveText(expectedData.away.name);
            await expect(cells.nth(4)).toHaveText('');

            await expect(row.locator(this.expandBtn)).toBeVisible();
        }
    }

    async verifyComparisonGridRecord(firstRecord: any, tableRows: Locator) {
        const home = firstRecord.home;
        const away = firstRecord.away;

        await tableRows.first().click();
        await expect(this.comparisonGrid).toBeVisible();

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

        const expectedRows = [
            ['', '전반', '후반', '연장', '합계', '기준', '배당'],
            [away.name, fmt(awayP1), fmt(awayP2), fmt(awayExtra), String(awayTotal), '-', '-'],
            [home.name, fmt(homeP1), fmt(homeP2), fmt(homeExtra), String(homeTotal), '-', '-'],
            ['', fmt((homeP1 ?? 0) + (awayP1 ?? 0) || null), fmt((homeP2 ?? 0) + (awayP2 ?? 0) || null), fmt(totalExtra), String(homeTotal + awayTotal), '-', '-'],
        ];

        for (let i = 0; i < expectedRows.length; i++) {
            const row = this.comparisonGridRows.nth(i).locator('> div');
            for (let j = 0; j < expectedRows[i].length; j++) {
                await expect(row.nth(j)).toHaveText(expectedRows[i][j]);
            }
        }

        await tableRows.first().click();
        await expect(this.comparisonGrid).toBeHidden();
    }

    async verifyNextMatchTableRows(rows: Locator, recordArray: any[]) {
        const rowCount = await rows.count();
        expect(rowCount).toBe(recordArray.length);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const testId = await row.getAttribute('data-testid');
            const gameId = testId?.match(/\d+$/)?.[0];
            if (!gameId) continue;

            const expectedData = recordArray.find((d: any) => d.gameId.toString() === gameId);
            expect(expectedData).toBeDefined();

            const cells = row.locator('> div');

            const d = new Date(expectedData.startDateTime);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            const dow = days[d.getDay()];
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            const expectedDate = `${mm}.${dd} (${dow}) ${hh}:${min}`;
            await expect(cells.nth(0)).toHaveText(expectedDate);

            await expect(cells.nth(1)).toContainText(expectedData.home.name);
            const homeImg = cells.nth(1).locator('img');
            const homeSrc = await homeImg.getAttribute('src');
            if (expectedData.home.imgPath) {
                const expectedSegment = expectedData.home.imgPath.split('/').pop()!.split('_')[0];
                expect(homeSrc).toMatch(new RegExp(`${expectedSegment}|default`));
            } else {
                expect(homeSrc).toContain('default_home_team_logo');
            }

            await expect(cells.nth(2)).toHaveText('VS');

            await expect(cells.nth(3)).toContainText(expectedData.away.name);
            const awayImg = cells.nth(3).locator('img');
            const awaySrc = await awayImg.getAttribute('src');
            if (expectedData.away.imgPath) {
                const expectedSegment = expectedData.away.imgPath.split('/').pop()!.split('_')[0];
                expect(awaySrc).toMatch(new RegExp(`${expectedSegment}|default`));
            } else {
                expect(awaySrc).toContain('default_away_team_logo');
            }

            await expect(cells.nth(4)).toHaveText(expectedData.leagueName);
        }
    }

    getTournamentGroupBtn(groupName: string): Locator {
        const label = groupName ? `${groupName} 조` : '전체';
        return this.rankingTable.locator('button').filter({ hasText: label });
    }

    async verifyRankingTableRows(rows: Locator, recordArray: any[]) {
        const rowCount = await rows.count();
        expect(rowCount).toBe(recordArray.length);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const expectedData = recordArray[i];
            const cells = row.locator('td');

            const col1 = cells.nth(0);
            await expect(col1).toContainText(expectedData.rank.toString());
            await expect(col1).toContainText(expectedData.team.name);
            
            const img = col1.locator('img');
            const src = await img.getAttribute('src') || '';
            if (expectedData.team.imgPath) {
                const expectedSegment = expectedData.team.imgPath.split('/').pop()!.split('_')[0];
                expect(src).toMatch(new RegExp(`${expectedSegment}|default`));
            } else {
                expect(src).toContain('default');
            }

            const fmt = (val: number | null | undefined): string => val != null ? String(val) : '-';
            await expect(cells.nth(1)).toHaveText(fmt(expectedData.gameCount));
            await expect(cells.nth(2)).toHaveText(fmt(expectedData.point));
            await expect(cells.nth(3)).toHaveText(fmt(expectedData.winCount));
            await expect(cells.nth(4)).toHaveText(fmt(expectedData.drawCount));
            await expect(cells.nth(5)).toHaveText(fmt(expectedData.defeatCount));
            await expect(cells.nth(6)).toHaveText(fmt(expectedData.goalCount));
            await expect(cells.nth(7)).toHaveText(fmt(expectedData.goalAgainstCount));
            await expect(cells.nth(8)).toHaveText(fmt(expectedData.goalDifference));
        }
    }
}