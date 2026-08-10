import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SoccerDetailPage extends BasePage {
    readonly page: Page;

    readonly leagueName: Locator;
    readonly openNewWindow: Locator;

    readonly homeTeamLogo: Locator;
    readonly homeTeamName: Locator;
    readonly homeTeamRank: Locator;

    readonly awayTeamLogo: Locator;
    readonly awayTeamName: Locator;
    readonly awayTeamRank: Locator;

    readonly favBtn: Locator;
    readonly removeFavBtn: Locator;

    readonly sportBannerLeft: Locator;
    readonly sportBannerRight: Locator;

    readonly scoreTable: Locator;
    readonly scoreTableHeader: Locator;
    readonly scoreTableHomeRow: Locator;
    readonly scoreTableAwayRow: Locator;

    readonly dividendTab: Locator;
    readonly achivementTab: Locator;
    readonly analysisTab: Locator;
    readonly lineUpTab: Locator;
    readonly broadcastTab: Locator;
    readonly recordTab: Locator;

    //Odds Tab
    readonly oddsTableTitle: Locator;
    readonly normalBtn: Locator;
    readonly handicapBtn: Locator;
    readonly underOverBtn: Locator;

    readonly oddsTableHeaderCells: Locator;
    readonly oddsTableRows: Locator;
    readonly oddsTableContentCells: Locator;

    //Stat Tab
    readonly expandBtn: Locator;
    readonly vsRecordTable: Locator;
    readonly vsRecordTableTitle: Locator;
    readonly vsRecordTableHeaderCells: Locator;
    readonly vsRecordTableRows: Locator;

    readonly comparisonGrid: Locator;
    readonly comparisonGridRows: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;

        this.leagueName = page.locator("a[href*='/scorecenter/soccer'] > button[data-state]");
        this.openNewWindow = page.getByTestId('open-new-tab-button');

        this.homeTeamLogo = page.locator("//img[@alt='Home team logo']");
        this.homeTeamName = page.getByTestId('home-team');
        this.homeTeamRank = page.getByTestId('home-team-rank');

        this.awayTeamLogo = page.locator("//img[@alt='Away team logo']");
        this.awayTeamName = page.getByTestId('away-team');
        this.awayTeamRank = page.getByTestId('away-team-rank');

        this.favBtn = page.getByLabel('Add to favorite');
        this.removeFavBtn = page.getByLabel('Remove from favorite');

        this.sportBannerLeft = page.locator('section a.banner-video-container').first();
        this.sportBannerRight = page.locator('section a.banner-video-container').last();

        this.scoreTable = page.locator("//div[@class='w-full rounded-none tablet:rounded-md bg-border border overflow-x-auto']"); //Tobe updated
        this.scoreTableHeader = this.scoreTable.locator('> div').first();
        this.scoreTableHomeRow = this.scoreTable.locator('> div').nth(1);
        this.scoreTableAwayRow = this.scoreTable.locator('> div').last();

        this.dividendTab = page.getByTestId('tab-odds');
        this.achivementTab = page.getByTestId('tab-stat');
        this.analysisTab = page.getByTestId('tab-analysis');
        this.lineUpTab = page.getByTestId('tab-lineup');
        this.broadcastTab = page.getByTestId('tab-broadcast');
        this.recordTab = page.getByTestId('tab-record');

        this.oddsTableTitle = page.locator('span:has-text("배당 현황")');
        this.normalBtn = page.locator('button:has-text("일반")');
        this.handicapBtn = page.locator('button:has-text("핸디캡")');
        this.underOverBtn = page.locator('button:has-text("언더/오버")');

        this.oddsTableHeaderCells = page.locator('th:visible');
        this.oddsTableRows = page.locator('tr[data-testid^="odds-table-row-"]');
        this.oddsTableContentCells = page.locator('td:visible');

        this.expandBtn = page.getByLabel('Expand', { exact: true });
        this.vsRecordTable = page.getByTestId('stats-vs-record-table');
        this.vsRecordTableTitle = this.vsRecordTable.getByText('상대전적', { exact: true });
        this.vsRecordTableHeaderCells = this.vsRecordTable.locator('thead th');
        this.vsRecordTableRows = this.vsRecordTable.locator('tr[data-testid^="stats-vs-record-table-row-"]');

        this.comparisonGrid = page.getByTestId('team-comparison-grid');
        this.comparisonGridRows = this.comparisonGrid.locator('> div');
    }

    async navigateOdds(id: number) {
        await this.page.goto(`/match/soccer/${id}/odds`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async navigateStat(id: number) {
        await this.page.goto(`/match/soccer/${id}/stat`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async verifyDividendTableRows(request: any, sportsApiBaseURL: string, matchId: number, marketType: string) {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/games/${matchId}/odds/sitesV2`);
        const json = await response.json();
        const dataList = json.international_basic.filter((d: any) => d.marketType === marketType);

        const rows = this.oddsTableRows;
        const rowCount = await rows.count();
        expect.soft(rowCount).toBe(dataList.length);

        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const testId = await row.getAttribute('data-testid');
            const id = testId?.match(/\d+$/)?.[0];
            if (!id) continue;

            const expectedData = dataList.find((d: any) => d.id.toString() === id);
            expect(expectedData).toBeDefined();

            const cells = row.locator('td');
            await expect(cells.nth(0).locator('img')).toBeVisible();
            await expect(cells.nth(1)).toHaveText(expectedData.line ?? '');
            await expect(cells.nth(2)).toContainText(expectedData.win ?? '');
            await expect(cells.nth(3)).toContainText(expectedData.draw ?? '');
            await expect(cells.nth(4)).toContainText(expectedData.loss ?? '');

            const checkStatusArrow = async (cellIndex: number, status: string) => {
                const cell = cells.nth(cellIndex);
                if (status === 'UP') {
                    await expect(cell.locator('svg.tabler-icon-triangle-filled')).toBeVisible();
                } else if (status === 'DOWN') {
                    await expect(cell.locator('svg.tabler-icon-triangle-inverted-filled')).toBeVisible();
                } else if (status === 'STAY') {
                    await expect(cell.locator('svg.tabler-icon-triangle-filled')).toBeHidden();
                    await expect(cell.locator('svg.tabler-icon-triangle-inverted-filled')).toBeHidden();
                }
            };

            await checkStatusArrow(2, expectedData.winStatus);
            await checkStatusArrow(3, expectedData.drawStatus);
            await checkStatusArrow(4, expectedData.lossStatus);
        }
    }
}