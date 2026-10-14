import { expect, Locator, Page } from '@playwright/test';
import { MarketPage } from '../../../pages/market/market/MarketPage';

export class GiftPopupPage extends MarketPage {
    readonly page: Page;
    readonly giftPopup: Locator;
    readonly closeBtn: Locator;

    readonly itemInfo: Locator;
    readonly itemImage: Locator;
    readonly itemName: Locator;
    readonly itemDesc: Locator;

    readonly totalPrice: Locator;
    readonly quantityDecreBtn: Locator;
    readonly quantityInput: Locator;
    readonly quantityIncreBtn: Locator;

    readonly receiverInput: Locator;
    readonly friendListBtn: Locator;
    readonly friendList: Locator;
    readonly friendItem: Locator;
    readonly friendListEmptyMsg: Locator;

    readonly giftMsgInput: Locator;
    readonly cancelBtn: Locator;
    readonly sendBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.giftPopup = page.getByRole('dialog').filter({ has: page.getByTestId('dialog-title').getByText('선물하기') });
        this.closeBtn = this.giftPopup.locator(".cursor-pointer[xmlns='http://www.w3.org/2000/svg']");

        this.itemInfo = this.giftPopup.locator('div.flex.flex-col.items-center.gap-2.mb-5');
        this.itemImage = this.itemInfo.locator('> img');
        this.itemName = this.itemInfo.locator('> p').first();
        this.itemDesc = this.itemInfo.locator('> p').nth(1);

        this.totalPrice = this.giftPopup.locator('form.space-y-2 div.justify-center span');
        this.quantityDecreBtn = this.giftPopup.getByTestId('market-number-picker-decrement-button');
        this.quantityInput = this.giftPopup.getByTestId('market-number-picker-input');
        this.quantityIncreBtn = this.giftPopup.getByTestId('market-number-picker-increment-button');

        this.receiverInput = this.giftPopup.getByRole('textbox', { name: '선물 수신자 닉네임 입력' });
        this.friendListBtn = this.giftPopup.getByRole('button', { name: '친구 목록' });
        this.friendList = page.getByTestId('command-list');
        this.friendItem = this.friendList.getByTestId('command-item');
        this.friendListEmptyMsg = this.friendList.getByText('등록된 친구가 없습니다.');

        this.giftMsgInput = this.giftPopup.getByRole('textbox', { name: '선물 메시지 입력' });
        this.cancelBtn = this.giftPopup.getByRole('button', { name: '취소' });
        this.sendBtn = this.giftPopup.getByRole('button', { name: '선물 보내기' });
    }
}