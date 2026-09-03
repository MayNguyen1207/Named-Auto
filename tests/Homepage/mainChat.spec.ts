import { test, expect } from '@playwright/test';
import path from 'path';
import { HomePage } from '../../pages/HomePage';

test.describe('[Homepage] Main Chat UI Tests', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

    test.beforeEach(async ({ page }) => {
        const home = new HomePage(page);
        await home.navigate();
        await page.waitForTimeout(3000);
    });

    test('Verify main chat UI elements are visible', async ({ page }) => {
        const home = new HomePage(page);
        await expect(home.tabSports).toBeVisible();
        await expect(home.tabMiniGame).toBeVisible();
        await expect(home.chatMenuBtn).toBeVisible();
        await expect(page.getByRole('button', { name: '테마 채팅' })).toBeVisible();
        await expect(page.getByPlaceholder('메시지 입력하기')).toBeVisible();
        await expect(home.chatSendBtn).toBeVisible();
        await expect(home.chatSendBtn).toBeDisabled();
    });

    test('Send message and verify chat renders, then switch tab clears messages', async ({ page }) => {
        const home = new HomePage(page);
        await home.sendChatMessage('msgA');
        await expect(page.getByText('msgA').last()).toBeVisible();
        await expect(page.getByText('회원_6a4f116913831님 [1 포인트] 획득!').last()).toBeVisible();
        await home.tabSports.click();
        await expect(page.getByText('msgA').last()).not.toBeVisible();
    });

    test('Sports tab: send message then switch to Mini Game clears messages', async ({ page }) => {
        const home = new HomePage(page);
        await home.tabMiniGame.click();
        await page.waitForTimeout(500);
        await home.tabSports.click();
        await page.waitForTimeout(1000);
        await home.sendChatMessage('msgB');
        await expect(page.getByText('msgB').last()).toBeVisible();
        await expect(page.getByText('회원_6a4f116913831님 [1 포인트] 획득!').last()).toBeVisible();
        await home.tabMiniGame.click();
        await expect(page.getByText('msgB').last()).not.toBeVisible();
    });

    test('Chat input validation (max length, special chars, emoji, script)', async ({ page }) => {
        const home = new HomePage(page);
        await home.tabSports.click();
        await page.waitForTimeout(1000);
        const { chatInput: input, chatSendBtn: send } = home;

        await input.fill('This is a long message created to test the maximum character limit of the message input field. The content is intentionally extended with multiple sentences and paragraphs to simulate a real user message containing a large amount of text');
        await send.click();
        await expect(page.getByText('채팅 최대 글자를 초과하였습니다.', { exact: true })).toBeVisible();

        for (const [msg, locator] of [
            ['%$@Sad', page.getByText('%$@Sad').last()],
            ['😊', page.getByText('😊').last()],
            ["<script>alert('x')</script>", page.getByText("<script>alert('x')</script>").last()],
        ] as [string, import('@playwright/test').Locator][]) {
            await input.fill(msg);
            await send.click();
            await expect(locator).toBeVisible();
        }

        const a1CountBefore = await page.getByText('a1').count();
        await input.fill('a1'); await send.click();
        await input.fill('a1'); await send.click();
        await expect(page.getByText('a1')).toHaveCount(a1CountBefore + 2);
    });

    test('Chat settings menu operations (Popup, Clear, Font size, Refresh)', async ({ page, context }) => {
        const home = new HomePage(page);
        await home.sendChatMessage('msgA');
        const msgLocator = page.getByText('msgA').last();
        await expect(msgLocator).toBeVisible();
        const fontSize = (el: Element) => window.getComputedStyle(el).fontSize;

        const pagePromise = context.waitForEvent('page');
        await home.openChatMenu('새창');
        const chatWindow = await pagePromise;
        await chatWindow.waitForLoadState();
        expect(chatWindow.url()).toContain('chat?site_id=lottery&is_popup=true');
        await chatWindow.close();

        const sizeBefore = await msgLocator.evaluate(fontSize);
        await home.openChatMenu('글자 크게');
        await page.waitForTimeout(500);
        expect(sizeBefore).not.toBe(await msgLocator.evaluate(fontSize));

        const sizeAfterIncrease = await msgLocator.evaluate(fontSize);
        await page.getByRole('menuitem', { name: '글자 작게' }).click();
        await page.waitForTimeout(500);
        expect(sizeAfterIncrease).not.toBe(await msgLocator.evaluate(fontSize));

        await page.getByRole('menuitem', { name: '새로고침' }).click();
        await page.waitForTimeout(1000);
        await expect(page.getByText('msgA').last()).toBeVisible();
        await home.openChatMenu('채팅 지우기');
        await expect(page.locator('div').filter({ hasText: '방청소완료!' }).nth(5)).toBeVisible();
    });

    test('Verify chat event point in mypage', async ({ page }) => {
        const home = new HomePage(page);
        await home.sendChatMessage('point');
        await page.getByRole('link', { name: '마이페이지' }).click();
        await page.getByTestId('navigation-menu-item-mypage.point').getByRole('link', { name: '포인트' }).click();
        await page.getByText('채팅 이벤트 당첨').click();
        await expect(page.getByText('채팅 이벤트 당첨').first()).toBeVisible();
        await expect(page.locator('div').filter({ hasText: '+1' }).first()).toBeVisible();
    });

});

const chatSettings = [
    {
        setting: '모두',
        expectedUrl: 'http://dev-v2.named.net/chat/one-on-one?target_user_id=7gjo29i49dbae77bddfad8a5568e1e572ec5ebdb&target_site_id=lottery&target_nickname=%ED%9A%8C%EC%9B%90_6a4f116913831&type=request&is_popup=true',
        expectedMessage: null
    },
    {
        setting: '친구만',
        expectedUrl: null,
        expectedMessage: '회원_6a4f116913831님은 1:1 채팅 요청 거부중입니다.'
    },
    {
        setting: '허용안함',
        expectedUrl: null,
        expectedMessage: '회원_6a4f116913831님은 1:1 채팅 요청 거부중입니다.'
    }
];

