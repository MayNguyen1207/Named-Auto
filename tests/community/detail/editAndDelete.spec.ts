import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import loginData from '../../../data-test/login-data.json';
import freePostData from '../../../data-test/free-post-data.json';

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] Prisoner cannot edit Free post', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.prisonerPost);
        await detailFreePage.editPostBtn.click();
        await expect(detailFreePage.jailPoster).toBeVisible();
        await expect(detailFreePage.prisonNotice).toContainText(
            "서비스 이용 제한 안내" +
            loginData.prisoner.expectedUsername + "님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.");
        await detailFreePage.previousPageBtn.click();
        await expect(detailFreePage.jailPoster).toBeHidden();

        await detailFreePage.navigate(freePostData.postUrl.editPrisonerPost);
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyToastMsg("error", freePostData.editPostMsg.prisonerUnableEdit);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] User can edit post when post has author\'s comment only', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPost);
        await page.waitForTimeout(500);
        const titleBefore = await detailFreePage.postTitle.textContent() as string;
        const contentBefore = await detailFreePage.postContent.textContent() as string;
        await detailFreePage.editPostBtn.click();

        const writeFreePage = new WriteFreePage(page);
        await expect(page).toHaveURL(freePostData.postUrl.editMyPost);
        await expect(writeFreePage.titleInput).toHaveValue(titleBefore);
        await expect(writeFreePage.contentInput).toHaveText(contentBefore);
        const titleAfter = titleBefore + ` ${Date.now()}`;
        await writeFreePage.titleInput.fill(titleAfter);
        await writeFreePage.writeBtn.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveURL(freePostData.postUrl.myPost);
        await expect(detailFreePage.postTitle).toHaveText(titleAfter);
    });

    test('[Community] User cannot edit a post that has other user\'s comment', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPostOtherUserCmt);
        await page.waitForTimeout(500);
        await detailFreePage.editPostBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.editPostMsg.unableEdit);

        await detailFreePage.navigate(freePostData.postUrl.editMyPostOtherUserCmt);
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyToastMsg("error", freePostData.editPostMsg.unableEdit);
    });

    test('[Community] User can delete a post when post has author\'s comment only', async ({ page, apiBaseURL, request }) => {
        const loginResponse = await request.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.valid.email,
                password: loginData.valid.password,
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const loginJson = await loginResponse.json();
        const dynamicToken = loginJson.session_id;

        const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Auto Test Delete Post ${Date.now()}`,
                content: '<p>Bài viết dùng để xóa...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();

        const postJson = await createPostResponse.json();
        const postId = postJson.wr_id;
        const postUrl = `/community/free/${postId}`;

        await request.post(`${apiBaseURL}/community/board/${postId}/comment`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                wr_id: postId,
                board_type: 'free',
                content: `Auto comment number ${Date.now()}`,
                comment_type: 'new'
            }
        });

        await detailFreePage.navigate(postUrl);
        await detailFreePage.deletePostBtn.click();
        await expect(detailFreePage.noticeDialog).toContainText(
            `한번 삭제한 게시물은 복구할 방법이 없습니다.
            정말 삭제하시겠습니까?`
        );
        await detailFreePage.dialogCancelBtn.click();
        await expect(detailFreePage.noticeDialog).toBeHidden();
        await expect(page).toHaveURL(postUrl);

        await detailFreePage.deletePostBtn.click();
        await detailFreePage.dialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("success", freePostData.deletePostMsg.success);
        await detailFreePage.navigate(postUrl);
        await expect(detailFreePage.noDataLogo).toBeVisible();
    });

    test('[Community] User cannot delete a post that has other user\'s comment', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPostOtherUserCmt);
        await page.waitForTimeout(500);
        await detailFreePage.deletePostBtn.click();
        await expect(detailFreePage.noticeDialog).toContainText(
            `한번 삭제한 게시물은 복구할 방법이 없습니다.
            정말 삭제하시겠습니까?`
        );
        await detailFreePage.dialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.deletePostMsg.unableDelete);
    });
});