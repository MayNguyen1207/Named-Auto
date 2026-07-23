import { test, expect } from '../../../utils/fixtures';
import { SoccerListPage } from '../../../pages/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] Number of matches should be displayed in the tab name', async ({ request, page, sportsApiBaseURL }) => {
        const soccerListPage = new SoccerListPage(page);

        await soccerListPage.navigate();

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
        const games = soccerListPage.extractGames(await response.json());

        await soccerListPage.verifyTabMatchCounts(games);
    });

    test('[Soccer] No match text should be shown when there is no match', async ({ page }) => {
        for (let i = 0; i < 20; i++) {
            await soccerListPage.nextDayBtn.click();
            await page.waitForTimeout(300);
        }
        await page.waitForTimeout(1000);

        const subText = '지난 경기 결과나 예정된 경기는 달력을 클릭하시면 편하게 찾아 보실 수 있습니다.';
        const tabChecks = [
            { tab: null, text: '축구 경기 일정이 없습니다.' },
            { tab: soccerListPage.favTab, text: '관심 경기가 없습니다.' },
            { tab: soccerListPage.onGoingTab, text: '진행 중인 축구 경기가 없습니다.' },
            { tab: soccerListPage.waitingTab, text: '대기 중인 축구 경기가 없습니다.' },
            { tab: soccerListPage.endedTab, text: '금일 종료 경기가 없습니다.' },
        ];

        for (const { tab, text } of tabChecks) {
            if (tab) await tab.click();
            await expect(page.getByText(text)).toBeVisible();
            await expect(page.getByText(subText)).toBeVisible();
        }
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

    test('[Soccer] User can click Reload button to update the list', async ({ page }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const pad = (n: number) => String(n).padStart(2, '0');

        await test.step('Verify reload on today page', async () => {
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes('sports/soccer/today-games') && resp.status() === 200),
                soccerListPage.reloadBtn.click(),
            ]);
        });

        await test.step('Verify reload on next day page', async () => {
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextApiDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;

            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`games?date=${nextApiDate}`) && resp.status() === 200),
                soccerListPage.nextDayBtn.click(),
            ]);

            await Promise.all([
                page.waitForResponse(resp => resp.url().includes(`games?date=${nextApiDate}`) && resp.status() === 200),
                soccerListPage.reloadBtn.click(),
            ]);
        });
    });
})