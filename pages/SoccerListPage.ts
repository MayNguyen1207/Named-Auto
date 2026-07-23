import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SoccerListPage extends BasePage {
    readonly page: Page;
    readonly allTab: Locator;
    readonly favTab: Locator;
    readonly onGoingTab: Locator;
    readonly waitingTab: Locator;
    readonly endedTab: Locator;

    readonly todayBtn: Locator;
    readonly previousDayBtn: Locator;
    readonly calendarBtn: Locator;
    readonly nextDayBtn: Locator;
    readonly reloadBtn: Locator;

    readonly soundBtn: Locator;
    readonly promptBtn: Locator;
    readonly keywordInput: Locator;
    readonly horizontalBtn: Locator;
    readonly verticalBtn: Locator;

    readonly calendarModal: Locator;
    readonly monthTxt: Locator;
    readonly previousMonthBtn: Locator;
    readonly nextMonthBtn: Locator;
    readonly calendarTodayBtn: Locator;
    readonly dayCell: Locator;
    readonly yearBtn: Locator;
    readonly yearList: Locator;
    readonly yearOption: Locator;

    readonly leagueHeaders: Locator;
    readonly matchCards: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.allTab = page.getByRole('button', { name: '전체' });
        this.favTab = page.getByRole('button', { name: '관심 경기' });
        this.onGoingTab = page.getByRole('button', { name: '진행 중' });
        this.waitingTab = page.getByRole('button', { name: '대기 중' });
        this.endedTab = page.getByRole('button', { name: '종료 경기' });

        this.todayBtn = page.getByRole('button', { name: '오늘' });
        this.previousDayBtn = page.getByRole('button', { name: 'Previous day' });
        this.calendarBtn = page.getByLabel('달력', { exact: true });
        this.nextDayBtn = page.getByRole('button', { name: 'Next day' });
        this.reloadBtn = page.getByRole('button', { name: 'Reload' });

        this.soundBtn = page.getByRole('checkbox', { name: '사운드' });
        this.promptBtn = page.getByRole('checkbox', { name: '프롬프트' });
        this.keywordInput = page.getByRole('textbox', { name: '팀이나 리그를 검색해 주세요.' });
        this.horizontalBtn = page.getByRole('button', { name: '수평' }).nth(1);
        this.verticalBtn = page.getByRole('button', { name: '수직' }).nth(1);

        this.calendarModal = page.getByTestId('calendar-root');
        this.monthTxt = this.calendarModal.locator("//div[contains(@class,'text-[15px] font-medium')]"); //Tobe updated
        this.previousMonthBtn = this.calendarModal.locator('button.size-7.rounded.flex.items-center.justify-center').first(); //Tobe updated
        this.nextMonthBtn = this.calendarModal.locator('button.size-7.rounded.flex.items-center.justify-center').nth(1); //Tobe updated
        this.calendarTodayBtn = this.calendarModal.getByRole('button', { name: '오늘' });
        this.dayCell = this.calendarBtn.getByRole('gridcell');
        this.yearBtn = this.calendarBtn.getByRole('button', { name: '년' });
        this.yearList = page.locator('div.year-selector');
        this.yearOption = this.yearList.locator('button');

        this.leagueHeaders = page.locator('div[data-index]:not([data-item-group-index])');
        this.matchCards = page.locator('div[data-item-group-index]');
    }

    async navigate() {
        await this.page.goto('/scorecenter/soccer', { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(3000);
    }

    extractGames(body: any): any[] {
        return body.data ?? (Array.isArray(body) ? body : (body.value ?? []));
    }

    async verifyTabMatchCounts(games: any[]) {
        const all     = games.length;
        const onGoing = games.filter(g => g.gameStatus === 'IN_PROGRESS' || g.gameStatus === 'BREAK_TIME').length;
        const waiting = games.filter(g => g.gameStatus === 'READY').length;
        const ended   = games.filter(g => ['FINAL', 'POSTPONED', 'CANCEL'].includes(g.gameStatus)).length;

        await expect(this.allTab).toHaveText(`전체 (${all})`);
        await expect(this.onGoingTab).toHaveText(`진행 중(${onGoing})`);
        await expect(this.waitingTab).toHaveText(`대기 중(${waiting})`);
        await expect(this.endedTab).toHaveText(`종료 경기 (${ended})`);
    }

    async openCalendar() {
        await expect(async () => {
            await this.calendarBtn.click();
            await expect(this.calendarModal).toBeVisible({ timeout: 1000 });
        }).toPass();
    }
}