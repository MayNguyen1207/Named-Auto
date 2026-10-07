import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailChatPage } from '../../../../pages/sports/soccer/SoccerDetailChatPage';
import loginData from '../../../../data-test/login-data.json';
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
        const starCandyImg = soccerDetailChatPage.starCandyBtn.locator('img').first();
        let expectedAfterSecondClick = '';

        await soccerDetailChatPage.openMsgActionMenu(chatItem);
        await test.step('Click star candy button for the 1st time', async () => {
            await soccerDetailChatPage.starCandyBtn.click();
            await expect(starCandyImg).toHaveAttribute('alt', /star_candy-(active|inactive)/);

            const stateAfterFirstClick = await starCandyImg.getAttribute('alt');
            expectedAfterSecondClick = stateAfterFirstClick === 'star_candy-active' ? 'star_candy-inactive' : 'star_candy-active';
        });

        await test.step('Click star candy button for the 2nd time', async () => {
            await page.waitForTimeout(1000);
            await soccerDetailChatPage.starCandyBtn.click();
            await expect(starCandyImg).toHaveAttribute('alt', expectedAfterSecondClick);
        });
    });

    test('[Soccer] User can vote up and vote down message', async () => {
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();
        await soccerDetailChatPage.openMsgActionMenu(chatItem);

        await test.step('Click voteUpBtn => voteUpBtn gets opacity-20, voteDownBtn stays normal', async () => {
            await soccerDetailChatPage.voteUpBtn.click();
            await expect(soccerDetailChatPage.voteUpBtn).toHaveClass(/opacity-20/);
            await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);
        });

        await test.step('Click voteUpBtn again => toggle off, both return to normal', async () => {
            await soccerDetailChatPage.voteUpBtn.click();
            await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);
            await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);
        });

        await test.step('Click voteDownBtn => voteDownBtn gets opacity-20, voteUpBtn stays normal', async () => {
            await soccerDetailChatPage.voteDownBtn.click();
            await expect(soccerDetailChatPage.voteDownBtn).toHaveClass(/opacity-20/);
            await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);
        });

        await test.step('Click voteDownBtn again => toggle off, both return to normal', async () => {
            await soccerDetailChatPage.voteDownBtn.click();
            await expect(soccerDetailChatPage.voteUpBtn).not.toHaveClass(/opacity-20/);
            await expect(soccerDetailChatPage.voteDownBtn).not.toHaveClass(/opacity-20/);
        });
    });

    test('[Soccer] User can reply a message', async ({ page }) => {
        test.fail(true, "Temporarily use production API");
        const expectedUserName = loginData.nonverifiedUser.expectedUserName;
        const replyMsg = `Reply-${Date.now()}`;
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();

        await test.step('Open action menu on the non-verified-user message and click replyBtn', async () => {
            await soccerDetailChatPage.openMsgActionMenu(chatItem);
            await page.waitForTimeout(300);
            await soccerDetailChatPage.replyBtn.click();
        });

        await test.step('Verify replyLabel shows "@{expectedUserName} 님에게 답장"', async () => {
            await expect(soccerDetailChatPage.replyLabel).toBeVisible();
            await expect(soccerDetailChatPage.replyLabel).toContainText(`@${expectedUserName} 님에게 답장`);
        });

        await test.step('Type reply message and send it', async () => {
            await soccerDetailChatPage.sendMsg(replyMsg);
        });

        await test.step('Verify the sent message has msgToReply containing the original message content', async () => {
            const sentChatItem = soccerDetailChatPage.chatItems.filter({ hasText: replyMsg }).last();
            const { msgToReply } = await soccerDetailChatPage.getChatItemElements(sentChatItem);
            await expect(msgToReply).toBeVisible();
            await expect(msgToReply).toContainText(postedMsgContent);

            await test.step('Click msgToReply => the original replied message is visible in chat', async () => {
                await msgToReply.click();
                await expect(chatItem).toBeVisible();
            });
        });
    });

    test('[Soccer] User can cancel the reply action', async ({ page }) => {
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();
        await soccerDetailChatPage.openMsgActionMenu(chatItem);
        await page.waitForTimeout(300);

        await soccerDetailChatPage.replyBtn.click();
        await expect(soccerDetailChatPage.replyLabel).toBeVisible();

        await soccerDetailChatPage.closeReplyLableBtn.click();
        await expect(soccerDetailChatPage.replyLabel).toBeHidden();
    });

    test('[Soccer] Dropdown menu content is shown when user clicks threeDotsBtn', async () => {
        const chatItem = soccerDetailChatPage.chatItems.filter({ hasText: postedMsgContent }).last();
        await soccerDetailChatPage.openMsgActionMenu(chatItem);
        await soccerDetailChatPage.threeDotsBtn.click();

        await expect(soccerDetailChatPage.threeDotsMenu).toBeVisible();
        await expect(soccerDetailChatPage.menuStarCandyBtn).toBeVisible();
        await expect(soccerDetailChatPage.menuVoteUpBtn).toBeVisible();
        await expect(soccerDetailChatPage.menuVoteDownBtn).toBeVisible();
        await expect(soccerDetailChatPage.menuReplyBtn).toBeVisible();
        await expect(soccerDetailChatPage.menuReportBtn).toBeVisible();
        await expect(soccerDetailChatPage.menuBlockBtn).toBeVisible();
    })
})