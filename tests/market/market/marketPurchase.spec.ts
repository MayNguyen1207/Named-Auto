import { test, expect } from '../../../utils/fixtures';
import { MarketPage } from '../../../pages/market/market/MarketPage';
import marketData from '../../../data-test/market-data/market-data.json';

test.describe('[Market] Purchase button', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let marketPage: MarketPage;

    test.beforeEach(async ({ page }) => {
        marketPage = new MarketPage(page);
        await marketPage.navigateMarket();
    });

    const paymentMethods: ('BREAD' | 'POINT')[] = ['BREAD', 'POINT'];
    for (const paymentMethod of paymentMethods) {
        test(`User can purchase an item with ${paymentMethod}`, async ({ page }) => {
            const item = marketPage.getItemWithGiftButton(paymentMethod);
            const itemName = (await item.locator('h3').innerText()).trim();
            const escapedItemName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const paymentTestIdMap: Record<'BREAD' | 'POINT', string> = {
                BREAD: 'market-payment-method-medal-radio',
                POINT: 'market-payment-method-point-radio',
            };
            await item.getByTestId(paymentTestIdMap[paymentMethod]).click();

            const buyBtn = item.getByRole('button', { name: '구매' });

            await buyBtn.click();
            await expect(marketPage.noticeDialog).toContainText(new RegExp(`${escapedItemName}.*구매하시겠습니까\\?`));

            await marketPage.dialogCancelBtn.click();
            await expect(marketPage.noticeDialog).toBeHidden();
            await expect(page).toHaveURL('/market/market');

            await buyBtn.click();
            await marketPage.dialogConfirmBtn.click();

            const purchaseSuccessRegex = new RegExp(
                `${escapedItemName}.*1개 구매하였습니다\\.[\\s\\S]*` +
                `(?:아이템 구매로 보너스 경험치가 [\\d,]+점 추가되었습니다\\.[\\s\\S]*)?` +
                `아이템 사용을 위해 마이페이지로 이동하시겠습니까\\?`
            );
            await expect(marketPage.noticeDialog).toContainText(purchaseSuccessRegex);

            await marketPage.dialogConfirmBtn.click();
            await expect(page).toHaveURL(/\/mypage\/item/);
        });
    }

    const errorCases = marketData.purchaseErrorCases;
    for (const errorCase of errorCases) {
        test(`Alert should be shown when ${errorCase.caseName}`, async ({ page }) => {
            await page.route('**/market-items/**', async route => {
                if (route.request().method() !== 'GET') {
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            code: errorCase.code,
                            message: errorCase.apiMessage,
                        }),
                    });
                } else {
                    await route.continue();
                }
            });

            const item = marketPage.itemCard.first();
            const buyBtn = item.getByRole('button', { name: '구매' });

            await buyBtn.click();
            await marketPage.dialogConfirmBtn.click();

            await expect(marketPage.noticeDialog).toContainText(errorCase.uiMessage);

            if (errorCase.action === 'close') {
                await marketPage.dialogConfirmBtn.click();
                await expect(marketPage.noticeDialog).toBeHidden();
            } else if (errorCase.action === 'navigate') {
                const chargeBtn = marketPage.dialog.getByRole('button', { name: '충전하기' })
                    .or(marketPage.dialog.getByRole('link', { name: '충전하기' }));
                await chargeBtn.click();
                await expect(page).toHaveURL(errorCase.expectedUrl!);
            }
        });
    }
});