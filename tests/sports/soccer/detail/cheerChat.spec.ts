import { test, expect } from '../../../../utils/fixtures';
import { LoginPage } from '../../../../pages/LoginPage';
import { SoccerDetailChatPage } from '../../../../pages/sports/soccer/SoccerDetailChatPage';
import matchData from '../../../../data-test/match-detail-data.json';
import loginData from '../../../../data-test/login-data.json';
import chatData from '../../../../data-test/cheer-chat-data.json';

test.describe('[Soccer] Guest Flow', () => {
    let soccerDetailChatPage: SoccerDetailChatPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Cheer Chat] Guest is required to login when attemping to chat', async ({ page }) => {
        await soccerDetailChatPage.msgInput.fill('a');
        await soccerDetailChatPage.sendMsgBtn.click();
        await expect(soccerDetailChatPage.moveLogin).toBeVisible();

        await soccerDetailChatPage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`);

        await soccerDetailChatPage.sendMsgBtn.click();
        await soccerDetailChatPage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(`/login?callbackUrl=%2Fmatch%2Fsoccer%2F${matchId}%2Fodds`);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.userC.email, loginData.userC.password);
        await expect(page).toHaveURL(`/match/soccer/${matchId}/odds`, { timeout: 10000 });
    });

    test('[Cheer Chat] Cheer Chat area title and number of message is displayed correctly', async ({ page, request, apiBaseURL }) => {
        const matchId = matchData.matchLink.normal;
        const soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);

        await expect(soccerDetailChatPage.chatBoxTitle).toBeVisible();

        const response = await request.get(`${apiBaseURL}/sport/comment-mobile?game_id=${matchId}&sports_id=1&page=1&limit=1000`);
        expect(response.ok(), 'Failed to fetch comment list').toBeTruthy();
        const body = await response.json();
        const totalCnt = body.total_cnt;

        await expect(soccerDetailChatPage.chatCount).toHaveText(totalCnt.toString());
    });
})

test.describe('[Soccer] User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Cheer Chat] User can send message and message is displayed normally', async ({ page, request, apiBaseURL }) => {
        const message = `${chatData.message.valid} ${Date.now()}`;
        const expectedUsername = loginData.valid.expectedUsername;

        await test.step('Send a message', async () => {
            await soccerDetailChatPage.sendMsg(message);
        });

        const sentItem = soccerDetailChatPage.chatItems.filter({ hasText: message }).last();
        await expect(sentItem).toBeVisible({ timeout: 5000 });
        const { userAvatar, userNick, message: msgEl, time, starCandyBtn, awardTxt } = await soccerDetailChatPage.getChatItemElements(sentItem);

        await test.step('userAvatar should be visible', async () => {
            await expect(userAvatar).toBeVisible();
        });

        await test.step('userNick should match expectedUsername', async () => {
            await expect(userNick).toHaveText(expectedUsername);
        });

        await test.step('message content should match sent message', async () => {
            await expect(msgEl).toHaveText(message);
        });

        await test.step('time should be displayed in HH:mm format', async () => {
            await expect(time).toBeVisible();
            const timeText = (await time.innerText()).trim();
            expect(timeText).toMatch(/^\d{2}:\d{2}$/);
        });

        await test.step('starCandyBtn should be visible', async () => {
            await expect(starCandyBtn).toBeVisible();
        });

        await test.step('awardTxt should match format if visible', async () => {
            const isVisible = await awardTxt.isVisible();
            if (isVisible) {
                const awardText = (await awardTxt.innerText()).trim();
                expect(awardText).toMatch(new RegExp(`^${expectedUsername}님 \\[\\d+ 포인트\\] 획득!$`));

                await test.step('Verify points were credited via API', async () => {
                    const cookies = await page.context().cookies();
                    const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
                    const headers: Record<string, string> = sessionCookie ? { 'NAMED-SESSION': sessionCookie.value } : {};

                    const today = new Date().toISOString().slice(0, 10);
                    const response = await request.get(
                        `${apiBaseURL}/me/point?start_dt=${today}&end_dt=${today}`,
                        { headers }
                    );
                    expect(response.ok()).toBeTruthy();

                    const body = await response.json();
                    const cheerEntry = body.list?.find((item: any) => item.po_content === '스포츠 채팅 이벤트');
                    expect(cheerEntry, 'Point entry for 스포츠 채팅 이벤트 should exist').toBeDefined();
                    expect(parseFloat(cheerEntry.get_point)).toBeGreaterThan(0);
                });
            }
        });
    });

    test.describe('[Cheer Chat] Verify sending invalid message', () => {
        const invalid = chatData.message.invalid;
        const toastCases = invalid.filter(i => i.toastMsg && i.name !== 'duplicateMsg');
        const expectedMsgCases = invalid.filter(i => i.expectedMsg);

        for (const { name, msg, toastMsg } of toastCases) {
            test(`${name} message shows toast error`, async () => {
                await test.step(`Fill input with "${name}" message and send`, async () => {
                    await soccerDetailChatPage.msgInput.fill(msg);
                    await soccerDetailChatPage.sendMsgBtn.click();
                });

                await test.step(`Toast "${toastMsg}" should be visible`, async () => {
                    await soccerDetailChatPage.verifyToastMsg('error', toastMsg!);
                });
            });
        }

        for (const { name, msg, expectedMsg } of expectedMsgCases) {
            test(`[Cheer Chat] ${name} message is displayed as "${name === 'xss' ? 'plain text' : 'sanitized text'}"`, async () => {
                const suffix = ` ${Date.now()}`;
                const msgToSend = msg + suffix;
                const expectedText = expectedMsg! + suffix;

                await test.step(`Send "${name}" message`, async () => {
                    await soccerDetailChatPage.sendMsg(msgToSend);
                });

                await test.step(`Message should appear in chat as expected`, async () => {
                    const sentItem = soccerDetailChatPage.chatItems.filter({ hasText: expectedText }).last();
                    await expect(sentItem).toBeVisible({ timeout: 5000 });

                    const { message: msgEl } = await soccerDetailChatPage.getChatItemElements(sentItem);
                    await expect(msgEl).toHaveText(expectedText);
                });
            });
        }

        test('[Cheer Chat] Duplicate messages show repeated-message toast', async () => {
            const { msg, toastMsg } = invalid.find(i => i.name === 'duplicateMsg')!;
            const msgToSend = msg + `${Date.now()}`;

            await test.step('Send first message', async () => {
                await soccerDetailChatPage.sendMsg(msgToSend);
            });

            await test.step('Send same message again', async () => {
                await soccerDetailChatPage.msgInput.fill(msgToSend);
                await soccerDetailChatPage.sendMsgBtn.click();
            });

            await test.step(`Toast "${toastMsg}" should be visible`, async () => {
                await soccerDetailChatPage.verifyToastMsg('error', toastMsg!);
            });
        });
    });

    test('[Cheer Chat] User can send message with a valid image', async ({ page }) => {
        const message = `Auto message image ${Date.now()}`;
        const imagePath = chatData.image.valid;

        await test.step('Upload image via uploadImgBtn', async () => {
            const [fileChooser] = await Promise.all([
                soccerDetailChatPage.page.waitForEvent('filechooser'),
                soccerDetailChatPage.uploadImgBtn.click(),
            ]);
            await fileChooser.setFiles(imagePath);
        });

        await page.waitForTimeout(5000);
        await test.step('Image preview should be visible and fully loaded', async () => {
            await expect(soccerDetailChatPage.imgPreview).toBeVisible({ timeout: 5000 });
            await soccerDetailChatPage.page.waitForFunction(
                () => {
                    const img = document.querySelector("img[alt='Uploaded preview']") as HTMLImageElement;
                    return img !== null && img.complete && img.naturalWidth > 0;
                },
                { timeout: 5000 }
            );
        });

        await test.step('Fill message and send', async () => {
            await soccerDetailChatPage.msgInput.fill(message);
            await soccerDetailChatPage.sendMsgBtn.click();
        });

        await test.step('Chat item should contain the sent image', async () => {
            const sentItem = soccerDetailChatPage.chatItems.filter({ hasText: message }).last();
            await expect(sentItem).toBeVisible({ timeout: 5000 });

            const chatImage = sentItem.getByTestId('popover-trigger').locator('img');
            await expect(chatImage).toBeVisible({ timeout: 5000 });
            await expect(chatImage).toHaveAttribute('src', /.+/);
        });
    });

    test('[Cheer Chat] User cannot send an image in invalid format', async () => {
        const imagePath = chatData.image.invalid[0].invalidFormat;
        const expectedToast = chatData.image.invalid[0].msg;

        await test.step('Upload invalid image via uploadImgBtn', async () => {
            const [fileChooser] = await Promise.all([
                soccerDetailChatPage.page.waitForEvent('filechooser'),
                soccerDetailChatPage.uploadImgBtn.click(),
            ]);
            await fileChooser.setFiles(imagePath);
        });

        await test.step('Image is not uploaded and toast error should be visible', async () => {
            await soccerDetailChatPage.verifyToastMsg('error', expectedToast);
            await expect(soccerDetailChatPage.imgPreview).not.toBeVisible({ timeout: 5000 });
        });
    });

    test('[Cheer Chat] Send button is disabled when message is empty and user can delete the image', async () => {
        const imagePath = chatData.image.valid;

        await test.step('Upload valid image via uploadImgBtn', async () => {
            const [fileChooser] = await Promise.all([
                soccerDetailChatPage.page.waitForEvent('filechooser'),
                soccerDetailChatPage.uploadImgBtn.click(),
            ]);
            await fileChooser.setFiles(imagePath);
        });

        await test.step('Image preview should be visible and fully loaded', async () => {
            await expect(soccerDetailChatPage.imgPreview).toBeVisible({ timeout: 5000 });
            await soccerDetailChatPage.page.waitForFunction(
                () => {
                    const img = document.querySelector("img[alt='Uploaded preview']") as HTMLImageElement;
                    return img !== null && img.complete && img.naturalWidth > 0;
                },
                { timeout: 5000 }
            );
        });

        await test.step('Send button should be disabled when message is empty', async () => {
            await expect(soccerDetailChatPage.sendMsgBtn).toBeDisabled();
        });

        await test.step('Delete image preview', async () => {
            await soccerDetailChatPage.deleteImgPreviewBtn.click();
            await expect(soccerDetailChatPage.imgPreview).not.toBeVisible();
        });
    });
})
