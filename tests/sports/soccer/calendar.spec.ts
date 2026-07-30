import { test, expect } from '../../../utils/fixtures';
import { SoccerListPage } from '../../../pages/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] User can change date of the list', async ({ page, request, sportsApiBaseURL }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const pad = (n: number) => String(n).padStart(2, '0');
        const todayFormatted = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

        await test.step('Verify default date is today', async () => {
            await expect(soccerListPage.calendarBtn).toContainText(todayFormatted);
        });

        await test.step('Navigate to the previous day and verify match counts', async () => {
            const prevDate = new Date(now);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevFormatted = `${prevDate.getFullYear()}.${pad(prevDate.getMonth() + 1)}.${pad(prevDate.getDate())}`;
            const prevApiDate = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;

            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`games?date=${prevApiDate}`) && resp.status() === 200),
                soccerListPage.previousDayBtn.click(),
            ]);

            await expect(soccerListPage.calendarBtn).toContainText(prevFormatted);

            const prevResponse = await request.get(
                `${sportsApiBaseURL}/v1.0/sports/soccer/games?date=${prevApiDate}&status=ALL&tomorrow-game-flag=true`
            );
            const prevGames = soccerListPage.extractGames(await prevResponse.json());

            await soccerListPage.verifyTabMatchCounts(prevGames);
        });

        await test.step('Navigate to the next day and verify match counts', async () => {
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextFormatted = `${nextDate.getFullYear()}.${pad(nextDate.getMonth() + 1)}.${pad(nextDate.getDate())}`;
            const nextApiDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;

            await Promise.all([
                page.waitForResponse(resp => resp.url().includes('sports/soccer/today-games') && resp.status() === 200),
                soccerListPage.nextDayBtn.click(),
            ]);
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`games?date=${nextApiDate}`) && resp.status() === 200),
                soccerListPage.nextDayBtn.click(),
            ]);

            await expect(soccerListPage.calendarBtn).toContainText(nextFormatted);

            const nextResponse = await request.get(
                `${sportsApiBaseURL}/v1.0/sports/soccer/games?date=${nextApiDate}&status=ALL&tomorrow-game-flag=true`
            );
            const nextGames = soccerListPage.extractGames(await nextResponse.json());

            await soccerListPage.verifyTabMatchCounts(nextGames);
        });

        await test.step('Click todayBtn to return to today', async () => {
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes('sports/soccer/today-games') && resp.status() === 200),
                soccerListPage.todayBtn.click(),
            ]);

            await expect(soccerListPage.calendarBtn).toContainText(todayFormatted);
        });
    });

    test('[Soccer] User can change the year in calendar', async ({ page }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const currentYear = now.getFullYear();

        await test.step('Open calendar and verify yearBtn shows current year', async () => {
            await soccerListPage.openCalendar();
            await expect(soccerListPage.yearBtn).toHaveText(`${currentYear}년`);
        });

        await test.step('Click yearBtn to open yearList and verify years range', async () => {
            await soccerListPage.yearBtn.click();
            await expect(soccerListPage.yearList).toBeVisible();

            // Should show currentYear ± 5 = 11 options total
            const expectedYears = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
            const yearBtns = soccerListPage.yearOption;
            await expect(yearBtns).toHaveCount(11);

            for (const year of expectedYears) {
                await expect(soccerListPage.yearOption.filter({ hasText: String(year) })).toBeVisible();
            }
        });

        await test.step('Verify current year is highlighted', async () => {
            const currentYearBtn = soccerListPage.yearOption.filter({ hasText: String(currentYear) });
            await expect(currentYearBtn).toHaveClass(/bg-primary/);
            await expect(currentYearBtn).toHaveClass(/text-primary-foreground/);
        });

        await test.step('Select a different year and verify cells update', async () => {
            const targetYear = currentYear - 1;
            const targetYearBtn = soccerListPage.yearOption.filter({ hasText: String(targetYear) });
            await targetYearBtn.click();

            await expect(soccerListPage.yearList).not.toBeVisible();
            await expect(soccerListPage.yearBtn).toHaveText(`${targetYear}년`);

            const firstCell = soccerListPage.dayCell.first();
            await expect(firstCell).toHaveAttribute('data-day', new RegExp(`^${targetYear}-`));
        });
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