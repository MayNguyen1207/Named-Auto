import { test, expect } from '../../../utils/fixtures';
import { SoccerListPage } from '../../../pages/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] User can change the month in calendar', async ({ page }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        await test.step('Open calendar and verify current month', async () => {
            await soccerListPage.calendarBtn.click();
            await expect(soccerListPage.monthTxt).toHaveText(`${currentMonth}월`);
        });

        await test.step('Navigate to previous month', async () => {
            const prevDate = new Date(now);
            prevDate.setMonth(prevDate.getMonth() - 1);
            const prevYear = prevDate.getFullYear();
            const prevMonth = prevDate.getMonth() + 1;

            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`calendar/game-counts?month=${prevMonth}&year=${prevYear}`) && resp.status() === 200),
                soccerListPage.previousMonthBtn.click(),
            ]);

            await expect(soccerListPage.monthTxt).toHaveText(`${prevMonth}월`);
        });

        await test.step('Navigate to next month', async () => {
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`calendar/game-counts?month=${currentMonth}&year=${currentYear}`) && resp.status() === 200),
                soccerListPage.nextMonthBtn.click(),
            ]);

            await expect(soccerListPage.monthTxt).toHaveText(`${currentMonth}월`);
        });
    });

    test('[Soccer] Each date should display match counts', async ({ page, request, sportsApiBaseURL }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const response = await request.get(
            `${sportsApiBaseURL}/v1.0/sports/soccer/calendar/game-counts?month=${currentMonth}&year=${currentYear}`
        );
        const gameCounts = soccerListPage.extractGames(await response.json());

        await soccerListPage.calendarBtn.click();

        for (const item of gameCounts) {
            const dateStr = item.date;
            const count = item.gameCount;

            if (count > 0) {
                const dateCell = page.locator(`[data-day="${dateStr}"]`);
                await expect(dateCell).toContainText(String(count));
            }
        }
    });

    test('[Soccer] User can select days in calendar', async ({ page }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const pad = (n: number) => String(n).padStart(2, '0');

        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const todayFormatted = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

        const prevDate = new Date(now);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;
        const prevFormatted = `${prevDate.getFullYear()}.${pad(prevDate.getMonth() + 1)}.${pad(prevDate.getDate())}`;

        await test.step('Open calendar and verify today is selected', async () => {
            await soccerListPage.openCalendar();
            const todayCell = page.locator(`[data-day="${todayStr}"]`);
            await expect(todayCell).toHaveAttribute('data-selected', 'true');
            await expect(todayCell).toHaveAttribute('data-today', 'true');
        });

        await test.step('Select a different day', async () => {
            await page.waitForTimeout(1000);
            const prevCell = page.locator(`[data-day="${prevStr}"]`);
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`games?date=${prevStr}`) && resp.status() === 200),
                prevCell.click({ force: true }),
            ]);
            await expect(soccerListPage.calendarBtn).toContainText(prevFormatted);
        });

        await test.step('Re-open calendar and verify selected day', async () => {
            await soccerListPage.openCalendar();
            const prevCell = page.locator(`[data-day="${prevStr}"]`);
            await expect(prevCell).toHaveAttribute('data-selected', 'true');
        });

        await test.step('Click today button inside calendar', async () => {
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes('sports/soccer/today-games') && resp.status() === 200),
                soccerListPage.calendarTodayBtn.click({ force: true }),
            ]);
            await expect(soccerListPage.calendarBtn).toContainText(todayFormatted);
        });
    });
});