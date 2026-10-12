import { test, expect } from '../../../utils/fixtures';
import { FreeListPage } from '../../../pages/community/FreeListPage';
import loginData from '../../../data-test/login-data.json';
import freeListData from '../../../data-test/free-list-data.json';

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let freeListPage: FreeListPage;

    test.beforeEach(async ({ page }) => {
        freeListPage = new FreeListPage(page);
        await freeListPage.navigate();
    });

    test('[Community] Checkboxes should function correctly', async ({ page }) => {
        await page.waitForTimeout(1000);
        await freeListPage.selectAllCheckBox();
        await freeListPage.deselectAllCheckBox();
        await freeListPage.selectAndDeselectCheckBox();
    });

    test('[Community] Admin can delete posts in list', async () => {
        await freeListPage.goToPageViaInput('200', 200);

        const count = await freeListPage.listItems.count();
        const lastPostTitle = await freeListPage.getListItemElements(count - 1).postTitle.innerText();
        const secondLastPostTitle = await freeListPage.getListItemElements(count - 2).postTitle.innerText();

        await freeListPage.checkBox.nth(-1).click();
        await freeListPage.checkBox.nth(-2).click();

        await freeListPage.deletePostBtn.click();
        await expect(freeListPage.dialog).toContainText(
            `선택한 게시물을 정말 삭제 하시겠습니까?
            한번 삭제한 자료는 복구할 수 없습니다.`
        );
        await freeListPage.dialogCancelBtn.click();
        await expect(freeListPage.dialog).toBeHidden();

        await freeListPage.deletePostBtn.click();
        await freeListPage.dialogConfirmBtn.click();

        await expect(freeListPage.listItems.filter({ hasText: lastPostTitle })).toHaveCount(0, { timeout: 15000 });
        await expect(freeListPage.listItems.filter({ hasText: secondLastPostTitle })).toHaveCount(0, { timeout: 15000 });
    });

    test('[Community] List of boards to move post should be displayed correctly', async ({ page, request, apiBaseURL }) => {
        const categoryResponse = await request.get(`${apiBaseURL}/community/category?current_board_type=free`);
        expect(categoryResponse.ok()).toBeTruthy();
        const categoryJson = await categoryResponse.json();
        const boards = Array.isArray(categoryJson) ? categoryJson : categoryJson.data;

        await freeListPage.checkBox.last().click();
        await freeListPage.movePostBtn.click();

        await expect(freeListPage.listBoardToMove).toBeVisible();
        await expect(freeListPage.boardToMove).toHaveCount(boards.length);

        for (let i = 0; i < boards.length; i++) {
            const board = boards[i];
            const boardItem = freeListPage.boardToMove.nth(i);

            await expect(boardItem.getByRole('checkbox')).toBeVisible();

            const expectedName = `${board.gr_subject} > ${board.bo_subject} (${board.bo_table})`;
            await expect(boardItem).toContainText(expectedName);

            if (board.bo_use_category === 1) {
                const combobox = boardItem.getByRole('combobox');
                await expect(combobox).toBeVisible();

                await combobox.click();
                const listbox = page.getByRole('listbox');
                await expect(listbox).toBeVisible();

                for (const catName of board.ca_name) {
                    await expect(listbox.getByRole('option', { name: catName })).toBeVisible();
                }

                await page.keyboard.press('Escape');
            } else {
                await expect(boardItem.getByRole('combobox')).toBeHidden();
            }
        }
    });

    test('[Community] Admin can move post in list', async ({ page, request, apiBaseURL }) => {
        let lastPostTitle: string;
        let targetBoardTable: string;
        let movedPost: any;

        await freeListPage.goToPageViaInput('200', 200);

        await test.step('Activate Move Post popup', async () => {
            const count = await freeListPage.listItems.count();
            lastPostTitle = await freeListPage.getListItemElements(count - 1).postTitle.innerText();
            await freeListPage.checkBox.nth(-1).click();
            await freeListPage.movePostBtn.click();
        });

        await test.step('Get the first bo_table', async () => {
            const categoryResponse = await request.get(`${apiBaseURL}/community/category?current_board_type=free`);
            expect(categoryResponse.ok()).toBeTruthy();
            const categoryJson = await categoryResponse.json();
            const boards = Array.isArray(categoryJson) ? categoryJson : categoryJson.data;
            targetBoardTable = boards[0].bo_table;
        });

        await test.step('Move the post', async () => {
            const boardItem = freeListPage.boardToMove.first();
            await boardItem.getByRole('checkbox').click();

            await freeListPage.moveBtn.click();

            await freeListPage.verifyToastMsg('success', freeListData.movePostMsg.success);
            await page.waitForTimeout(2000);
            await expect(freeListPage.listBoardToMove).toBeHidden();
            await expect(page.getByText(lastPostTitle)).toBeHidden();
        });

        await test.step('Verify that the post exists in new board', async () => {
            const boardResponse = await request.get(`${apiBaseURL}/community/board?board_type=${targetBoardTable}`);
            expect(boardResponse.ok()).toBeTruthy();
            const boardJson = await boardResponse.json();
            const posts = Array.isArray(boardJson) ? boardJson : boardJson.list;

            movedPost = posts.find((post: any) => post.wr_subject === lastPostTitle);
            expect(movedPost).toBeTruthy();
        });

        await test.step('Verify that the post contains history text', async () => {
            const postId = movedPost.wr_id;
            const postDetailResponse = await request.get(`${apiBaseURL}/community/board/${postId}?board_type=${targetBoardTable}`);
            expect(postDetailResponse.ok()).toBeTruthy();
            const postDetailJson = await postDetailResponse.json();
            const wrContent: string = postDetailJson.wr_content ?? '';

            const adminName = loginData.admin.expectedUsername;
            const escapeRegExp = (string: string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            const safeAdminName = escapeRegExp(adminName);

            const moveHistoryPattern = new RegExp(
                `\\[이 게시물은 ${safeAdminName}님에 의해 \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} 자유에서 이동 됨\\]`
            );
            expect(moveHistoryPattern.test(wrContent)).toBeTruthy();
        });
    });

    test('[Community] Move Post popup should be closed when clicking Cancel button', async ({ page }) => {
        await freeListPage.checkBox.last().click();
        await freeListPage.movePostBtn.click();
        await expect(freeListPage.listBoardToMove).toBeVisible();
        await freeListPage.dialogCancelBtn.click();
        await expect(freeListPage.listBoardToMove).toBeHidden();
    });
});