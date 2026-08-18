import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

export class SoccerDetailWritePage extends BasePage {
    readonly page: Page;

    readonly createAnalysisPostPopup: Locator;
    readonly popupHeader: Locator;
    readonly closeBtn: Locator;

    readonly sportCombo: Locator;
    readonly matchCombo: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;

        this.createAnalysisPostPopup = page.locator('[aria-labelledby="analysis-create-new-post-title"]');
        this.popupHeader = page.getByTestId('dialog-title');
        this.closeBtn = page.getByTestId('dialog-title').locator('svg.tabler-icon-square-x-filled');

        this.sportCombo = page.locator('[role="combobox"]').first();
        this.matchCombo = page.locator('[role="combobox"]').last();
    }

    async navigateWrite(id: number) {
        await this.page.goto(`/match/soccer/${id}/analysis?boardType=sports_analysis`);
        await expect(this.createAnalysisPostPopup).toBeVisible();
    }
}