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
    const readyGame = games.find((game: any) => game.gameStatus === 'READY');
    expect(readyGame, 'No READY match found').toBeDefined();
    matchId = readyGame.id;
});

test.describe('[Soccer] Guest Flow', () => {
    test('[Cheer Chat] Guest is required to login when attemping to send power chat', async ({ page }) => {
        const soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);

        await soccerDetailChatPage.powerChatBtn.click();
        await expect(soccerDetailChatPage.moveLogin).toBeVisible();

        await soccerDetailChatPage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`);

        await soccerDetailChatPage.powerChatBtn.click();
        await soccerDetailChatPage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(`/login?callbackUrl=%2Fmatch%2Fsoccer%2F${matchId}%2Fodds`);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.userC.email, loginData.userC.password);
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`, { timeout: 10000 });
    })
});

test.describe('[Soccer] User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Power Chat] Popup title, guide texts and user info are displayed normally', async () => {
        await soccerDetailChatPage.powerChatBtn.click();
        await expect(soccerDetailChatPage.powerChatAreaTitle).toBeVisible();
        await expect(soccerDetailChatPage.guideTxt).toBeVisible();
        await expect(soccerDetailChatPage.userAvatar).toBeVisible();
        await expect(soccerDetailChatPage.userNick).toHaveText(loginData.valid.expectedUsername);
        await expect(soccerDetailChatPage.noticeTxt).toBeVisible();
    });

    test('[Power Chat] User can close Power Chat popup', async () => {
        await soccerDetailChatPage.powerChatBtn.click();
        await soccerDetailChatPage.closePowerChatBtn.click();
        await expect(soccerDetailChatPage.powerChatArea).not.toBeVisible();
    });

    test('[Power Chat] User can send a power chat message normally', async ({ page, request, apiBaseURL }) => {
        const pinMsg = chatData.powerChat.valid.msg;
        const expectedPinMsg = chatData.powerChat.valid.expectedPinMsg;
        
        const cookies = await page.context().cookies();
        const sessionId = cookies.find(c => c.name === 'dev_session_id')?.value;
        
        const pointInfoRes = await request.get(`${apiBaseURL}/me/point/info`, {
            headers: {
                'NAMED-SESSION': sessionId || ''
            }
        });
        expect(pointInfoRes.ok(), `Failed to fetch points: ${await pointInfoRes.text()}`).toBeTruthy();
        const pointInfo = await pointInfoRes.json();
        const initialPoint = Number(pointInfo.total_point);

        await soccerDetailChatPage.powerChatBtn.click();
        await soccerDetailChatPage.powerChatInput.fill(pinMsg);
        await soccerDetailChatPage.sendPowerChatBtn.click();

        await expect(soccerDetailChatPage.pinPowerChat.last()).toBeVisible();
        await expect(soccerDetailChatPage.pinPowerChat.last().locator('span', { hasText: expectedPinMsg })).toBeVisible();

        await page.waitForTimeout(1000);

        const sentItem = soccerDetailChatPage.chatItems.filter({ hasText: expectedPinMsg }).last();
        const { awardTxt } = await soccerDetailChatPage.getChatItemElements(sentItem);
        let awardPoint = 0;
        if (await awardTxt.isVisible()) {
            const awardText = await awardTxt.innerText();
            const match = awardText.match(/\[(\d+)\s*포인트\]/);
            if (match) {
                awardPoint = parseInt(match[1], 10);
            }
        }

        const pointInfoResAfter = await request.get(`${apiBaseURL}/me/point/info`, {
            headers: {
                'NAMED-SESSION': sessionId || ''
            }
        });
        expect(pointInfoResAfter.ok(), `Failed to fetch points after chat: ${await pointInfoResAfter.text()}`).toBeTruthy();
        const pointInfoAfter = await pointInfoResAfter.json();
        const finalPoint = Number(pointInfoAfter.total_point);

        expect(initialPoint - finalPoint + awardPoint).toBe(100000);
    });

    const invalidPowerChatCases = chatData.powerChat.invalid;
    for (const { name, msg, toastMsg } of invalidPowerChatCases) {
        test(`${name} power message shows toast error`, async () => {
            await test.step(`Fill input with "${name}" message and send`, async () => {
                await soccerDetailChatPage.powerChatBtn.click();
                await soccerDetailChatPage.powerChatInput.fill(msg);
                await soccerDetailChatPage.sendPowerChatBtn.click();
            });

            await test.step(`Toast "${toastMsg}" should be visible`, async () => {
                await soccerDetailChatPage.verifyToastMsg('error', toastMsg!);
                await expect(soccerDetailChatPage.powerChatArea).not.toBeVisible();
            });
        });
    };
});

test.describe('[Soccer] Lack of point', () => {
    test.use({ storageState: 'playwright/.auth/non-verified-user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Power Chat] User has less than 100000 points cannot send Power Chat', async () => {
        await soccerDetailChatPage.powerChatBtn.click();
        await soccerDetailChatPage.powerChatInput.fill(chatData.powerChat.valid.msg);
        await soccerDetailChatPage.sendPowerChatBtn.click();

        await soccerDetailChatPage.verifyToastMsg('error', chatData.powerChat.lackPointMsg);
        await expect(soccerDetailChatPage.powerChatArea).not.toBeVisible();
    });
});