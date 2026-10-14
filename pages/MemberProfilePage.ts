import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MemberProfilePage extends BasePage {
    readonly page: Page;
    readonly profilePopupBtn: Locator;
    readonly notificationPopupBtn: Locator;
    readonly memoPopupBtn: Locator;

    readonly profilePopup: Locator;
    readonly notificationPopup: Locator;
    readonly memoPopup: Locator;

    // Profile popup
    readonly proCloseBtn: Locator;
    readonly proCashBtn: Locator;
    readonly proPointBtn: Locator;
    readonly proBreadBtn: Locator;
    readonly proMyInfoBtn: Locator;
    readonly proWriteBtn: Locator;
    readonly proMarketBtn: Locator;
    readonly proLogoutBtn: Locator;

    readonly proEditBackgroundBtn: Locator;
    readonly proEditAvatarBtn: Locator;
    readonly proUploadImgBtn: Locator;

    // Notification popup
    readonly notiReadDelBtn: Locator;
    readonly notiAllDelBtn: Locator;
    readonly notiItemsList: Locator;

    // Memo popup
    readonly memoReadDelBtn: Locator;
    readonly memoAllDelBtn: Locator;
    readonly memoItemsList: Locator;
    readonly memoRecievedBoxBtn: Locator;
    readonly memoSentBoxBtn: Locator;
    readonly memoWriteBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.profilePopupBtn = page.locator("div[class='flex items-center gap-2'] button[type='button']");
        this.notificationPopupBtn = page.getByTestId('notifications-popover-trigger');
        this.memoPopupBtn = page.getByTestId('popover-trigger').nth(1);

        this.profilePopup = page.getByTestId('popover-content');
        this.notificationPopup = page.getByTestId('notifications-popover-content');
        this.memoPopup = page.getByTestId('popover-content');

        this.proCloseBtn = this.profilePopup.locator('button.absolute:visible');
        this.proCashBtn = this.profilePopup.getByRole('link', { name: /캐시/i });
        this.proPointBtn = this.profilePopup.getByRole('link', { name: /포인트/i });
        this.proBreadBtn = this.profilePopup.getByRole('link', { name: /건빵/i });
        this.proMyInfoBtn = this.profilePopup.getByRole('link', { name: '내 정보' });
        this.proWriteBtn = this.profilePopup.getByRole('link', { name: '글쓰기' });
        this.proMarketBtn = this.profilePopup.getByRole('link', { name: '마켓' });
        this.proLogoutBtn = this.profilePopup.getByRole('button', { name: '로그아웃' });

        this.proEditBackgroundBtn = this.profilePopup.getByTestId('dropdown-menu-trigger').first();
        this.proEditAvatarBtn = this.profilePopup.getByTestId('dropdown-menu-trigger').last();
        this.proUploadImgBtn = page.getByText('업로드하기', { exact: true });

        this.notiReadDelBtn = this.notificationPopup.getByTestId('notifications-read-delete-button');
        this.notiAllDelBtn = this.notificationPopup.getByTestId('notifications-delete-all-button');
        this.notiItemsList = this.notificationPopup.getByTestId('virtuoso-item-list');

        this.memoReadDelBtn = this.memoPopup.getByRole('button', { name: '읽음 삭제' });
        this.memoAllDelBtn = this.memoPopup.getByRole('button', { name: '전체삭제' });
        this.memoItemsList = this.memoPopup.getByTestId('virtuoso-item-list');
        this.memoRecievedBoxBtn = this.memoPopup.getByRole('button').nth(-3);
        this.memoSentBoxBtn = this.memoPopup.getByRole('button').nth(-2);
        this.memoWriteBtn = this.memoPopup.getByRole('button').last();
    }

    async navigateHome() {
        await this.page.goto('/home');
    }

    getProfilePopupBtnElements(expectedUsername: string) {
        return {
            avatar: this.profilePopupBtn.locator(`img[alt="${expectedUsername}"]`),
            levelIcon: this.profilePopupBtn.locator('img[alt="level-icon"]'),
            username: this.profilePopupBtn.locator('span').filter({ hasText: expectedUsername }),
        };
    }

    getUserInfoElements(expectedUsername: string) {
        return {
            proBackgroundImg: this.profilePopup.locator('div.w-full.flex.items-center.justify-center.bg-header.bg-none').or(this.profilePopup.locator('img.object-cover.opacity-80')),
            proAvatarImg: this.profilePopup.locator('img.rounded-full.border-2.border-white.object-cover'),
            proLevelIcon: this.profilePopup.getByRole('img', { name: 'level-icon' }),
            proUsername: this.profilePopup.locator('span').filter({ hasText: expectedUsername }),
        };
    }

    getNotiItemElements(n: number) {
        const item = this.notiItemsList.locator(`[data-index="${n}"]`);
        return {
            item,
            message: item.locator('p').nth(0),
            type: item.locator('p').nth(1),
            dateTime: item.locator('p').last(),
            deleteBtn: item.getByTestId('notifications-item-delete-button'),
            readDot: item.locator('div.w-2.h-2.bg-primary.rounded-full'),
        };
    }

    getMemoItemElements(n: number) {
        const item = this.memoItemsList.locator(`[data-index="${n}"]`);
        return {
            item,
            message: item.locator('div.text-ellipsis.whitespace-nowrap.cursor-pointer'),
            sender: item.locator('p').locator('span').first(),
            type: item.locator('p').locator('span').nth(2),
            dateTime: item.locator('p').last(),
            deleteBtn: item.getByTestId('button-root'),
            readDot: item.locator('div.w-2.h-2.bg-primary.rounded-full'),
        };
    }
}