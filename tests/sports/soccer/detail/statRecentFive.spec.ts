import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/SoccerDetailPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('Have Recent 5 Matches Data', () => {

    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateStat(matchId);
    });

    test('[Soccer] 최근 5경기 table title and tabs are displayed correctly', async ({ request, sportsApiBaseURL }) => {
        await expect(soccerDetailPage.recentFiveTableTitle).toBeVisible();

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        const json = await response.json();
        const homeTeamName = json.teams.home.name
        const awayTeamName = json.teams.away.name

        await expect(soccerDetailPage.recentHomeTeamBtn).toHaveText(homeTeamName);
        await expect(soccerDetailPage.recentAwayTeamBtn).toHaveText(awayTeamName);
    })
})