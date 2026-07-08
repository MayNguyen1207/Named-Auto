import { test, expect } from '../utils/fixtures';
import { LoginPage } from '../pages/LoginPage';
import { DetailFreePage } from '../pages/DetailFreePage';
import { WriteFreePage } from '../pages/WriteFreePage';
import loginData from '../data-test/login-data.json';
import freePostData from '../data-test/free-post-data.json';
import { getExpectedRelativeTime } from '../utils/testRelativeTime';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

test.describe('Guest Flow', () => {

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 5회 이상
            게시물을 열람하시겠습니까?`
        );

        await detailFreePage.restrictedPostBackBtn.click();;
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedFiveTimePost);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click View button to View post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeHidden();
        await detailFreePage.restrictedPostViewBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeVisible();
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 10 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedTenTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 10회 이상`
        );
        await expect(detailFreePage.restrictedPostViewBtn).toBeHidden();
        await detailFreePage.restrictedPostBackBtn.click();
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedTenTimePost);
    });

    test('[Community] Context Menu should be shown when clicking post author nickname', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.postAuthor.click();
        await expect(page.getByTestId('dropdown-menu-content')).toBeVisible();
    });

    test('[Community] Number of post edition should be shown', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        const editNum = await detailFreePage.editNumTxt.textContent();
        expect(editNum).toMatch(/수정 \d+/);
        await detailFreePage.editNumTxt.hover();
        await detailFreePage.hoverTooltip.waitFor({ state: 'visible', timeout: 5000 });
        const tooltipText = await detailFreePage.hoverTooltip.textContent();
        expect(tooltipText).toMatch(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}/);
    });

    test('[Community] Move to Login popup should be shown when guest likes the post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.likeBtn.scrollIntoViewIfNeeded();
        await expect(detailFreePage.likeBtn).toHaveText(/\d+/);
        await detailFreePage.likeBtn.click();
        await expect(detailFreePage.moveLogin).toBeVisible();
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
            detailFreePage.postContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            detailFreePage.noOtherPostTxt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
        ]);
        if (await detailFreePage.noOtherPostTxt.isVisible()) {
            await expect(detailFreePage.noOtherPostTxt).toBeVisible();
            await expect(detailFreePage.sugPagiantion).toBeHidden();
            return;
        } else {
            await expect(detailFreePage.postContainer).toBeVisible();
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
    });

    test('[Community] Guest cannot comment in post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.cmtInput.scrollIntoViewIfNeeded();
        await detailFreePage.cmtInput.click();
        await expect(detailFreePage.moveLogin).toBeVisible();

        await detailFreePage.moveLoginCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.cmtInput.click();
        await detailFreePage.moveLoginCfBtn.click();
        await expect(page).toHaveURL(/.*\/login/);
        const loginPage = new LoginPage(page);
        await page.waitForTimeout(500);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);
    });

    test('[Community] Reply and Report Cmt button should be shown in guest view', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const firstCmt = detailFreePage.getCmtElements(0);
        await expect(firstCmt.authorLabel).toBeVisible();
        await expect(firstCmt.myCmtLabel).toBeHidden();
        await expect(firstCmt.replyBtn).toBeVisible();
        await expect(firstCmt.reportBtn).toBeVisible();
        await expect(firstCmt.editBtn).toBeHidden();
        await expect(firstCmt.deleteBtn).toBeHidden();

        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.authorLabel).toBeHidden();
        await expect(secondCmt.myCmtLabel).toBeHidden();
        await expect(secondCmt.replyBtn).toBeVisible();
        await expect(secondCmt.reportBtn).toBeVisible();
        await expect(secondCmt.editBtn).toBeHidden();
        await expect(secondCmt.deleteBtn).toBeHidden();

        const thirdCmt = detailFreePage.getCmtElements(2);
        await expect(thirdCmt.authorLabel).toBeHidden();
        await expect(thirdCmt.myCmtLabel).toBeHidden();
        await expect(thirdCmt.replyBtn).toBeVisible();
        await expect(thirdCmt.reportBtn).toBeHidden();
        await expect(thirdCmt.editBtn).toBeHidden();
        await expect(thirdCmt.deleteBtn).toBeHidden();
    });

    test('[Community] Edit Label should be shown for comment that has been edited', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);
        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.editLabel).toBeVisible();
        await secondCmt.editLabel.hover();
        await expect(detailFreePage.hoverTooltip).toContainText('2026.07.07 18:57:23');
    });
});

