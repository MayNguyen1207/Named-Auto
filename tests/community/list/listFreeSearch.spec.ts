import { test, expect } from '../../../utils/fixtures';
import { FreeListPage } from '../../../pages/FreeListPage';
import searchData from '../../../data-test/free-list-search-data.json';

test.describe('Guest Flow', () => {

    let freeListPage: FreeListPage;

    test.beforeEach(async ({ page }) => {
        freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
    });

    test('[Community] User can search in Free list by subject and content', async ({ page }) => {
        expect(freeListPage.searchType).toHaveText('제목+내용');
        await freeListPage.searchKeywordInput.fill(searchData.search.titleContent);

        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/community/board?') &&
            response.url().includes('search_type=subject-content') &&
            response.url().includes('search_content=') &&
            response.status() === 200
        );

        const response = await responsePromise;
        const responseJson = await response.json();
        const searchList = responseJson.list ?? [];

        await page.waitForTimeout(1000);

        const totalItems = await freeListPage.listItems.count();
        expect(totalItems).toBe(searchList.length);

        for (let i = 0; i < searchList.length; i++) {
            const post = searchList[i];
            const el = freeListPage.getListItemElements(i);

            await expect(el.postTitle).toHaveText(post.wr_subject);
            await expect(el.postAuthor).toHaveText(post.wr_name);
        }
    });

    test('[Community] User can search in Free list by author name', async ({ page }) => {
        await freeListPage.searchType.click();
        await freeListPage.searchAuthor.click();
        expect(freeListPage.searchType).toHaveText('작성자');
        await freeListPage.searchKeywordInput.fill(searchData.search.author);

        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/community/board?') &&
            response.url().includes('search_type=wr_name') &&
            response.url().includes('search_content=') &&
            response.status() === 200
        );

        const response = await responsePromise;
        const responseJson = await response.json();
        const searchList = responseJson.list ?? [];

        await page.waitForTimeout(1000);

        const totalItems = await freeListPage.listItems.count();
        expect(totalItems).toBe(searchList.length);

        for (let i = 0; i < searchList.length; i++) {
            const post = searchList[i];
            const el = freeListPage.getListItemElements(i);

            await expect(el.postTitle).toHaveText(post.wr_subject);
            await expect(el.postAuthor).toHaveText(post.wr_name);
        }
    });

    test('[Community] Empty list screen should be shown when user searches no result keyword', async ({ page }) => {
        await freeListPage.searchKeywordInput.fill(searchData.search.noResult);
        await expect(freeListPage.noItemText).toBeVisible();

        await freeListPage.searchType.click();
        await freeListPage.searchAuthor.click();
        await expect(freeListPage.noItemText).toBeVisible();
    })
});