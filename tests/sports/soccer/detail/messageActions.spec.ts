import { test, expect } from '../../../../utils/fixtures';
import { LoginPage } from '../../../../pages/LoginPage';
import { SoccerDetailChatPage } from '../../../../pages/sports/soccer/SoccerDetailChatPage';
import loginData from '../../../../data-test/login-data.json';
import chatData from '../../../../data-test/cheer-chat-data.json';
import fs from 'fs';
import path from 'path';

let matchId: any;
let postedMsgContent: string;
test.beforeAll(async ({ request, sportsApiBaseURL, apiBaseURL }) => {
    const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
    expect(response.ok()).toBeTruthy();
    const games = await response.json();
    const validGames = games.filter((game: any) => ['FINAL'].includes(game.gameStatus));
    expect(validGames.length, 'No FINAL match found').toBeGreaterThan(0);
    const randomGame = validGames[Math.floor(Math.random() * validGames.length)];
    matchId = randomGame.id;

    const authData = JSON.parse(fs.readFileSync(path.resolve('playwright/.auth/non-verified-user.json'), 'utf-8'));
    const sessionId = authData.cookies.find((c: any) => c.name === 'dev_session_id')?.value;

    postedMsgContent = `${Date.now()}`;
    const cheerResponse = await request.post(`${apiBaseURL}/sport/games/${matchId}/cheer`, {
        headers: { 'NAMED-SESSION': sessionId },
        data: {
            content: postedMsgContent,
            device: 'WEB',
            id: matchId,
            sports_id: 1
        }
    });
    expect(cheerResponse.ok()).toBeTruthy();
});

test.describe('User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Soccer] User can turn on/off Star Candy of other users', async ({ page }) => {
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();
        const starCandyImg = soccerDetailChatPage.starCandyBtn.locator('img');

        await soccerDetailChatPage.openMsgActionMenu(chatItem);
        await soccerDetailChatPage.starCandyBtn.click();
        const stateAfterFirstClick = await starCandyImg.getAttribute('alt');
        const expectedAfterSecondClick = stateAfterFirstClick === 'star_candy-active' ? 'star_candy-inactive' : 'star_candy-active';

        await page.waitForTimeout(1000);
        await soccerDetailChatPage.starCandyBtn.click();
        await expect(starCandyImg).toHaveAttribute('alt', expectedAfterSecondClick);
    });

    test('[Soccer] User can vote up and vote down message', async () => {
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();

        // Click voteUpBtn => voteUpBtn gets opacity-20, voteDownBtn stays normal
        await soccerDetailChatPage.openMsgActionMenu(chatItem);
        await soccerDetailChatPage.voteUpBtn.click();
        await expect(soccerDetailChatPage.voteUpBtn).toHaveClass(/opacity-20/);
        await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);

        // Click voteUpBtn again => toggle off, both return to normal
        await soccerDetailChatPage.voteUpBtn.click();
        await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);
        await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);

        // Click voteDownBtn => voteDownBtn gets opacity-20, voteUpBtn stays normal
        await soccerDetailChatPage.voteDownBtn.click();
        await expect(soccerDetailChatPage.voteDownBtn).toHaveClass(/opacity-20/);
        await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);

        // Click voteDownBtn again => toggle off, both return to normal
        await soccerDetailChatPage.voteDownBtn.click();
        await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);
        await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);
    })
})