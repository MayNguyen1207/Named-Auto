import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

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

    //Line up
    readonly noLineUpTxt: Locator;

    //Broadcast
    readonly broadcastTable: Locator;

    //Record
    readonly recordTable: Locator;
    readonly recordTableTitle: Locator;
    readonly recordHomeTeamLogo: Locator;
    readonly recordHomeTeamName: Locator;
    readonly vsTxt: Locator;
    readonly recordAwayTeamLogo: Locator;
    readonly recordAwayTeamName: Locator;
    readonly noRecordTxt: Locator;
    readonly waitForRecordTxt: Locator;

    //Analysis post list
    readonly noPostTxt: Locator;
    readonly tabTitle: Locator;
    readonly writeBtn: Locator;
    readonly tableHeaderCells: Locator;
    readonly analysisTableRows: Locator;
    readonly analysisPostPopup: Locator;
    readonly createAnalysisPostPopup: Locator;

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

        this.noLineUpTxt = page.getByText('준비 중인 기능입니다.', { exact: true });

        this.broadcastTable = page.getByTestId('broadcast-tab-table');

        this.recordTable = page.getByTestId('record-table')
        this.recordTableTitle = this.recordTable.getByText('경기 기록', { exact: true });
        this.recordHomeTeamLogo = this.recordTable.locator('div.col-span-5.text-center').first().locator('img');
        this.recordHomeTeamName = page.getByTestId('home-team-name-record');
        this.vsTxt = this.recordTable.locator('span').filter({ hasText: 'VS' });
        this.recordAwayTeamLogo = this.recordTable.locator('div.col-span-5.text-center').last().locator('img');
        this.recordAwayTeamName = page.getByTestId('away-team-name-record');
        this.noRecordTxt = page.getByText('데이터가 없습니다.', { exact: true });
        this.waitForRecordTxt = page.getByText('경기 데이터가 준비되는 대로 확인하실 수 있습니다.', { exact: true });

        this.noPostTxt = page.getByText('작성된 분석글이 없습니다.', { exact: true });
        this.tabTitle = page.locator('div.w-full.space-y-4').locator('div').first();
        this.writeBtn = page.getByText('글쓰기', { exact: true });
        this.tableHeaderCells = page.locator('th:visible');
        this.analysisTableRows = page.locator('tr[data-testid^="analysis-table-row-"]');
        this.analysisPostPopup = page.locator('[aria-labelledby="analysis-modal-title"]');
        this.createAnalysisPostPopup = page.locator('[aria-labelledby="analysis-create-new-post-title"]');
    }

    async navigateOdds(id: number) {
        await this.page.goto(`/match/soccer/${id}/odds`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async navigateLineUp(id: number) {
        await this.page.goto(`/match/soccer/${id}/lineup`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async navigateBroadcast(id: number) {
        await this.page.goto(`/match/soccer/${id}/broadcast`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async navigateRecord(id: number) {
        await this.page.goto(`/match/soccer/${id}/record`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async navigateAnalysis(id: number) {
        await this.page.goto(`/match/soccer/${id}/analysis`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    getScoreByTeam = (teamInfo: any, p: number) => {
        const periods = teamInfo?.periodData || [];
        const pd = periods.find((period: any) => period.period === p || period.id === p);
        return pd ? parseInt(pd.score) || 0 : 0;
    };

    async verifyOddsTableRows(dataList: any[]) {
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

            await this.checkOddsStatusArrow(cells.nth(2), expectedData.winStatus);
            await this.checkOddsStatusArrow(cells.nth(3), expectedData.drawStatus);
            await this.checkOddsStatusArrow(cells.nth(4), expectedData.lossStatus);
        }
    }

    async checkOddsStatusArrow(cell: Locator, status: string) {
        if (status === 'UP') {
            await expect(cell.locator('svg.tabler-icon-triangle-filled')).toBeVisible();
        } else if (status === 'DOWN') {
            await expect(cell.locator('svg.tabler-icon-triangle-inverted-filled')).toBeVisible();
        } else if (status === 'STAY') {
            await expect(cell.locator('svg.tabler-icon-triangle-filled')).toBeHidden();
            await expect(cell.locator('svg.tabler-icon-triangle-inverted-filled')).toBeHidden();
        }
    }

    getAnalysisTableRow(wrId: number): Locator {
        return this.page.getByTestId(`analysis-table-row-${wrId}`);
    }
}