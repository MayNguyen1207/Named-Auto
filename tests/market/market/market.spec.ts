import { test, expect } from '../../../utils/fixtures';
import { MarketPage } from '../../../pages/market/market/MarketPage';
import fs from 'fs';
import path from 'path';

test.describe('[Market] Item list', () => {
    let marketPage: MarketPage;

    test.beforeEach(async ({ page }) => {
        marketPage = new MarketPage(page);
        await marketPage.navigateMarket();
    });

    test('Items should be displayed normally across all tabs', async ({ page, request, apiBaseURL }) => {
        const tabs = [
            { tab: marketPage.allItemTab, category: '', name: '전체' },
            { tab: marketPage.pointItemTab, category: 'points', name: '포인트 아이템' },
            { tab: marketPage.breadItemTab, category: 'medal', name: '건빵 아이템' },
            { tab: marketPage.chatItemTab, category: 'chat', name: '채팅 아이템' },
            { tab: marketPage.randomItemTab, category: 'random', name: '랜덤 아이템' },
            { tab: marketPage.communityItemTab, category: 'community', name: '커뮤니티 아이템' },
            { tab: marketPage.otherItemTab, category: 'etc', name: '기타 아이템' },
        ];

        for (const { tab, category, name } of tabs) {
            await test.step(`Verify tab: ${name}${category ? ` (category=${category})` : ''}`, async () => {
                const url = category ? `${apiBaseURL}/market-items?category=${category}` : `${apiBaseURL}/market-items`;
                const response = await request.get(url);
                expect(response.ok()).toBeTruthy();
                const data = await response.json();
                const items = data.list ?? [];

                await tab.click();

                if (items.length === 0) {
                    await expect(marketPage.itemCard).toHaveCount(0);
                    await expect(page.getByText('아이템이 없습니다.')).toBeVisible();
                } else {
                    await expect(marketPage.itemCard).toHaveCount(items.length);

                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        await test.step(`Item ${i + 1}: ${item.name}`, async () => {
                            const { badge, image, title, bonusExp, description } = marketPage.getItemCardElements(i);

                            if (item.mark === 'NEW') {
                                await expect(badge).toBeVisible();
                                await expect(badge).toHaveText('신규');
                            } else if (item.mark === 'LIMITED') {
                                await expect(badge).toBeVisible();
                                await expect(badge).toHaveText(/한정\s*판매/);
                            } else {
                                await expect(badge).not.toBeVisible();
                            }

                            await expect(image).toHaveAttribute('src', new RegExp(item.image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

                            await expect(title).toHaveText(item.name);

                            if (item.bonus_exp && item.bonus_exp > 0) {
                                await expect(bonusExp).toBeVisible();
                                await expect(bonusExp).toHaveText(`보너스 ${item.bonus_exp.toLocaleString()} 경험치`);
                            } else {
                                await expect(bonusExp).not.toBeVisible();
                            }

                            await expect(description).toHaveText(item.desc.trim());
                        });
                    }
                }
            });
        }
    });

    test('Item price is displayed normally', async ({ request, apiBaseURL }) => {
        const response = await request.get(`${apiBaseURL}/market-items`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const items = data.list;

        await expect(marketPage.itemCard).toHaveCount(items.length);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await test.step(`Item ${i + 1}: ${item.name}`, async () => {
                const {
                    cashBtn,
                    cashPrice,
                    cashOriginalPrice,
                    breadBtn,
                    breadPrice,
                    breadOriginalPrice,
                    pointBtn,
                    pointPrice,
                    pointOriginalPrice,
                } = marketPage.getItemCardPriceOptions(i);

                const payTypes = item.pay_type ? item.pay_type.split(',').map((p: string) => p.trim()) : [];
                const hasGold = payTypes.includes('GOLD');
                const hasMedal = payTypes.includes('MEDAL');
                const hasPoint = payTypes.includes('POINT');

                // Cash (GOLD)
                if (!hasGold) {
                    await expect(cashPrice).toHaveText('캐쉬로 구매 불가');
                    await expect(cashBtn).toBeDisabled();
                    await expect(cashOriginalPrice).not.toBeVisible();
                } else {
                    await expect(cashBtn).toBeEnabled();
                    await expect(cashPrice).toHaveText(`${item.cash.toLocaleString()} 캐쉬`);
                    if (item.display_cash && item.display_cash !== item.cash) {
                        await expect(cashOriginalPrice).toBeVisible();
                        await expect(cashOriginalPrice).toHaveText(`${item.display_cash.toLocaleString()} 캐쉬`);
                    } else {
                        await expect(cashOriginalPrice).not.toBeVisible();
                    }
                }

                // Bread (MEDAL)
                if (!hasMedal) {
                    await expect(breadPrice).toHaveText('건빵으로 구매 불가');
                    await expect(breadBtn).toBeDisabled();
                    await expect(breadOriginalPrice).not.toBeVisible();
                } else {
                    await expect(breadBtn).toBeEnabled();
                    await expect(breadPrice).toHaveText(`${item.medal.toLocaleString()} 건빵`);
                    if (item.display_medal && item.display_medal !== item.medal) {
                        await expect(breadOriginalPrice).toBeVisible();
                        await expect(breadOriginalPrice).toHaveText(`${item.display_medal.toLocaleString()} 건빵`);
                    } else {
                        await expect(breadOriginalPrice).not.toBeVisible();
                    }
                }

                // Point (POINT)
                if (!hasPoint) {
                    await expect(pointPrice).toHaveText('포인트로 구매 불가');
                    await expect(pointBtn).toBeDisabled();
                    await expect(pointOriginalPrice).not.toBeVisible();
                } else {
                    await expect(pointBtn).toBeEnabled();
                    await expect(pointPrice).toHaveText(`${item.point.toLocaleString()} 포인트`);
                    if (item.display_point && item.display_point !== item.point) {
                        await expect(pointOriginalPrice).toBeVisible();
                        await expect(pointOriginalPrice).toHaveText(`${item.display_point.toLocaleString()} 포인트`);
                    } else {
                        await expect(pointOriginalPrice).not.toBeVisible();
                    }
                }
            });
        }
    });

    test('User can select number of item', async () => {
        const { decreBtn, quantityInput, increBtn } = marketPage.getItemQuantity(0);

        await test.step('Default: quantity is 1 and decrement button is disabled', async () => {
            await expect(quantityInput).toHaveValue('1');
            await expect(decreBtn).toBeDisabled();
        });

        await test.step('Click increBtn: value increases by 1 per click', async () => {
            await increBtn.click();
            await expect(quantityInput).toHaveValue('2');
            await expect(decreBtn).toBeEnabled();

            await increBtn.click();
            await expect(quantityInput).toHaveValue('3');
        });

        await test.step('Click decreBtn: value decreases by 1 per click', async () => {
            await decreBtn.click();
            await expect(quantityInput).toHaveValue('2');

            await decreBtn.click();
            await expect(quantityInput).toHaveValue('1');
            await expect(decreBtn).toBeDisabled();
        });

        await test.step('Manually enter a number into quantityInput: number is displayed', async () => {
            await quantityInput.clear();
            await quantityInput.fill('10');
            await expect(quantityInput).toHaveValue('10');
        });
    });

    test('Item buttons should be displayed correctly', async ({ request, apiBaseURL }) => {
        const response = await request.get(`${apiBaseURL}/market-items`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const items = data.list;

        await expect(marketPage.itemCard).toHaveCount(items.length);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await test.step(`Item ${i + 1}: ${item.name}`, async () => {
                const { giftBtn, buyBtn } = marketPage.getItemCardButtons(i);

                await expect(buyBtn).toBeVisible();

                if (item.giftable === 'Y') {
                    await expect(giftBtn).toBeVisible();
                } else {
                    await expect(giftBtn).not.toBeVisible();
                }
            });
        }
    });
});

test.describe('[Market] Asset', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let marketPage: MarketPage;

    test.beforeEach(async ({ page }) => {
        marketPage = new MarketPage(page);
        await marketPage.navigateMarket();
    });

    test('Asset should be displayed normally', async ({ request, apiBaseURL }) => {
        const userState = JSON.parse(fs.readFileSync(path.resolve('playwright/.auth/user.json'), 'utf-8'));
        const sessionCookie = userState.cookies.find((c: any) => c.name === 'dev_session_id')?.value;

        const response = await request.get(`${apiBaseURL}/market-items`, {
            headers: {
                'NAMED-SESSION': sessionCookie,
            },
        });
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const formatNumber = (value: number | string) => {
            const num = Number(value);
            if (num === 0) return '0';
            if (num >= 1000000) return Math.floor(num / 100000) / 10 + 'M';
            if (num >= 1000) return Math.floor(num / 100) / 10 + 'k';
            return num.toString();
        };

        await test.step('Verify Cash asset display', async () => {
            await expect(marketPage.myAssetCash).toHaveText(formatNumber(data.total_cash));
        });

        await test.step('Verify Bread asset display', async () => {
            await expect(marketPage.myAssetBread).toHaveText(formatNumber(data.total_medal));
        });

        await test.step('Verify Point asset display', async () => {
            await expect(marketPage.myAssetPoint).toHaveText(formatNumber(data.total_point));
        });
    });

    test('User can click to navigate to My Item screen', async ({ page }) => {
        await marketPage.myItemBtn.click();
        await expect(page).toHaveURL('/mypage/item');
    })
})