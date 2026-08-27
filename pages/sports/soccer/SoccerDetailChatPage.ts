import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

export class SoccerDetailChatPage extends BasePage {
    readonly page: Page;

    readonly chatBox: Locator;
    readonly chatBoxTitle: Locator;
    readonly chatCount: Locator;
    readonly chatList: Locator;
    readonly chatItems: Locator;

    readonly msgInput: Locator;
    readonly sendMsgBtn: Locator;

    readonly uploadImgBtn: Locator;
    readonly imgPreview: Locator;
    readonly deleteImgPreviewBtn: Locator;

    readonly powerChatBtn: Locator;
    readonly powerChatArea: Locator;
    readonly powerChatAreaTitle: Locator;
    readonly closePowerChatBtn: Locator;
    readonly guideTxt: Locator;
    readonly userAvatar: Locator;
    readonly userNick: Locator;
    readonly noticeTxt: Locator;
    readonly powerChatInput: Locator;
    readonly sendPowerChatBtn: Locator;
    readonly pinPowerChat: Locator;

    readonly voteWinBtn: Locator;
    readonly voteDrawBtn: Locator;
    readonly voteLoseBtn: Locator;

    readonly msgActionMenu: Locator;
    readonly starCandyBtn: Locator;
    readonly voteUpBtn: Locator;
    readonly voteDownBtn: Locator;
    readonly replyBtn: Locator;
    readonly threeDotsBtn: Locator;

    readonly replyLabel: Locator;
    readonly closeReplyLableBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;

        this.chatBox = page.locator('aside.shrink-0.box-border');
        this.chatBoxTitle = this.chatBox.locator('p').filter({ hasText: '응원하기' });
        this.chatCount = this.chatBox.locator('span.absolute.text-white.text-xs.font-medium');
        this.chatList = page.getByTestId('virtuoso-item-list');
        this.chatItems = this.chatList.locator('> div');

        this.msgInput = page.getByPlaceholder('메세지를 입력하세요');
        this.sendMsgBtn = page.getByTestId('send-message-button');

        this.uploadImgBtn = page.getByLabel('사진', { exact: true });
        this.imgPreview = page.locator("img[alt='Uploaded preview']");
        this.deleteImgPreviewBtn = page.locator("svg.tabler-icon-x");

        this.powerChatBtn = page.getByText('파워챗', { exact: true });
        this.powerChatArea = page.locator("//div[@class='absolute h-[264px] left-0 w-full bg-white bottom-0 shadow-sm rounded-t-lg']");
        this.powerChatAreaTitle = this.powerChatArea.locator('h2:has-text("파워챗 보내기")');
        this.closePowerChatBtn = this.powerChatArea.locator("svg.tabler-icon-square-x-filled");
        this.guideTxt = this.powerChatArea.getByText('파워챗을 보내면 응원 메뉴 상단에 고정됩니다.', { exact: true });
        this.userAvatar = this.powerChatArea.locator("//img[@alt='thumb-profile']");
        this.userNick = this.powerChatArea.locator('span.text-start.text-sm.text-foreground.font-bold');
        this.noticeTxt = this.powerChatArea.getByText('100,000포인트가 소모됩니다.', { exact: true });
        this.powerChatInput = this.powerChatArea.getByPlaceholder('메세지를 입력해 관심을 받아보세요.', { exact: true });
        this.sendPowerChatBtn = this.powerChatArea.locator('button:has-text("파워챗 보내기")');
        this.pinPowerChat = page.getByTestId('carousel-item');

        this.voteWinBtn = page.getByTestId('vote-win-button');
        this.voteDrawBtn = page.getByTestId('vote-draw-button');
        this.voteLoseBtn = page.getByTestId('vote-lose-button');

        this.msgActionMenu = page.getByTestId('popover-content');
        this.starCandyBtn = this.msgActionMenu.getByTestId('star-candy-send-button');
        this.voteUpBtn = this.msgActionMenu.getByTestId('vote-real-button');
        this.voteDownBtn = this.msgActionMenu.getByTestId('vote-fake-button');
        this.replyBtn = this.msgActionMenu.locator('button').nth(2);
        this.threeDotsBtn = this.msgActionMenu.locator('button').nth(3);

        this.replyLabel = page.locator('div.w-full.flex.flex-row.justify-between.items-center.px-2.overflow-hidden');
        this.closeReplyLableBtn = this.replyLabel.locator('svg');
    }

    async navigate(id: number) {
        await this.page.goto(`/match/soccer/${id}/odds`);
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => { });
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async sendMsg(message: string) {
        await expect(async () => {
            await this.msgInput.fill(message);
            await expect(this.msgInput).toHaveValue(`${message}`);
        }).toPass({ timeout: 10000 });
        await this.sendMsgBtn.click();
        await expect(this.msgInput).toHaveValue('');
    }

    async getChatItemElements(chatItem: Locator) {
        return {
            userAvatar: chatItem.locator('img').first(),
            userNick: chatItem.locator('p.text-sm.font-medium').first(),
            votedOption: chatItem.locator('p.text-sm.font-medium').last(),
            message: chatItem.getByTestId('popover-trigger'),
            time: chatItem.locator('time'),
            starCandyBtn: chatItem.getByTestId('star-candy-send-button'),
            awardTxt: chatItem.getByText('획득!')
        };
    }

    async openMsgActionMenu(chatItem: Locator) {
        const trigger = chatItem.getByTestId('popover-trigger');
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await expect(this.msgActionMenu).toBeVisible();
    }
}