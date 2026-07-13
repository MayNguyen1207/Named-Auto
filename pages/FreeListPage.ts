import { expect, Locator, Page, APIRequestContext } from '@playwright/test';
import { formatPostDate } from '../utils/testRelativeTime';
import { BasePage } from './BasePage';

export class FreeListPage extends BasePage {
    readonly allTab: Locator;
    readonly bestTab: Locator;
    readonly myPostTab: Locator;
    readonly myCmtTab: Locator;
    readonly writeBtn: Locator;
    readonly listItems: Locator;

    readonly searchType: Locator;
    readonly searchTitleContent: Locator;
    readonly searchAuthor: Locator;
    readonly searchKeywordInput: Locator;
    readonly searchBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.allTab = page.getByRole('radio', { name: '전체' });
        this.bestTab = page.getByRole('radio', { name: '베스트' });
        this.myPostTab = page.getByRole('radio', { name: '내글' });
        this.myCmtTab = page.getByRole('radio', { name: '내댓글' });
        this.writeBtn = page.getByRole('button', { name: '글쓰기' });
        this.listItems = page.getByTestId('post-item');

        this.searchType = page.getByRole('combobox').first();
        this.searchTitleContent = page.getByRole('option', { name: '제목+내용' });
        this.searchAuthor = page.getByRole('option', { name: '작성자' });
        this.searchKeywordInput = page.getByRole('textbox', { name: '검색어 입력' });
        this.searchBtn = page.getByRole('button', { name: '검색' });
    }

    async navigate() {
        await this.page.goto('/community/free');
        await this.page.waitForTimeout(500);
    }

    getListItemElements(index: number) {
        const listItem = this.listItems.nth(index);
        return {
            item: listItem,
            boardType: listItem.getByTestId('post-type'),
            postTitle: listItem.getByTestId('post-title'),
            cmtCount: listItem.getByTestId('post-comment-count'),
            postAuthor: listItem.getByTestId('user-info-context-menu-trigger'),
            registerDate: listItem.getByTestId('post-register-date'),
            viewCount: listItem.getByTestId('post-view-count'),
            likeCount: listItem.getByTestId('post-like-count'),
            noticeLabel: listItem.getByTestId('post-notice-label'),
        };
    }

    async verifyPostList (   //TODO: check if image icon is displayed
        page: Page,
        request: APIRequestContext, 
        apiBaseURL: string, 
        filter: 'all' | 'best' | 'my_wr' | 'my_cm'
    ) {
        const headers: Record<string, string> = {};
        if (filter === 'my_wr' || filter === 'my_cm') {
            const cookies = await page.context().cookies();
            const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
            
            if (sessionCookie) {
                headers['NAMED-SESSION'] = sessionCookie.value;
            }
        }

        let noticePosts: any[] = [];
        if (filter === 'all') {
            const noticeRes = await request.get(`${apiBaseURL}/community/board/notice`, {
                params: { board_type: 'free' },
            });
            expect(noticeRes.ok()).toBeTruthy();
            const noticeJson = await noticeRes.json();
            noticePosts = noticeJson.list ?? [];
        }

        const normalRes = await request.get(`${apiBaseURL}/community/board`, {
            params: { board_type: 'free', filter: filter, limit: 10 },
            headers: headers
        });
        expect(normalRes.ok()).toBeTruthy();
        const normalJson = await normalRes.json();
        const normalPosts: any[] = normalJson.list ?? [];

        const allPosts = [...noticePosts, ...normalPosts];
        const totalItems = await this.listItems.count();
        expect(totalItems).toBe(allPosts.length);

        for (let i = 0; i < allPosts.length; i++) {
            const post = allPosts[i];
            const el = this.getListItemElements(i);
            const isNotice = i < noticePosts.length;

            const expectedBoardType = isNotice ? '공지' : '자유';
            await expect(el.boardType).toHaveText(expectedBoardType);

            if (isNotice) {
                await expect(el.noticeLabel).toBeVisible();
            } else {
                await expect(el.noticeLabel).toBeHidden();
            }

            await expect(el.postTitle).toHaveText(post.wr_subject);

            if (post.wr_comment > 0) {
                await expect(el.cmtCount).toBeVisible();
                await expect(el.cmtCount).toHaveText(`[${post.wr_comment}]`);
            } else {
                await expect(el.cmtCount).toBeHidden();
            }

            await expect(el.postAuthor).toHaveText(post.wr_name);

            const expectedDate = formatPostDate(post.wr_datetime);
            await expect(el.registerDate).toHaveText(expectedDate);

            await expect(el.viewCount).toHaveText(post.wr_hit.toLocaleString('en-US'));

            if (post.hot_hit) {
                await expect(el.viewCount).toHaveClass(/text-primary/);
            }

            await expect(el.likeCount).toHaveText(post.wr_good.toLocaleString('en-US'));
        }
    }
}