test.describe('[Homepage] 1-on-1 Chat Request Settings', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

    for (const { setting, expectedUrl, expectedMessage } of chatSettings) {
        test(`1-on-1 chat request (수신 설정: ${setting})`, async ({ page, browser }) => {
            const home = new HomePage(page);
            await home.navigate();
            await page.waitForTimeout(3000);

            await page.getByRole('button', { name: '채팅', exact: true }).click();
            await page.getByRole('menuitem', { name: '수신 설정' }).click();
            await page.getByRole('radio', { name: setting }).click();
            await page.getByTestId('dialog-close').click();

            const secondContext = await browser.newContext({
                storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json')
            });
            const secondPage = await secondContext.newPage();

            const secondHome = new HomePage(secondPage);
            await secondHome.navigate();
            await secondPage.waitForTimeout(3000);

            await secondPage.getByText('회원_6a4f11691383155').last().click();
            const popupPromise = secondPage.waitForEvent('popup');
            await secondPage.getByRole('menuitem', { name: '채팅 신청 채팅 신청' }).click();
            const chatPopup = await popupPromise;

            await chatPopup.getByTestId('chat-request-action-button').click();

            if (expectedUrl) {
                await expect(chatPopup).toHaveURL(expectedUrl);
            } else if (expectedMessage) {
                await expect(chatPopup.getByText(expectedMessage)).toBeVisible();
            }
            await secondContext.close();
        });
    }
});


test.describe('[Homepage] Main Chat UI Tests (Guest)', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/guest.json') });

    test.beforeEach(async ({ page }) => {
        const home = new HomePage(page);
        await home.navigate();
        await page.waitForTimeout(3000);
    });

    test('Guest user is prompted to login when sending chat', async ({ page }) => {
        await page.getByTestId('input-field').fill('Nolog');
        await page.locator('.tabler-icon.tabler-icon-send-2').click();
        await expect(page.locator('span').filter({ hasText: '로그인 화면으로 이동' }).first()).toBeVisible();
        await expect(page.locator("img[alt='require login']")).toBeVisible();
        await expect(page.locator('p.wrap-break-word.overflow-wrap-anywhere')).toBeVisible();
        await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
        await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
        await expect(page.getByText('아직! 네임드 회원이 아니신가요? 간편 회원 가입하러 가기', { exact: true })).toBeVisible();
        await page.getByRole('link', { name: '간편 회원 가입하러 가기' }).click();
        await expect(page).toHaveURL('/register');
    });
});

test.describe('[Homepage] Main Chat UI Tests (Admin)', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/admin.json') });

    test.beforeEach(async ({ page }) => {
        const home = new HomePage(page);
        await home.navigate();
        await page.waitForTimeout(3000);
    });

    test('Admin can freeze and unfreeze chat room', async ({ page }) => {
        const chatMenu = page.getByRole('button', { name: '채팅', exact: true });
        await chatMenu.click();
        await page.getByRole('menuitem', { name: '채팅방 얼리기' }).click();
        await expect(page.getByText('관리자가 채팅방을 얼렸습니다. 개인 채팅이 금지됩니다')).toBeVisible();
        await chatMenu.click();
        await page.getByRole('menuitem', { name: '채팅방 녹이기' }).click();
        await expect(page.getByText('관리자가 방을 녹였습니다. 이제 채팅이 가능합니다')).toBeVisible();
    });

    test('Chat messages should be isolated between Minigame and Sports tabs', async ({ page }) => {
        const home = new HomePage(page);

        await page.getByRole('button', { name: '일반 채팅' }).click();
        await page.getByTestId('dropdown-menu-sub-trigger').click();
        await page.getByRole('menuitem', { name: '미니게임' }).click();

        await home.sendChatMessage('minigame');
        await expect(page.getByText('minigame')).toBeVisible();

        await page.getByRole('radio', { name: '스포츠' }).click();
        await expect(page.getByText('minigame')).toBeHidden();

        await page.getByRole('button', { name: '공지 > 미니게임' }).click();
        await page.getByTestId('dropdown-menu-sub-trigger').click();
        await page.getByRole('menuitem', { name: '스포츠' }).click();

        await home.sendChatMessage('sport');
        await expect(page.getByText('sport')).toBeVisible();

        await page.getByRole('radio', { name: '미니게임' }).click();
        await expect(page.getByText('sport')).toBeHidden();
    });

    test('Admin messages to "All" tab should be visible in User Sports and Minigame tab', async ({ page, browser }) => {
        const minigameChat = page;
        const minigameChatHome = new HomePage(minigameChat);

        const sportChatContext = await browser.newContext({
            storageState: path.resolve(__dirname, '../../playwright/.auth/user.json')
        });
        const sportChat = await sportChatContext.newPage();
        const sportChatHome = new HomePage(sportChat);

        await sportChatHome.navigate();
        await sportChat.waitForTimeout(3000);

        await sportChat.getByRole('radio', { name: '스포츠' }).click();

        await minigameChat.getByRole('button', { name: '일반 채팅' }).click();
        await minigameChat.getByTestId('dropdown-menu-sub-trigger').click();
        await minigameChat.getByRole('menuitem', { name: '전체' }).click();

        await minigameChatHome.sendChatMessage('all');

        await expect(minigameChat.getByText('all', { exact: true }).last()).toBeVisible();
        await expect(sportChat.getByText('all', { exact: true }).last()).toBeVisible();

        await sportChatContext.close();
    });
});
