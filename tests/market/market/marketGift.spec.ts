import { test, expect } from '../../../utils/fixtures';
import { GiftPopupPage } from '../../../pages/market/market/GiftPopupPage';
import loginData from '../../../data-test/login-data.json';
import marketData from '../../../data-test/market-data/market-data.json';

test.describe('[Market] Gift button', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let giftPopupPage: GiftPopupPage;

    test.beforeEach(async ({ page }) => {
        giftPopupPage = new GiftPopupPage(page);
        await giftPopupPage.navigateMarket();
    });

    test('User can open and close Gift popup', async () => {
        const item = giftPopupPage.getItemWithGiftButton('BREAD');
        const giftBtn = item.getByRole('button', { name: '선물' });

        for (const button of [giftPopupPage.closeBtn, giftPopupPage.cancelBtn]) {
            await giftBtn.click();
            await expect(giftPopupPage.giftPopup).toBeVisible();

            await button.click();
            await expect(giftPopupPage.giftPopup).toBeHidden();
        }
    });

    test('Item info should be displayed', async () => {
        const item = giftPopupPage.getItemWithGiftButton('BREAD');
        const expectedImg = await item.locator('img').getAttribute('src');
        const expectedName = (await item.locator('h3').innerText()).trim();
        const expectedDesc = (await item.locator('p.text-\\[\\#BEBEBE\\]').innerText()).trim();

        const giftBtn = item.getByRole('button', { name: '선물' });
        await giftBtn.click();
        await expect(giftPopupPage.giftPopup).toBeVisible();

        await expect(giftPopupPage.itemInfo).toBeVisible();
        await expect(giftPopupPage.itemImage).toBeVisible();

        const imgSuffix = expectedImg ? expectedImg.slice(expectedImg.indexOf('market/')) : '';
        await expect(giftPopupPage.itemImage).toHaveAttribute(
            'src',
            new RegExp(imgSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        );

        await expect(giftPopupPage.itemName).toBeVisible();
        await expect(giftPopupPage.itemName).toHaveText(expectedName);

        if (expectedDesc) {
            await expect(giftPopupPage.itemDesc).toBeVisible();
            await expect(giftPopupPage.itemDesc).toHaveText(expectedDesc);
        } else {
            await expect(giftPopupPage.itemDesc).not.toBeVisible();
        }
    });

    test('Total price should be displayed', async () => {
        const paymentMethods = [
            { method: 'BREAD' as const, unit: '건빵', testId: 'market-payment-method-medal-radio' },
            { method: 'CASH' as const, unit: '캐쉬', testId: 'market-payment-method-gold-radio' },
        ];

        for (const { method, unit, testId } of paymentMethods) {
            await test.step(`Verify total price with ${method}`, async () => {
                const item = giftPopupPage.getItemWithGiftButton(method);
                await item.getByTestId(testId).click();

                const priceOptions = item.getByTestId('market-payment-method-radio-group');
                const priceLocator = method === 'CASH'
                    ? priceOptions.locator('span.text-xs.font-bold.truncate').first()
                    : priceOptions.locator('span.text-xs.font-bold.truncate').nth(1);
                const priceText = await priceLocator.innerText();
                const unitPrice = parseInt(priceText.replace(/[^\d]/g, ''), 10);

                const giftBtn = item.getByRole('button', { name: '선물' });
                await giftBtn.click();
                await expect(giftPopupPage.giftPopup).toBeVisible();

                // Initial quantity: 1
                await expect(giftPopupPage.quantityInput).toHaveValue('1');
                await expect(giftPopupPage.quantityDecreBtn).toBeDisabled();
                await expect(giftPopupPage.totalPrice).toHaveText(`${unitPrice.toLocaleString()} ${unit}`);

                // Increase quantity to 2
                await giftPopupPage.quantityIncreBtn.click();
                await expect(giftPopupPage.quantityInput).toHaveValue('2');
                await expect(giftPopupPage.totalPrice).toHaveText(`${(unitPrice * 2).toLocaleString()} ${unit}`);

                // Increase quantity to 3
                await giftPopupPage.quantityIncreBtn.click();
                await expect(giftPopupPage.quantityInput).toHaveValue('3');
                await expect(giftPopupPage.totalPrice).toHaveText(`${(unitPrice * 3).toLocaleString()} ${unit}`);

                // Decrease quantity to 2
                await giftPopupPage.quantityDecreBtn.click();
                await expect(giftPopupPage.quantityInput).toHaveValue('2');
                await expect(giftPopupPage.totalPrice).toHaveText(`${(unitPrice * 2).toLocaleString()} ${unit}`);

                await giftPopupPage.closeBtn.click();
                await expect(giftPopupPage.giftPopup).toBeHidden();
            });
        }
    });

    test('User can select receiver', async () => {
        const item = giftPopupPage.getItemWithGiftButton('BREAD');
        const giftBtn = item.getByRole('button', { name: '선물' });
        await giftBtn.click();
        await expect(giftPopupPage.giftPopup).toBeVisible();

        const initialReceiver = '회원_6a8531a1800c4';
        await giftPopupPage.receiverInput.fill(initialReceiver);
        await expect(giftPopupPage.receiverInput).toHaveValue(initialReceiver);

        await giftPopupPage.friendListBtn.click();
        await expect(giftPopupPage.friendList).toBeVisible();
        await expect(giftPopupPage.friendListEmptyMsg.or(giftPopupPage.friendItem.first())).toBeVisible();

        if (await giftPopupPage.friendListEmptyMsg.isVisible()) {
            return;
        }

        const friend = giftPopupPage.friendItem.first();
        const friendName = (await friend.innerText()).trim();
        await friend.click();

        await expect(giftPopupPage.friendList).toBeHidden();
        await expect(giftPopupPage.receiverInput).toHaveValue(friendName);
    });

    test('User can send a gift normally', async () => {
        const item = giftPopupPage.getItemWithGiftButton('BREAD');
        const giftBtn = item.getByRole('button', { name: '선물' });
        await giftBtn.click();
        await expect(giftPopupPage.giftPopup).toBeVisible();

        await giftPopupPage.giftMsgInput.fill('auto send gift');
        await expect(giftPopupPage.sendBtn).toBeDisabled();

        const receiver = '회원_6a8531a1800c4';
        await giftPopupPage.receiverInput.fill(receiver);
        await expect(giftPopupPage.receiverInput).toHaveValue(receiver);

        await giftPopupPage.sendBtn.click();
        await giftPopupPage.verifyToastMsg('success', `${receiver}님께 아이템을 구매하여 선물하였습니다.`);
    })

    const receiverErrorCases = [
        { testName: 'a non-existed user', receiver: 'hhhhhhhhhhhhhhhhhhhhhhhh', alert: '탈퇴하였거나 존재하지 않는 회원입니다.' },
        { testName: 'myself', receiver: loginData.valid.expectedUsername, alert: '자신에게 선물할 수 없습니다.' },
    ];
    for (const { testName, receiver, alert } of receiverErrorCases) {
        test(`User cannot send a gift to ${testName}`, async () => {
            const item = giftPopupPage.getItemWithGiftButton('BREAD');
            const giftBtn = item.getByRole('button', { name: '선물' });
            await giftBtn.click();
            await expect(giftPopupPage.giftPopup).toBeVisible();

            await giftPopupPage.receiverInput.fill(receiver);
            await expect(giftPopupPage.receiverInput).toHaveValue(receiver);

            await giftPopupPage.sendBtn.click();
            await expect(giftPopupPage.noticeDialog).toBeVisible();
            await expect(giftPopupPage.noticeDialog).toContainText(`${alert}`);

            await giftPopupPage.dialogConfirmBtn.click();
            await expect(giftPopupPage.noticeDialog).toBeHidden();
            await expect(giftPopupPage.giftPopup).toBeVisible();
        })
    }

    const giftErrorCases = marketData.giftErrorCases;
    for (const { testName, paymentMethod, paymentRadioTestId, code, apiMessage, alertMessage, action, expectedUrl } of giftErrorCases) {
        test(`User cannot send gift when ${testName}`, async ({ page }) => {
            await page.route('**/gift-market-items/**', async route => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            code,
                            message: apiMessage,
                        }),
                    });
                } else {
                    await route.continue();
                }
            });

            const item = giftPopupPage.getItemWithGiftButton(paymentMethod as 'CASH' | 'BREAD');
            await item.getByTestId(paymentRadioTestId).click();

            const giftBtn = item.getByRole('button', { name: '선물' });
            await giftBtn.click();
            await expect(giftPopupPage.giftPopup).toBeVisible();

            const receiver = '회원_6a8531a1800c4';
            await giftPopupPage.receiverInput.fill(receiver);
            await expect(giftPopupPage.receiverInput).toHaveValue(receiver);

            await giftPopupPage.sendBtn.click();

            await expect(giftPopupPage.noticeDialog).toBeVisible();
            await expect(giftPopupPage.noticeDialog).toContainText(alertMessage);

            if (action === 'close') {
                await giftPopupPage.dialogConfirmBtn.click();
                await expect(giftPopupPage.noticeDialog).toBeHidden();
            } else if (action === 'navigate') {
                const chargeBtn = giftPopupPage.dialog.getByRole('button', { name: '충전하기' })
                    .or(giftPopupPage.dialog.getByRole('link', { name: '충전하기' }));
                await chargeBtn.click();
                await expect(page).toHaveURL(expectedUrl!);
            }
        });
    }
});