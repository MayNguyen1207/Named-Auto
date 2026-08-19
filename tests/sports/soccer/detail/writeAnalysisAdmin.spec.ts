import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailWritePage } from '../../../../pages/sports/soccer/SoccerDetailWritePage';
import { WriteFreePage } from '../../../../pages/WriteFreePage';
import { DetailFreePage } from '../../../../pages/DetailFreePage';
import matchData from '../../../../data-test/match-detail-data.json';
import loginData from '../../../../data-test/login-data.json';
import postData from '../../../../data-test/write-post-data.json';

test.describe('Admin', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let soccerDetailWritePage: SoccerDetailWritePage;
    let writeFreePage: WriteFreePage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailWritePage = new SoccerDetailWritePage(page);
        await soccerDetailWritePage.navigateWrite(matchId);

        writeFreePage = new WriteFreePage(page);
    });

    test('[Soccer] Author list is displayed normally', async ({ page, request, apiBaseURL }) => {
        await writeFreePage.authorPickerTrigger.click();

        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
        const headers: Record<string, string> = sessionCookie ? { 'NAMED-SESSION': sessionCookie.value } : {};

        const response = await request.get(`${apiBaseURL}/community/board/writers`, { headers });
        expect(response.ok()).toBeTruthy();
        const authors = await response.json();

        // Check all authors in the list
        const authorCount = authors.length;
        await expect(writeFreePage.authorItem).toHaveCount(authorCount);

        for (let i = 0; i < authorCount; i++) {
            const author = authors[i];
            const expectedText = `${author.mb_nick} (${author.level_title})`;
            await expect(writeFreePage.authorItem.nth(i)).toHaveText(expectedText);
        }
    });

    test('[Soccer] Admin can search author to assign', async ({ page, request, apiBaseURL }) => {
        const keyword = '아';
        await writeFreePage.searchAuthor(keyword);

        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
        const headers: Record<string, string> = sessionCookie ? { 'NAMED-SESSION': sessionCookie.value } : {};

        const response = await request.get(`${apiBaseURL}/community/board/writers`, { headers });
        expect(response.ok()).toBeTruthy();
        const authors = await response.json();

        // Filter authors where name or level contains the keyword
        const filteredAuthors = authors.filter((author: any) =>
            author.mb_nick.includes(keyword) || author.level_title.includes(keyword)
        );

        const expectedTexts = filteredAuthors.map((author: any) => `${author.mb_nick} (${author.level_title})`);

        // Check the displayed items match the filtered list
        const filteredAuthorCount = filteredAuthors.length;
        await expect(writeFreePage.authorItem).toHaveCount(filteredAuthorCount);

        for (let i = 0; i < filteredAuthorCount; i++) {
            const itemText = await writeFreePage.authorItem.nth(i).textContent();
            expect(expectedTexts).toContain(itemText?.trim());
        }

        await writeFreePage.authorSearchInput.clear();
        const authorCount = authors.length;
        await expect(writeFreePage.authorItem).toHaveCount(authorCount);
    });

    test('[Soccer] No result text should be shown', async () => {
        const keyword = 'fghjk';
        await writeFreePage.searchAuthor(keyword);
        await expect(writeFreePage.noAuthorResult).toBeVisible();
    });

    test('[Soccer] Admin can select and deselect an author', async () => {
        await writeFreePage.authorPickerTrigger.click();
        await expect(writeFreePage.authorCommandRoot).toBeVisible();
        const firstItem = writeFreePage.authorItem.first();
        const fullText = (await firstItem.textContent())?.trim() ?? '';

        await firstItem.click();

        await expect(writeFreePage.authorPickerTrigger).toHaveText(fullText);

        await writeFreePage.resetSelectionBtn.click();
        const expectedAdminText = `${loginData.admin.expectedUsername} (${loginData.admin.expectedLevel})`;
        await expect(writeFreePage.authorPickerTrigger).toHaveText(expectedAdminText);
    });

    test('[Soccer] Admin can assign author for the post', async ({ page, browserName, request, apiBaseURL }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const selectedAuthor = await writeFreePage.selectFirstAuthor();
        expect(selectedAuthor).not.toBe('');

        await writeFreePage.writePost(`${Date.now()}` + postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.last().click();

        const detailFreePage = new DetailFreePage(page);
        await expect(detailFreePage.postAuthor).toContainText(selectedAuthor);

        const currentUrl = new URL(page.url());
        const postId = currentUrl.searchParams.get('postId');
        if (postId) {
            await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId, 'sports_analysis');
        }
    });
});