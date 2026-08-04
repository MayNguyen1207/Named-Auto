import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] Number of matches should be displayed in the tab name', async ({ request, page, sportsApiBaseURL }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17637');

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

    test('[Soccer] User can open and close league headers', async ({ request, sportsApiBaseURL }) => {
        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
        const games = soccerListPage.extractGames(await response.json());

        if (games.length === 0) {
            test.skip();
            return;
        }

        const leagueShortNames = Array.from(new Set(games.map(g => g.league?.shortName).filter(Boolean)));

        await expect(soccerListPage.firstLeagueHeader).toBeVisible();

        const headerText = await soccerListPage.firstLeagueHeader.innerText();
        const matchFound = leagueShortNames.some(name => headerText.includes(name));
        expect(matchFound).toBeTruthy();

        const firstMatchCard = soccerListPage.matchCards.first();
        await expect(firstMatchCard).toHaveAttribute('data-item-group-index', '0');

        await soccerListPage.firstLeagueHeader.click();
        await expect(firstMatchCard).not.toHaveAttribute('data-item-group-index', '0');

        await soccerListPage.firstLeagueHeader.click();
        await expect(firstMatchCard).toHaveAttribute('data-item-group-index', '0');
    });
})