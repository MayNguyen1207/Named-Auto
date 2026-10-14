import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

export class MarketPage extends BasePage {
    readonly page: Page;
    readonly allItemTab: Locator;
    readonly pointItemTab: Locator;
    readonly breadItemTab: Locator;
    readonly chatItemTab: Locator;
    readonly randomItemTab: Locator;
    readonly communityItemTab: Locator;
    readonly otherItemTab: Locator;

    readonly myAsset: Locator;
    readonly myAssetCash: Locator;
    readonly myAssetBread: Locator;
    readonly myAssetPoint: Locator;
    readonly myItemBtn: Locator;

    readonly itemCard: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.allItemTab = page.getByRole('radio', { name: '전체' });
        this.pointItemTab = page.getByRole('radio', { name: '포인트 아이템' });
        this.breadItemTab = page.getByRole('radio', { name: '건빵 아이템' });
        this.chatItemTab = page.getByRole('radio', { name: '채팅 아이템' });
        this.randomItemTab = page.getByRole('radio', { name: '랜덤 아이템' });
        this.communityItemTab = page.getByRole('radio', { name: '커뮤니티 아이템' });
        this.otherItemTab = page.getByRole('radio', { name: '기타 아이템' });

        this.myAsset = page.locator("div[class='flex justify-between items-center'] div[class='flex items-center gap-2']");
        this.myAssetCash = this.myAsset.locator('span').first();
        this.myAssetBread = this.myAsset.locator('span').nth(1);
        this.myAssetPoint = this.myAsset.locator('span').last();
        this.myItemBtn = page.getByRole('link', { name: '내 아이템' });

        this.itemCard = page.locator('div.w-full.bg-white.rounded-large.flex.flex-col.justify-between');
    }

    async navigateMarket() {
        await this.page.goto('/market/market');
    }

    getItemCardElements(n: number) {
        const card = this.itemCard.nth(n)
        return {
            badge: card.locator('span.text-\\[\\#FDFDFD\\]'),
            image: card.locator('img'),
            title: card.locator('h3'),
            bonusExp: card.locator('p.text-purple'),
            description: card.locator('p.text-\\[\\#BEBEBE\\]'),
        }
    }

    getItemCardPriceOptions(n: number) {
        const card = this.itemCard.nth(n)
        const priceOptions = card.getByTestId('market-payment-method-radio-group')
        return {
            cashBtn: priceOptions.getByTestId('market-payment-method-gold-radio'),
            cashPrice: priceOptions.locator('span.text-xs.font-bold.truncate').first(),
            cashOriginalPrice: priceOptions.locator('span.text-xs.font-bold.truncate').first().locator('..').locator('span.line-through'),

            breadBtn: priceOptions.getByTestId('market-payment-method-medal-radio'),
            breadPrice: priceOptions.locator('span.text-xs.font-bold.truncate').nth(1),
            breadOriginalPrice: priceOptions.locator('span.text-xs.font-bold.truncate').nth(1).locator('..').locator('span.line-through'),

            pointBtn: priceOptions.getByTestId('market-payment-method-point-radio'),
            pointPrice: priceOptions.locator('span.text-xs.font-bold.truncate').last(),
            pointOriginalPrice: priceOptions.locator('span.text-xs.font-bold.truncate').last().locator('..').locator('span.line-through')
        }
    }

    getItemQuantity(n: number) {
        const card = this.itemCard.nth(n)
        return {
            decreBtn: card.getByTestId('market-number-picker-decrement-button'),
            quantityInput: card.getByTestId('market-number-picker-input'),
            increBtn: card.getByTestId('market-number-picker-increment-button')
        }
    }

    getItemCardButtons(n: number) {
        const card = this.itemCard.nth(n)
        return {
            giftBtn: card.getByRole('button', { name: '선물' }),
            buyBtn: card.getByRole('button', { name: '구매' })
        }
    }

    getItemWithGiftButton(paymentMethod?: 'CASH' | 'BREAD' | 'POINT'): Locator {
        let locator = this.itemCard.filter({
            has: this.page.getByRole('button', { name: '선물' })
        });

        if (paymentMethod) {
            const paymentTestIdMap: Record<'CASH' | 'BREAD' | 'POINT', string> = {
                CASH: 'market-payment-method-gold-radio',
                BREAD: 'market-payment-method-medal-radio',
                POINT: 'market-payment-method-point-radio',
            };

            locator = locator.filter({
                has: this.page.locator(`[data-testid="${paymentTestIdMap[paymentMethod]}"]:enabled`)
            });
        }

        return locator.first();
    }
}