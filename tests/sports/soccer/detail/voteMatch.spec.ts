import { test, expect } from '../../../../utils/fixtures';
import { LoginPage } from '../../../../pages/LoginPage';
import { SoccerDetailChatPage } from '../../../../pages/sports/soccer/SoccerDetailChatPage';
import loginData from '../../../../data-test/login-data.json';
import chatData from '../../../../data-test/cheer-chat-data.json';

let matchId: any;
test.beforeAll(async ({ request, sportsApiBaseURL }) => {
    const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/today-games?tomorrow-game-flag=true`);
    expect(response.ok()).toBeTruthy();
    const games = await response.json();
    const validGames = games.filter((game: any) => ['READY', 'IN_PROGRESS', 'BREAK_TIME'].includes(game.gameStatus));
    expect(validGames.length, 'No READY, IN_PROGRESS, or BREAK_TIME match found').toBeGreaterThan(0);
    const randomGame = validGames[Math.floor(Math.random() * validGames.length)];
    matchId = randomGame.id;
});

test.describe('Guest Flow', () => {
    test('[Soccer] Guest is required to login when attemping to vote', async ({ page }) => {
        const soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);

        await soccerDetailChatPage.voteWinBtn.click();
        await expect(soccerDetailChatPage.moveLogin).toBeVisible();

        await soccerDetailChatPage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`);

        await soccerDetailChatPage.voteWinBtn.click();
        await soccerDetailChatPage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(`/login?callbackUrl=%2Fmatch%2Fsoccer%2F${matchId}%2Fodds`);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.userC.email, loginData.userC.password);
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`, { timeout: 10000 });
    });
});

test.describe('User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Soccer] A confirmation dialog is shown after user click to vote', async () => {
        const votes = [
            { btn: soccerDetailChatPage.voteWinBtn, label: '승리' },
            { btn: soccerDetailChatPage.voteDrawBtn, label: '무승부' },
            { btn: soccerDetailChatPage.voteLoseBtn, label: '패배' }
        ];

        for (const vote of votes) {
            await vote.btn.click();
            await expect(soccerDetailChatPage.noticeDialog).toBeVisible();
            await expect(soccerDetailChatPage.noticeDialog).toContainText(`'${vote.label}'로 예측을 확정하시겠습니까?`);
            await expect(soccerDetailChatPage.noticeDialog).toContainText('확정 후에는 변경할 수 없습니다.');
            await soccerDetailChatPage.dialogCancelBtn.click();
            await expect(soccerDetailChatPage.noticeDialog).toBeHidden();
        }
    });

    test('[Soccer] User can vote normally and vote counts are displayed correctly', async ({ request, apiBaseURL }) => {
        const response = await request.get(`${apiBaseURL}/sport/predictions/stats?game_id=${matchId}&sports_id=1`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const votes = [
            { btn: soccerDetailChatPage.voteWinBtn, count: data.stats.choice_win_count, shortLabel: '승' },
            { btn: soccerDetailChatPage.voteDrawBtn, count: data.stats.choice_draw_count, shortLabel: '무' },
            { btn: soccerDetailChatPage.voteLoseBtn, count: data.stats.choice_lose_count, shortLabel: '패' }
        ];

        for (const vote of votes) {
            await expect(vote.btn).toContainText(vote.count.toString());
        }

        const randomVote = votes[Math.floor(Math.random() * votes.length)];
        await randomVote.btn.click();
        await soccerDetailChatPage.dialogConfirmBtn.click();

        await soccerDetailChatPage.verifyToastMsg('success', chatData.voteSuccessMsg);
        await expect(randomVote.btn).toContainText((randomVote.count + 1).toString());

        for (const vote of votes) {
            await expect(vote.btn).toHaveClass(/pointer-events-none/);
            await expect(vote.btn).toHaveClass(/disabled:cursor-not-allowed/);
        }

        const testMsg = `vote teest ${Date.now()}`;
        await soccerDetailChatPage.sendMsg(testMsg);
        
        const myChatItem = soccerDetailChatPage.chatItems.filter({ hasText: testMsg }).last();
        const chatElements = await soccerDetailChatPage.getChatItemElements(myChatItem);
        await expect(chatElements.votedOption).toHaveText(randomVote.shortLabel);
    });
})