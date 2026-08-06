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
    }

    async navigate(id: number) {
        await this.page.goto(`/match/soccer/${id}/odds`);
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }
}