import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import loginData from '../../../data-test/login-data.json';
import freePostData from '../../../data-test/free-post-data.json';
import postData from '../../../data-test/write-post-data.json';
import fs from 'fs';
import path from 'path';

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] Prisoner cannot edit Free post', async ({ page, request, apiBaseURL }) => {
        const authData = JSON.parse(fs.readFileSync(path.resolve('playwright/.auth/prisoner.json'), 'utf-8'));
        const sessionId = authData.cookies.find((c: any) => c.name === 'dev_session_id')?.value;

        const response = await request.get(`${apiBaseURL}/me`, {
            headers: {
                'NAMED-SESSION': sessionId
            }
        });
        const data = await response.json();
        const [year, month, day] = data.jail_released_date.split('-');

        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.prisonerPost);
        await detailFreePage.editPostBtn.click();
        await expect(detailFreePage.jailPoster).toBeVisible();
        await expect(detailFreePage.prisonNotice).toContainText(
            `${loginData.prisoner.expectedUsername}님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.\n
            ${year}년 ${month}월 ${day}일 00:00부터 정상 이용이 가능합니다.`
        );
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

        await expect(page).toHaveURL(freePostData.postUrl.myPost, { timeout: 10000 });
        await expect(detailFreePage.postTitle).toHaveText(titleAfter);
    });

    test('[Community] User cannot edit a post that has other user\'s comment', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPostOtherUserCmt);
        await detailFreePage.editPostBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.editPostMsg.unableEdit);

        await detailFreePage.navigate(freePostData.postUrl.editMyPostOtherUserCmt);
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyToastMsg("error", freePostData.editPostMsg.unableEdit);
    });

    for (const data of postData.invalid) {
        test(`[Community] User cannot edit post with ${data.id}`, async ({ page, browserName }) => {
            test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

            await detailFreePage.navigate(freePostData.postUrl.myPost);
            await expect(async () => {
                await detailFreePage.editPostBtn.click();
                await expect(page).toHaveURL(/\/community\/edit\/free/);
            }).toPass({ timeout: 10000 });

            const writeFreePage = new WriteFreePage(page);
            await writeFreePage.titleInput.clear();
            await writeFreePage.contentInput.clear();

            await writeFreePage.writePost(data.title, data.content);
            switch (data.id) {
                case 'spaceTitle':
                    await expect(writeFreePage.writeBtn).toBeDisabled();
                    await writeFreePage.titleInput.clear();
                    await expect(writeFreePage.titleErrorMsg).toBeVisible();
                    break;
                case 'emptyTitle':
                case 'emptyContent':
                    await expect(writeFreePage.writeBtn).toBeDisabled();
                    break;
                default:
                    await expect(writeFreePage.writeBtn).toBeEnabled();
                    await writeFreePage.writeBtn.click();
                    break;
            }
            if (data.toastMsg) {
                await writeFreePage.verifyToastMsg('error', data.toastMsg);
            }
        });
    }

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
        await detailFreePage.deletePostBtn.click();
        await expect(detailFreePage.noticeDialog).toContainText(
            `한번 삭제한 게시물은 복구할 방법이 없습니다.
            정말 삭제하시겠습니까?`
        );
        await detailFreePage.dialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.deletePostMsg.unableDelete);
    });
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Admin can edit post even when post has comments', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await detailFreePage.navigate(freePostData.postUrl.myPostOtherUserCmt);
        const titleBefore = await detailFreePage.postTitle.textContent() as string;
        const contentBefore = await detailFreePage.postContent.textContent() as string;
        await detailFreePage.editPostBtn.click();

        const writeFreePage = new WriteFreePage(page);
        await expect(page).toHaveURL(freePostData.postUrl.editMyPostOtherUserCmt);
        await expect(writeFreePage.titleInput).toHaveValue(titleBefore);
        await expect(writeFreePage.contentInput).toHaveText(contentBefore);
        const titleAfter = `My post with other user's comment (do not delete or edit or comment) ${Date.now()}`;
        await writeFreePage.titleInput.fill(titleAfter);
        await writeFreePage.writeBtn.click();

        await expect(page).toHaveURL(freePostData.postUrl.myPostOtherUserCmt, { timeout: 10000 });
        await expect(detailFreePage.postTitle).toHaveText(titleAfter);
    });

    test('[Community] Admin can delete post even when post has comments', async ({ page, request, apiBaseURL }) => {
        let createPostResponse: any;
        let postUrl: string;

        await test.step('Create a post to delete', async () => {
            const loginResponse = await request.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userC.email,
                    password: loginData.userC.password,
                }
            });
            expect(loginResponse.ok()).toBeTruthy();

            const loginJson = await loginResponse.json();
            const dynamicToken = loginJson.session_id;

            createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
                headers: { 'NAMED-SESSION': `${dynamicToken}` },
                form: {
                    board_type: 'free',
                    subject: `Auto Test Delete Post By Admin ${Date.now()}`,
                    content: '<p>Bài viết dùng để xóa...</p>',
                    is_notice: 'false',
                    comment_allowed: 'true'
                }
            });
            expect(createPostResponse.ok()).toBeTruthy();
        });

        await test.step('Comment to the post by another user', async () => {
            const loginResponse = await request.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userB.email,
                    password: loginData.userB.password,
                }
            });
            expect(loginResponse.ok()).toBeTruthy();

            const loginJson = await loginResponse.json();
            const dynamicToken = loginJson.session_id;

            const postJson = await createPostResponse.json();
            const postId = postJson.wr_id;
            postUrl = `/community/free/${postId}`;

            await request.post(`${apiBaseURL}/community/board/${postId}/comment`, {
                headers: { 'NAMED-SESSION': `${dynamicToken}` },
                form: {
                    wr_id: postId,
                    board_type: 'free',
                    content: `Auto comment number ${Date.now()}`,
                    comment_type: 'new'
                }
            });
        });
        await test.step('Delete the post', async () => {
            await detailFreePage.navigate(postUrl!);
            await detailFreePage.deletePostBtn.click();
            await expect(detailFreePage.noticeDialog).toContainText(
                `한번 삭제한 게시물은 복구할 방법이 없습니다.
                정말 삭제하시겠습니까?`
            );
            await detailFreePage.dialogCancelBtn.click();
            await expect(detailFreePage.noticeDialog).toBeHidden();
            await expect(page).toHaveURL(postUrl!);

            await detailFreePage.deletePostBtn.click();
            await detailFreePage.dialogConfirmBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.deletePostMsg.success);
            await page.waitForTimeout(3000);
            await detailFreePage.navigate(postUrl!);
            await expect(detailFreePage.noDataLogo).toBeVisible();
        });
    });
})