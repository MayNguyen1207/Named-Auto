import { test, expect } from '../../../../utils/fixtures';
import { LoginPage } from '../../../../pages/LoginPage';
import { SoccerDetailWritePage } from '../../../../pages/sports/soccer/SoccerDetailWritePage';
import { WriteFreePage } from '../../../../pages/WriteFreePage';
import { DetailFreePage } from '../../../../pages/DetailFreePage';
import matchData from '../../../../data-test/match-detail-data.json';
import loginData from '../../../../data-test/login-data.json';
import postData from '../../../../data-test/write-post-data.json';
import imageData from '../../../../data-test/image-data/.image-data.json';
import videoData from '../../../../data-test/video-data/.video-data.json';

test.describe('Normal user', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailWritePage: SoccerDetailWritePage;
    let writeFreePage: WriteFreePage;
    const matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailWritePage = new SoccerDetailWritePage(page);
        await soccerDetailWritePage.navigateWrite(matchId);

        writeFreePage = new WriteFreePage(page);
    });

    test('[Soccer] Popup title is displayed normally and user can close the popup', async ({ page }) => {
        await expect(soccerDetailWritePage.popupHeader).toContainText('분석글 작성');

        await soccerDetailWritePage.closeBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis`);
    });

    test('[Soccer] Sport type and match are pre-filled', async ({ request, sportsApiBaseURL }) => {
        await expect(soccerDetailWritePage.sportCombo).toHaveText('축구');
        await expect(soccerDetailWritePage.sportCombo).toBeDisabled();

        const response = await request.get(`${sportsApiBaseURL}/v1.0/sports/soccer/games/${matchId}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const homeTeam = data.teams?.home?.name;
        const awayTeam = data.teams?.away?.name;

        await expect(soccerDetailWritePage.matchCombo).toHaveText(`${homeTeam} vs ${awayTeam}`);
        await expect(soccerDetailWritePage.matchCombo).toBeDisabled();
    });

    test('[Soccer] User can close popup when clicking Cancel button', async ({ page }) => {
        await writeFreePage.cancelBtn.click();
        await expect(page).toHaveURL(`/match/soccer/${matchId}/analysis`);
    });

    test('[Soccer] User can write Free post with valid data, add emoji, format text, insert link', async ({ page, browserName, request, apiBaseURL }) => {
        test.skip(browserName !== 'chromium', 'Avoid violating system rule');
        test.setTimeout(60000);

        await writeFreePage.insertLink(postData.lnkData.fullData.text, postData.lnkData.fullData.url);
        await page.keyboard.press('Enter');
        await writeFreePage.insertLink(postData.lnkData.onlyUrl.text, postData.lnkData.onlyUrl.url);
        await page.keyboard.press('Enter');

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await page.keyboard.press('Enter');

        await writeFreePage.emojiBtn.click();

        await writeFreePage.contentInput.focus();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Home');
        await page.keyboard.press('Shift+End');
        await writeFreePage.boldBtn.click();

        await writeFreePage.writeBtn.last().click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(new RegExp(`match/soccer/${matchId}/analysis\\?postId=`), { timeout: 15000 });

        const txtLink = detailFreePage.postContent.getByRole('link', { name: 'Google Search' });
        await expect(txtLink).toBeVisible({ timeout: 15000 });
        await expect(txtLink).toHaveAttribute('href', "https://www.google.com");

        const plainLink = detailFreePage.postContent.getByRole('link', { name: 'https://mail.google.com' });
        await expect(plainLink).toBeVisible();
        await expect(plainLink).toHaveAttribute('href', "https://mail.google.com");

        await expect(detailFreePage.postTitle).toHaveText(postData.valid.title);
        await expect(detailFreePage.postContent).toContainText(postData.valid.content);

        await expect(detailFreePage.emojiImg.first()).toBeVisible();

        const innerHTML = await detailFreePage.postContent.innerHTML();
        console.log(innerHTML);
        expect(innerHTML).toContain('<strong>업종별로는 반도체 제조업의 배당금 규모가 5조 6924억 원으로 전체의 15.1%를 차지하며 가장 많았다.</strong>');

        const currentUrl = new URL(page.url());
        const postId = currentUrl.searchParams.get('postId');
        if (postId) {
            await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId, 'sports_analysis');
        }
    });

    test('[Soccer] User can insert valid image into post content', async ({ page, browserName, request, apiBaseURL }) => {
        test.skip(browserName !== 'firefox', 'Avoid violating system rule');
        test.setTimeout(60000);

        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login(loginData.userB.email, loginData.userB.password);
        await expect(page).toHaveURL('/home', { timeout: 10000 });

        await soccerDetailWritePage.navigateWrite(matchId);

        await writeFreePage.seeMoreBtn.click();
        await writeFreePage.uploadImageFromMainButton('data-test/image-data/valid-img.png');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.seeMoreBtn.click();
        await writeFreePage.uploadImageFromSubButton('data-test/image-data/valid-gif.gif');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.seeMoreBtn.click();
        await writeFreePage.insertImageByUrl(imageData.valid.path);

        await writeFreePage.enterTitle("이미지");
        await writeFreePage.writeBtn.last().scrollIntoViewIfNeeded();
        await writeFreePage.writeBtn.last().click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(new RegExp(`match/soccer/${matchId}/analysis\\?postId=`), { timeout: 15000 });

        await expect(detailFreePage.postContentImg).toHaveCount(3, { timeout: 15000 });
        const count = await detailFreePage.postContentImg.count();
        for (let i = 0; i < count; i++) {
            await expect(detailFreePage.postContentImg.nth(i)).toHaveJSProperty('complete', true);
            const width = await detailFreePage.postContentImg.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
            expect(width).toBeGreaterThan(0);
        }

        const currentUrl = new URL(page.url());
        const postId = currentUrl.searchParams.get('postId');
        if (postId) {
            await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId, 'sports_analysis');
        }
    });

    //Invalid titles and contents
    for (const data of postData.invalid) {
        test(`[Soccer] ${data.name}`, async ({ browserName }) => {
            test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

            await writeFreePage.writePost(data.title, data.content);
            switch (data.id) {
                case 'spaceTitle':
                    await expect(writeFreePage.writeBtn.last()).toBeDisabled();
                    await writeFreePage.titleInput.clear();
                    await expect(writeFreePage.titleErrorMsg).toBeVisible();
                    break;
                case 'emptyTitle':
                case 'emptyContent':
                    await expect(writeFreePage.writeBtn.last()).toBeDisabled();
                    break;
                default:
                    await expect(writeFreePage.writeBtn.last()).toBeEnabled();
                    await writeFreePage.writeBtn.last().click();
                    break;
            }
            if (data.toastMsg) {
                await writeFreePage.verifyToastMsg('error', data.toastMsg);
            }
        });
    };

    // Invalid links
    for (const data of postData.lnkData.invalid) {
        test(`[Soccer] ${data.name} zzz`, async ({ browserName }) => {
            test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');
            await writeFreePage.insertLink(data.text, data.url);
            switch (data.id) {
                case 'onlyTxt':
                    await expect(writeFreePage.errorLnkMsg).toBeVisible();
                    break;
                case 'invalidLnk':
                    await writeFreePage.verifyToastMsg('error', data.errorMsg);
                    break;
            }
        });
    };

    test('[Soccer] User can open, edit, remove the link inserted in post content', async ({ browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const initialTxt = postData.lnkData.fullData.text;
        const initialUrl = postData.lnkData.fullData.url;
        await writeFreePage.insertLink(initialTxt, initialUrl);

        const lnkInEditor = writeFreePage.contentInput.locator(`a[href="${initialUrl}"]`);
        await lnkInEditor.click();
        await expect(writeFreePage.lnkPreview).toHaveText(initialUrl);
        await expect(writeFreePage.lnkPreview).toHaveAttribute('href', initialUrl);

        await writeFreePage.editLnkBtn.click();
        const newTxt = postData.lnkData.newLnk.text;
        const newUrl = postData.lnkData.newLnk.url;
        await writeFreePage.updateLink(newTxt, newUrl);

        const updatedLnkInEditor = writeFreePage.contentInput.locator(`a[href="${newUrl}"]`);
        await expect(updatedLnkInEditor).toBeVisible();
        await expect(updatedLnkInEditor).toHaveText(newTxt);

        await updatedLnkInEditor.click();
        await writeFreePage.lnkAttributeBtn.click();
        await expect(writeFreePage.toggleTabBtn).toHaveAttribute('aria-pressed', 'true');
        await writeFreePage.toggleTabBtn.click();
        await expect(writeFreePage.toggleTabBtn).toHaveAttribute('aria-pressed', 'false');
    });

    test('[Soccer] Image should not be added when user clicks X button or Cancel button', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const buttonsToTest = [writeFreePage.dialogCloseBtn, writeFreePage.dialogCancelBtn];

        for (const btn of buttonsToTest) {
            await writeFreePage.seeMoreBtn.click();
            await writeFreePage.insertImgBtn.click();
            await writeFreePage.addImgLnkBtn.click();
            await writeFreePage.imgLnkInput.fill(imageData.valid.path);
            await btn.click();
            await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();
        }
    });

    test('[Soccer] User cannot upload invalid image', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const invalidCases = [
            { action: () => writeFreePage.uploadImageFromMainButton(imageData.tooLarge.path), data: imageData.tooLarge },
            { action: () => writeFreePage.uploadImageFromMainButton(imageData.invalidFormat.path), data: imageData.invalidFormat },
            { action: () => writeFreePage.insertImageByUrl(imageData.invalidUrl.path), data: imageData.invalidUrl }
        ];

        await writeFreePage.seeMoreBtn.click();
        for (const { action, data } of invalidCases) {
            await action();
            await writeFreePage.verifyToastMsg('error', data.errorMsg);
            await expect(writeFreePage.imgArea).not.toBeVisible();
        }
    });

    test('[Soccer] Video should not be added when user clicks X button or Cancel button', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const buttonsToTest = [writeFreePage.dialogCloseBtn, writeFreePage.dialogCancelBtn];

        for (const btn of buttonsToTest) {
            await writeFreePage.seeMoreBtn.click();
            await writeFreePage.videoMenuBtn.click();
            await writeFreePage.insertVideoLnkBtn.click();
            await writeFreePage.videoLnkInput.fill(videoData.valid.path);
            await btn.click();
            await expect(page.locator('iframe[src*="aSte18D2_YE"]')).not.toBeVisible();
        }
    });

    test('[Soccer] User cannot upload invalid video', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const invalidCases = [
            { action: () => writeFreePage.insertVideoByUrl(videoData.invalidUrl.path), data: videoData.invalidUrl, locator: 'figure.media' },
            { action: () => writeFreePage.uploadVideoFile(videoData.toolarge.path), data: videoData.toolarge, locator: 'figure.video' },
            { action: () => writeFreePage.uploadVideoFile(videoData.invalidFormat.path), data: videoData.invalidFormat, locator: 'figure.video' }
        ];

        for (const { action, data, locator } of invalidCases) {
            await writeFreePage.seeMoreBtn.click();
            await action();
            await writeFreePage.verifyToastMsg('error', data.errorMsg);
            await expect(page.locator(locator)).not.toBeVisible();
        }
    });

    test('[Soccer] System can handle XSS script', async ({ page, browserName, request, apiBaseURL }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.writePost(postData.xss.title, postData.xss.content);
        await writeFreePage.writeBtn.last().click();
        
        const detailFreePage = new DetailFreePage(page);
        await expect(detailFreePage.postTitle).toHaveText(postData.xss.expectedTitle);
        expect(await detailFreePage.postContent.innerHTML()).toBe(`<p>${postData.xss.expectedContent}</p>`);

        const currentUrl = new URL(page.url());
        const postId = currentUrl.searchParams.get('postId');
        if (postId) {
            await detailFreePage.deletePostViaAPI(request, apiBaseURL, postId, 'sports_analysis');
        }
    });

    test('[Soccer] User can click 이용약관 to open Terms in new tab', async () => {
        const newTab = await writeFreePage.clickTermsLnk();
        await newTab.waitForLoadState();
        await expect(newTab).toHaveURL('/corp\/service');
    });

    test('[Soccer] User can click 영창/수감규정 to open Terms in new tab', async () => {
        const newTab = await writeFreePage.clickPrisonTermsLnk();
        await newTab.waitForLoadState();
        await expect(newTab).toHaveURL('/customercenter\/prison\/regulation');
    });
});