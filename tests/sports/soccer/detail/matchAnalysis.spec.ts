import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailPage } from '../../../../pages/sports/soccer/SoccerDetailPage';
import { LoginPage } from '../../../../pages/LoginPage';
import matchData from '../../../../data-test/match-detail-data.json';
import loginData from '../../../../data-test/login-data.json';

test.describe('No data', () => {
    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.noAnalysisPost;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateAnalysis(matchId);
    });

    test('[Soccer] Title, table headers should be displayed', async () => {
        await expect(soccerDetailPage.tabTitle).toBeVisible();
        
        const headers = ['제목', '작성자', '조회', '추천'];
        await expect(soccerDetailPage.tableHeaderCells).toHaveText(headers);
    });

    test('[Soccer] No Analysis post text should be displayed', async () => {
        await expect(soccerDetailPage.noPostTxt).toBeVisible();
    });
});

test.describe('Have data', () => {
    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.haveAnalysisPost;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateAnalysis(matchId);
    });

    test('[Soccer] Analysis post data should be displayed correctly', async ({ request, apiBaseURL}) => {
        const response = await request.get(`${apiBaseURL}/community/board?board_type=sports_analysis&page=1&game_id=${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const list: any[] = data.list ?? [];

        for (const item of list) {
            const { wr_id, home_team, away_team, wr_subject, wr_name, wr_hit, wr_good } = item;

            const prefix = `${home_team} VS ${away_team}`;
            const expectedSubject = wr_subject.startsWith(prefix)
                ? wr_subject.slice(prefix.length).trim()
                : wr_subject.trim();

            const row = soccerDetailPage.getAnalysisTableRow(wr_id);
            const cells = row.locator('td');

            await expect.soft(cells.nth(0)).toContainText(expectedSubject);
            await expect.soft(cells.nth(1)).toHaveText(wr_name);
            await expect.soft(cells.nth(2)).toHaveText(String(wr_hit));
            await expect.soft(cells.nth(3)).toHaveText(String(wr_good));
        }
    });

    test('[Soccer] User can click to open the post in a popup', async ({ page, request, apiBaseURL }) => {
        const response = await request.get(`${apiBaseURL}/community/board?board_type=sports_analysis&page=1&game_id=${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const list: any[] = data.list ?? [];

        const firstPost = list[0];
        const { wr_id: postId } = firstPost;
        const row = soccerDetailPage.getAnalysisTableRow(postId);
        const cells = row.locator('td');

        await cells.first().click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis?postId=${postId}`);
        await expect(soccerDetailPage.analysisPostPopup).toBeVisible()
    });
});

test.describe('Write button', () => {
    let soccerDetailPage: SoccerDetailPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailPage = new SoccerDetailPage(page);
        await soccerDetailPage.navigateAnalysis(matchId);
    });

    test('[Soccer] Move to Login popup should be shown when guest click Write button', async ({ page }) => {
        await soccerDetailPage.writeBtn.click();
        await expect(soccerDetailPage.moveLogin).toBeVisible();

        await soccerDetailPage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis`);

        await soccerDetailPage.writeBtn.click();
        await soccerDetailPage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(/.*\/login/);
        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis`);
    });

    test.describe('Normal user', () => {
        test.use({ storageState: 'playwright/.auth/user.json' });

        test('[Soccer] Write Post screen should be opened when user click Write button', async ({ page }) => {
            await soccerDetailPage.writeBtn.click();
            await expect(soccerDetailPage.createAnalysisPostPopup).toBeVisible();
            await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis?boardType=sports_analysis`);
        });
    });
})