test.describe('Prisoner Flow', () => {
    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await page.waitForTimeout(500);
        await loginPage.login(loginData.prisoner.email, loginData.prisoner.password);
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Prisoner cannot comment on a Free post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await detailFreePage.writeCmt(`${Date.now()}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.prisoner);
    });

    test('[Community] Prisoner cannot edit Free post', async ({ page }) => {
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

test.describe('Non-verified User Flow', () => {
    test('[Community] Non-verified user cannot comment on a Free post', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await page.waitForTimeout(500);
        await loginPage.login(loginData.nonverifiedUser.email, loginData.nonverifiedUser.password);

        let detailFreePage: DetailFreePage;
        detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.normalPost);
        await page.waitForTimeout(1000);
        await detailFreePage.writeCmt(`${Date.now}`);
        await expect(detailFreePage.noticeDialog).toContainText(
            "댓글은 본인 인증을 해야만 쓰실 수 있습니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await detailFreePage.noticeDialogCancelBtn.click();
        await expect(page).toHaveURL(freePostData.postUrl.normalPost);

        await detailFreePage.writeCmt(`${Date.now}`);
        await detailFreePage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test.describe('Tests that need a brand new post', () => {
        let sharedPostUrl = '';
        let sharedPostId = '';
        let dynamicTokenUserB = '';

        test.beforeAll(async ({ apiBaseURL, request }) => {
            const loginResponse = await request.post(`${apiBaseURL}/login`, {
                form: {
                    email: loginData.userB.email,
                    password: loginData.userB.password,
                }
            });
            expect(loginResponse.ok()).toBeTruthy();

            const loginJson = await loginResponse.json();
            dynamicTokenUserB = loginJson.session_id;

            const createPostResponse = await request.post(`${apiBaseURL}/community/board`, {
                headers: { 'NAMED-SESSION': `${dynamicTokenUserB}` },
                form: {
                    board_type: 'free',
                    subject: `Auto Test Shared Post ${Date.now()}`,
                    content: '<p>Bài viết dùng chung để test Like, Report và Comment Pagination...</p>',
                    is_notice: 'false',
                    comment_allowed: 'true'
                }
            });
            expect(createPostResponse.ok()).toBeTruthy();
            const postJson = await createPostResponse.json();
            sharedPostId = postJson.wr_id;
            sharedPostUrl = `/community/free/${sharedPostId}`;
        });

        test('[Community] Normal user can like a post only 1 time', async ({ page }) => {
            await detailFreePage.navigate(sharedPostUrl);
            await page.waitForTimeout(500);
            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.likeMsg.success);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');

            await detailFreePage.likeBtn.click();
            await detailFreePage.verifyToastMsg("error", freePostData.likeMsg.duplicateLike);
            await expect(detailFreePage.likeBtn.locator('span')).toHaveText('1');
        });

        test('[Community] Normal user can report another user\'s post only 1 time', async ({ page }) => {
            await detailFreePage.navigate(sharedPostUrl);
            await page.waitForTimeout(500);
            await detailFreePage.reportBtn.click();
            await detailFreePage.verifyReportPopupOptions();
            await expect(detailFreePage.reportTextArea).toBeHidden();
            const reasonText = '이 게시물은 커뮤니티 규정을 위반합니다.';
            await detailFreePage.selectReportOptionAndFillReason('기타 부정행위', reasonText);
            await detailFreePage.popupReportBtn.click();
            await detailFreePage.verifyToastMsg("success", freePostData.reportMsg.success);
            await page.waitForTimeout(500);

            await detailFreePage.reportBtn.click();
            await detailFreePage.selectReportOptionAndFillReason('비매너');
            await detailFreePage.popupReportBtn.click();
            await detailFreePage.verifyToastMsg("error", freePostData.reportMsg.duplicateReport);
        });

        test('[Community] Verify comment chronological order and pagination (Oldest first, Newest last)', async ({ page, apiBaseURL, request }) => {
            const totalCommentsToCreate = 25;
            for (let i = 1; i <= totalCommentsToCreate; i++) {
                await request.post(`${apiBaseURL}/community/board/${sharedPostId}/comment`, {
                    headers: { 'NAMED-SESSION': `${dynamicTokenUserB}` },
                    form: {
                        wr_id: sharedPostId,
                        board_type: 'free',
                        content: `Auto comment number ${i}`,
                        comment_type: 'new'
                    }
                });
            }

            await detailFreePage.navigate(sharedPostUrl);
            await page.waitForTimeout(500);

            const lastCommentOnDefaultPage = detailFreePage.cmtItems.last();
            await expect(lastCommentOnDefaultPage).toContainText(`Auto comment number ${totalCommentsToCreate}`);

            await detailFreePage.cmtFirstPageBtn.click();
            await page.waitForTimeout(500);
            const firstCommentOnFirstPage = detailFreePage.cmtItems.first();
            await expect(firstCommentOnFirstPage).toContainText('Auto comment number 1');
        });
    });

    test('[Community] Normal user cannot like my own post, [Report] button is hidden in my own post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.myPost);
        await page.waitForTimeout(500);
        const likeNumber = await detailFreePage.likeBtn.locator('span').textContent() ?? '';
        await detailFreePage.likeBtn.click();
        await detailFreePage.verifyToastMsg("error", freePostData.likeMsg.likeMyOwnPost);
        await expect(detailFreePage.likeBtn.locator('span')).toHaveText(likeNumber);
        await expect(detailFreePage.reportBtn).toBeHidden();
    });

    test('[Community] Report button is hidden in Notice post', async () => {
        await detailFreePage.navigate(freePostData.postUrl.noticePost);
        await expect(detailFreePage.reportBtn).toBeHidden();
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
        const titleAfter = titleBefore + `${Date.now()}`;
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

        await detailFreePage.navigate(postUrl);
        await detailFreePage.deletePostBtn.click();
        await expect(detailFreePage.noticeDialog).toHaveText(
            "한번 삭제한 게시물은 복구할 방법이 없습니다." +
            "정말 삭제하시겠습니까?"
        );
        await detailFreePage.noticeDialogCancelBtn.click();
        await expect(detailFreePage.noticeDialog).toBeHidden();
        await expect(page).toHaveURL(postUrl);

        await detailFreePage.deletePostBtn.click();
        await detailFreePage.noticeDialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("success", "삭제되었습니다.");
        await detailFreePage.navigate(postUrl);
        await expect(detailFreePage.noDataLogo).toBeVisible();
    });

    test('[Community] Normal user can write a comment successfully', async ({ page, apiBaseURL, playwright }) => {
        const apiContext = await playwright.request.newContext();
        const loginResponse = await apiContext.post(`${apiBaseURL}/login`, {
            form: {
                email: loginData.valid.email,
                password: loginData.valid.password,
            }
        });
        const loginJson = await loginResponse.json();
        const dynamicToken = loginJson.session_id;

        const createPostResponse = await apiContext.post(`${apiBaseURL}/community/board`, {
            headers: { 'NAMED-SESSION': `${dynamicToken}` },
            form: {
                board_type: 'free',
                subject: `Post for UI Comment Test ${Date.now()}`,
                content: '<p>Bài viết sạch dùng để test viết comment...</p>',
                is_notice: 'false',
                comment_allowed: 'true'
            }
        });
        expect(createPostResponse.ok()).toBeTruthy();
        const postJson = await createPostResponse.json();
        const newPostUrl = `/community/free/${postJson.wr_id}`;

        await detailFreePage.navigate(newPostUrl);
        await page.waitForTimeout(500);
        await expect(detailFreePage.noCommentTxt).toBeVisible();
        await expect(detailFreePage.cmtCount).toHaveText("0");

        const myCommentText = `Auto comment at ${Date.now()}`;
        await detailFreePage.cmtInput.fill(myCommentText);
        await detailFreePage.submitCmtBtn.click();

        await detailFreePage.verifyToastMsg("success", freePostData.cmtMsg.success);
        await expect(detailFreePage.cmtItems.first()).toContainText(myCommentText);
        await expect(detailFreePage.noCommentTxt).toBeHidden();
        await expect(detailFreePage.cmtCount).toHaveText("1");
    });

    for (const data of freePostData.invalidCmt) {
        test(`[Community] ${data.name}`, async () => {
            await detailFreePage.navigate(freePostData.postUrl.normalPost);
            await detailFreePage.writeCmt(data.content);
            await detailFreePage.verifyToastMsg("error", data.errorMsg)
        });
    }

    test('[Community] User cannot comment in a post whose author has blocked the user', async () => {
        await detailFreePage.navigate(freePostData.postUrl.blockedPost);
        await detailFreePage.writeCmt(`${Date.now}`);
        await detailFreePage.verifyToastMsg("error", freePostData.cmtMsg.block)
    });

    test('[Community] Check the display of comment in normal user view', async () => {
        await detailFreePage.navigate(freePostData.postUrl.commentPost);

        const firstCmt = detailFreePage.getCmtElements(0);
        await expect(firstCmt.authorLabel).toBeVisible();
        await expect(firstCmt.myCmtLabel).toBeHidden();
        await expect(firstCmt.replyBtn).toBeVisible();
        await expect(firstCmt.reportBtn).toBeVisible();
        await expect(firstCmt.editBtn).toBeHidden();
        await expect(firstCmt.deleteBtn).toBeHidden();

        const secondCmt = detailFreePage.getCmtElements(1);
        await expect(secondCmt.authorLabel).toBeHidden();
        await expect(secondCmt.myCmtLabel).toBeVisible();
        await expect(secondCmt.replyBtn).toBeVisible();
        await expect(secondCmt.reportBtn).toBeHidden();
        await expect(secondCmt.editBtn).toBeVisible();
        await expect(secondCmt.deleteBtn).toBeVisible();

        const thirdCmt = detailFreePage.getCmtElements(2);
        await expect(thirdCmt.authorLabel).toBeHidden();
        await expect(thirdCmt.myCmtLabel).toBeHidden();
        await expect(thirdCmt.replyBtn).toBeVisible();
        await expect(thirdCmt.reportBtn).toBeHidden();
        await expect(thirdCmt.editBtn).toBeHidden();
        await expect(thirdCmt.deleteBtn).toBeHidden();
    });
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let detailFreePage: DetailFreePage;

    test.beforeEach(async ({ page }) => {
        detailFreePage = new DetailFreePage(page);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click Previous button to go back', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.restrictedPostDialog).toBeVisible();
        await expect(detailFreePage.restrictedPostDialog).toContainText(
            `이 게시물은 회원님들의 신고로 인해 열람이 제한되어 있습니다.
            누적 신고 건수 5회 이상
            게시물을 열람하시겠습니까?`
        );

        await detailFreePage.restrictedPostBackBtn.click()
        await expect(page).not.toHaveURL(freePostData.postUrl.reportedFiveTimePost);
    });

    test('[Community] Restricted post popup should be showed if the post has been reported 5 > 9 times, click View button to View post', async ({ page }) => {
        await detailFreePage.navigate(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeHidden();
        await detailFreePage.restrictedPostViewBtn.click()
        await expect(page).toHaveURL(freePostData.postUrl.reportedFiveTimePost);
        await expect(detailFreePage.postContent).toBeVisible();
    });
});

test.describe('Verify post creation date time display', () => {
    test.use({ timezoneId: 'Asia/Seoul' });

    const timeTestCases = [
        { value: 30, unit: 'second', expectedRelative: '방금' },
        { value: 45, unit: 'minute', expectedRelative: '45분 전' },
        { value: 5, unit: 'hour', expectedRelative: '5시간 전' },
        { value: 3, unit: 'day', expectedRelative: '3일 전' },
        { value: 2, unit: 'week', expectedRelative: '2주 전' },
        { value: 6, unit: 'month', expectedRelative: '6개월 전' },
        { value: 14, unit: 'month', expectedRelative: '1년 전' },
    ];

    for (const data of timeTestCases) {
        test(`[Community] Post creation date time should be displayed in correct format (${data.value} ${data.unit}(s) ago)`, async ({ page }) => {
            const detailFreePage = new DetailFreePage(page);
            const postId = detailFreePage.getPostIdFromUrl(freePostData.postUrl.normalPost);

            const fakeSystemTime = dayjs().tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm:ssZ'); //Set current time to a fixed time
            await page.clock.setFixedTime(fakeSystemTime);

            const mockCreatedTime = dayjs(fakeSystemTime) //Calculate the post creation time
                .subtract(data.value, data.unit as dayjs.ManipulateType)
                .toISOString();

            await page.route(`**/community/board/${postId}*`, async (route) => {
                const response = await route.fetch();
                const json = await response.json();
                json.wr_datetime = dayjs(mockCreatedTime).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
                await route.fulfill({ response, json });
            });

            await detailFreePage.navigate(freePostData.postUrl.normalPost);

            const expectedRelativeText = data.expectedRelative || getExpectedRelativeTime(mockCreatedTime);
            await expect(detailFreePage.postCreationTime).toHaveText(expectedRelativeText);

            await detailFreePage.postCreationTime.hover();
            const expectedDetailText = dayjs(mockCreatedTime).tz('Asia/Seoul').format('YYYY.MM.DD HH:mm');
            await page.waitForTimeout(500);
            await expect(detailFreePage.hoverTooltip).toContainText(expectedDetailText);

            await detailFreePage.postCreationTime.click();
            await expect(detailFreePage.postCreationTime).toContainText(expectedDetailText);
            await page.mouse.move(0, 0);
            await page.waitForTimeout(200);
            await detailFreePage.postCreationTime.hover();
            await expect(detailFreePage.hoverTooltip).toContainText(expectedRelativeText);

            await detailFreePage.postCreationTime.click();
            await expect(detailFreePage.postCreationTime).toHaveText(expectedRelativeText);
        });
    }
});