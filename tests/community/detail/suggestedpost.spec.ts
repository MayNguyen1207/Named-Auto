import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import freePostData from '../../../data-test/free-post-data.json';

test.describe('Guest Flow', () => {

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Suggested Posts Tab should be shown, verify components and pagination', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.suggestedPostTab.scrollIntoViewIfNeeded();
        await expect(detailFreePage.suggestedPostTab).toHaveAttribute('aria-selected', 'true');

        await Promise.race([
            detailFreePage.postContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            detailFreePage.noSuggestedPostTxt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
        ]);
        if (await detailFreePage.noSuggestedPostTxt.isVisible()) {
            await expect(detailFreePage.noSuggestedPostTxt).toBeVisible();
            await expect(detailFreePage.sugPagiantion).toBeHidden();
            return;
        }

        let initialCount = await detailFreePage.postItem.count();
        expect(initialCount).toBeGreaterThan(0);
        expect(initialCount).toBeLessThanOrEqual(4);
        await detailFreePage.verifySuggestedPostContainer();

        if (initialCount === 4 && await detailFreePage.sugPagiantion.isVisible()) {
            await expect(detailFreePage.sugPrevBtn).toBeDisabled();

            while (await detailFreePage.sugNextBtn.isEnabled()) {
                await detailFreePage.sugNextBtn.click();
                await page.waitForTimeout(500);
                const nextPageCount = await detailFreePage.postItem.count();
                expect(nextPageCount).toBeGreaterThan(0);
                expect(nextPageCount).toBeLessThanOrEqual(4);
                await detailFreePage.verifySuggestedPostContainer();
            }
            await expect(detailFreePage.sugNextBtn).toBeDisabled();
            await expect(detailFreePage.sugPrevBtn).toBeEnabled();
        } else {
            await expect(detailFreePage.sugPagiantion).toBeHidden();
        }
    });

    test('[Community] User can click the suggested post title to go to the detail page', async ({ page }) => {
        const boardUrlMap: Record<string, string> = {
            '자유': '/community/free/',
            '후기': '/community/minigame/',
            '보증': '/community/verification/',
            '분석': '/match/',
            '피해공유': '/community/crime/',
            '포토': '/community/photo/',
            '전체': '/customercenter/notice/',
        };

        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.suggestedPostTab.scrollIntoViewIfNeeded();

        await Promise.race([
            detailFreePage.postContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            detailFreePage.noSuggestedPostTxt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
        ]);

        if (await detailFreePage.noSuggestedPostTxt.isVisible()) {
            console.log('No suggested posts available — skipping click test.');
            return;
        }

        const foundBoards = new Map<string, string>();
        let firstClickBoard: { boardName: string; href: string } | null = null;

        while (true) {
            const count = await detailFreePage.postItem.count();

            for (let i = 0; i < count; i++) {
                const postEl = detailFreePage.postItem.nth(i);
                const elements = detailFreePage.getSuggestedPostElements(postEl);
                const boardName = (await elements.boardName.textContent())?.trim() ?? '';
                const href = await detailFreePage.getPostItemLink(postEl).getAttribute('href') ?? '';

                if (firstClickBoard === null && boardName) {
                    firstClickBoard = { boardName, href };
                }

                if (boardName && !foundBoards.has(boardName)) {
                    foundBoards.set(boardName, href);
                    console.log(`Found boardName: "${boardName}" → href: "${href}"`);
                }
            }

            if (await detailFreePage.sugPagiantion.isVisible() && await detailFreePage.sugNextBtn.isEnabled()) {
                await detailFreePage.sugNextBtn.click();
                await page.waitForTimeout(500);
            } else {
                break;
            }
        }

        for (const [boardName, href] of foundBoards) {
            const expectedPrefix = boardUrlMap[boardName];
            if (!expectedPrefix) {
                console.warn(`BoardName "${boardName}" is not in boardUrlMap — skipping.`);
                continue;
            }
            expect(href, `BoardName "${boardName}" → href "${href}" should contain "${expectedPrefix}"`).toContain(expectedPrefix);
            console.log(`✓ Verified: "${boardName}" → "${href}"`);
        }

        for (const boardName of Object.keys(boardUrlMap)) {
            if (!foundBoards.has(boardName)) {
                console.log(`BoardName "${boardName}" was not found in any page — skipped.`);
            }
        }

        if (firstClickBoard) {
            const { boardName, href } = firstClickBoard;
            const expectedPrefix = boardUrlMap[boardName];

            await detailFreePage.navigate(freePostData.postUrl.normalPost);
            await detailFreePage.suggestedPostTab.scrollIntoViewIfNeeded();
            await detailFreePage.postContainer.waitFor({ state: 'visible', timeout: 5000 });

            const firstPost = detailFreePage.postItem.first();
            const elements = detailFreePage.getSuggestedPostElements(firstPost);
            await elements.postTitle.scrollIntoViewIfNeeded();
            await elements.postTitle.click();

            if (expectedPrefix) {
                await expect(page).toHaveURL(new RegExp(expectedPrefix.replace(/\//g, '\\/').replace(/\./g, '\\.')));
                console.log(`✓ Navigation verified: clicked "${boardName}" post → URL contains "${expectedPrefix}"`);
            } else {
                await expect(page).toHaveURL(new RegExp(href.replace(/\//g, '\\/').replace(/\./g, '\\.')));
            }
        }
    });


    test('[Community] Writer Other Post Tab should be shown', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.otherPostTab.scrollIntoViewIfNeeded();
        await expect(detailFreePage.otherPostTab).toHaveAttribute('aria-selected', 'false');
        await detailFreePage.otherPostTab.click();
        await expect(detailFreePage.otherPostTab).toHaveAttribute('aria-selected', 'true');

        await Promise.race([
            detailFreePage.otherPostContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            detailFreePage.noOtherPostTxt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
        ]);
        if (await detailFreePage.noOtherPostTxt.isVisible()) {
            await expect(detailFreePage.noOtherPostTxt).toBeVisible();
            await expect(detailFreePage.sugPagiantion).toBeHidden();
            return;
        } else {
            await expect(detailFreePage.otherPostContainer).toBeVisible();
            let initialCount = await detailFreePage.postItem.count();
            await detailFreePage.verifyOtherPostWriter();
            if (initialCount === 4 && await detailFreePage.sugPagiantion.isVisible()) {
                while (await detailFreePage.sugNextBtn.isEnabled()) {
                    await detailFreePage.sugNextBtn.click();
                    await page.waitForTimeout(500);
                    await detailFreePage.verifyOtherPostWriter();
                }
            }
        }
    })
})