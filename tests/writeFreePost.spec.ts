import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WriteFreePage } from '../pages/WriteFreePage';
import { DetailFreePage } from '../pages/DetailFreePage';
import loginData from '../data-test/login-data.json';
import postData from '../data-test/write-post-data.json';
import imageData from '../data-test/image-data/.image-data.json';
import videoData from '../data-test/video-data/.video-data.json';

test.describe('Guest Flow', () => {

    test('[Community] Guest is navigated to Login page when accessing Write Post page', async ({ page }) => {
        let writeFreePage: WriteFreePage;
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await expect(page).toHaveURL(/\/login\?callbackUrl=\/community\/create\?boardType=free/);

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.valid.email, loginData.valid.password);
        await expect(page).toHaveURL('/community\/create\?boardType=free');
    });
});

test.describe('Prison Flow', () => {

    test('[Community] A modal should be shown when prisoner accesses Write Post page', async ({ page }) => {
        let writeFreePage: WriteFreePage;
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.prisoner.email, loginData.prisoner.password);
        await expect(writeFreePage.jailPoster).toBeVisible();
        await expect(writeFreePage.prisonNotice).toContainText(
            "서비스 이용 제한 안내" +
            loginData.prisoner.expectedUsername + "님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.");

        await writeFreePage.previousPageBtn.click();
        await expect(page).not.toHaveURL('/community\/create\?boardType=free');
    });
});

test.describe('Phone number Non-verified User Flow', () => {
    test('[Community] Non-verified user should be prevented from writing Free post', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        let writeFreePage: WriteFreePage;
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

        const loginPage = new LoginPage(page);
        await loginPage.login(loginData.nonverifiedUser.email, loginData.nonverifiedUser.password);
        await writeFreePage.closeVerificationPopup();

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.click();
        await expect(writeFreePage.noticeDialog).toContainText(
            "본인 인증을 거치지 않은 경우 글쓰기가 제한됩니다." +
            "본인인증을 진행하시겠습니까?"
        );

        await writeFreePage.noticeDialogCancelBtn.click();
        await expect(page).toHaveURL('/community\/create\?boardType=free');

        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyBtn.click();
        await expect(page.getByRole('heading', { name: '핸드폰 인증받기' })).toBeVisible(); //TODO: Edit locator after creating My Info page
        await expect(page).toHaveURL(/.*mypage\/info/);
    });
});

test.describe('Normal User Flow; Write Post and submit', () => {    //To avoid running parallel tests and violating system rules
    test.use({ storageState: 'playwright/.auth/user.json' });
    test.describe.configure({ mode: 'serial' });

    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] User can write Free post with valid data, add emoji, format text, insert link', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Specific error in initializing the Editor on the WebKit emulator');

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

        await writeFreePage.writeBtn.click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });

        const txtLink = detailFreePage.postContent.getByRole('link', { name: 'Google Search' });
        await expect(txtLink).toBeVisible();
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
    });

    test('[Community] User cannot write post continuously in 1 minute', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.writePost(postData.continuousRule.title, postData.continuousRule.content);
        await writeFreePage.writeBtn.click();
        await writeFreePage.verifyToastMsg("error", postData.continuousRule.toastMsg);
    });

    test('[Community] User can insert valid image into post content', async ({ page, browserName }) => {
        test.setTimeout(75000);
        test.skip(browserName !== 'chromium', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.uploadImageFromMainButton('data-test/image-data/valid-img.png');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.uploadImageFromSubButton('data-test/image-data/valid-gif.gif');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.insertImageByUrl(imageData.valid.path);

        await writeFreePage.enterTitle("이미지");
        await writeFreePage.writeBtn.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(60000);
        await writeFreePage.writeBtn.click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });

        await expect(detailFreePage.postContentImg).toHaveCount(3);
        const count = await detailFreePage.postContentImg.count();
        for (let i = 0; i < count; i++) {
            await expect(detailFreePage.postContentImg.nth(i)).toHaveJSProperty('complete', true);
            const width = await detailFreePage.postContentImg.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
            expect(width).toBeGreaterThan(0);
        }
    });

    test('[Community] User can insert valid video into post content by embed code, URL and uploading from device', async ({ page, browserName }) => {
        test.setTimeout(75000);
        test.skip(browserName !== 'chromium', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.pasteVideoEmbedCode(videoData.valid.embedCode);
        await expect(page.locator(`iframe[src*="${videoData.valid.embedVideoId}"]`)).toBeVisible();
        await page.keyboard.press('Enter');

        await writeFreePage.insertVideoByUrl(videoData.valid.path);
        await expect(page.locator('iframe[src*="aSte18D2_YE"]')).toBeVisible();
        await page.keyboard.press('Enter');

        await writeFreePage.uploadVideoFile('data-test/video-data/valid-video.mp4');
        await expect(page.locator("video[controls='controls']")).toBeVisible();

        await writeFreePage.enterTitle("동영상");
        await writeFreePage.writeBtn.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(60000);
        await writeFreePage.writeBtn.click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });

        await expect(detailFreePage.postVideoIframe).toHaveCount(2);
        await expect(detailFreePage.postVideoIframe.nth(0)).toHaveAttribute('src', /EngW7tLk6R8/);
        await expect(detailFreePage.postVideoIframe.nth(1)).toHaveAttribute('src', /aSte18D2_YE/);

        await expect(detailFreePage.postContentVideo).toBeVisible();
        await expect(detailFreePage.postContentVideo).not.toHaveJSProperty('readyState', 0);
        const videoWidth = await detailFreePage.postContentVideo.evaluate((vid: HTMLVideoElement) => vid.videoWidth);
        expect(videoWidth).toBeGreaterThan(0);
    });
});

test.describe('Normal User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] BO Explain Text should be displayed correctly and link opens in new tab', async ({ page }) => {
        await expect(writeFreePage.boExplainText).toBeVisible();
        const [newTab] = await Promise.all([
            page.context().waitForEvent('page'),
            writeFreePage.boExplainLnk.click(),
        ]);
        await newTab.waitForLoadState();
        expect(newTab.url()).not.toBe('about:blank');
        await newTab.close();
    });

    test('[Community] User can go back when clicking Cancel button', async ({ page }) => {
        const currentUrl = page.url();
        await writeFreePage.cancelBtn.click();
        await expect(page).not.toHaveURL(currentUrl);
    })

    //Invalid titles and contents
    for (const data of postData.invalid) {
        test(`[Community] ${data.name}`, async ({ page, browserName }) => {
            test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

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

    // Invalid links
    for (const data of postData.lnkData.invalid) {
        test(`[Community] ${data.name}`, async ({ page, browserName }) => {
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
    }

    test('[Community] User can open, edit, remove the link inserted in post content', async ({ page, browserName }) => {
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

    test('[Community] Image should not be added when user clicks X button or Cancel button', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.insertImgBtn.click();
        await writeFreePage.addImgLnkBtn.click();
        await writeFreePage.imgLnkInput.fill(imageData.valid.path);
        await writeFreePage.dialogCloseBtn.click();
        await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();

        await writeFreePage.insertImgBtn.click();
        await writeFreePage.addImgLnkBtn.click();
        await writeFreePage.imgLnkInput.fill(imageData.valid.path);
        await writeFreePage.dialogCancelBtn.click();
        await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();
    });

    test('[Community] User can add alt text, link for inserted image', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.uploadImageFromMainButton('data-test/image-data/valid-img.png');
        await writeFreePage.addImgAltTxt("alt text");
        await writeFreePage.addImgLnk(postData.lnkData.fullData.url);
        await expect(writeFreePage.imgArea.locator('img')).toHaveAttribute('alt', 'alt text');
        await expect(writeFreePage.imgArea.locator('a')).toHaveAttribute('href', postData.lnkData.fullData.url);
    });

    test('[Community] User cannot upload invalid image', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.uploadImageFromMainButton(imageData.tooLarge.path);
        await writeFreePage.verifyToastMsg('error', imageData.tooLarge.errorMsg);
        await expect(writeFreePage.imgArea).not.toBeVisible();

        await writeFreePage.uploadImageFromMainButton(imageData.invalidFormat.path);
        await writeFreePage.verifyToastMsg('error', imageData.invalidFormat.errorMsg);
        await expect(writeFreePage.imgArea).not.toBeVisible();

        await writeFreePage.insertImageByUrl(imageData.invalidUrl.path);
        await writeFreePage.verifyToastMsg('error', imageData.invalidUrl.errorMsg);
        await expect(writeFreePage.imgArea).not.toBeVisible();
    });

    test('[Community] Video should not be added when user clicks X button or Cancel button', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.videoMenuBtn.click();
        await writeFreePage.insertVideoLnkBtn.click();
        await writeFreePage.videoLnkInput.fill(videoData.valid.path);
        await writeFreePage.dialogCloseBtn.click();
        await expect(page.locator('iframe[src*="aSte18D2_YE"]')).not.toBeVisible();

        await writeFreePage.videoMenuBtn.click();
        await writeFreePage.insertVideoLnkBtn.click();
        await writeFreePage.videoLnkInput.fill(videoData.valid.path);
        await writeFreePage.dialogCancelBtn.click();
        await expect(page.locator('iframe[src*="aSte18D2_YE"]')).not.toBeVisible();
    });

    test('[Community] User cannot upload invalid video', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        await writeFreePage.insertVideoByUrl(videoData.invalidUrl.path);
        await writeFreePage.verifyToastMsg('error', videoData.invalidUrl.errorMsg);
        await expect(page.locator('figure.media')).not.toBeVisible();

        await writeFreePage.uploadVideoFile(videoData.toolarge.path);
        await writeFreePage.verifyToastMsg('error', videoData.toolarge.errorMsg);
        await expect(page.locator('figure.video')).not.toBeVisible();

        await writeFreePage.uploadVideoFile(videoData.invalidFormat.path);
        await writeFreePage.verifyToastMsg('error', videoData.invalidFormat.errorMsg);
        await expect(page.locator('figure.video')).not.toBeVisible();
    });

    test('[Community] User can click 이용약관 to open Terms in new tab', async () => {
        const newTab = await writeFreePage.clickTermsLnk();
        await newTab.waitForLoadState();
        await expect(newTab).toHaveURL('/corp\/service');
    });

    test('[Community] User can click 영창/수감규정 to open Terms in new tab', async () => {
        const newTab = await writeFreePage.clickPrisonTermsLnk();
        await newTab.waitForLoadState();
        await expect(newTab).toHaveURL('/customercenter\/prison\/regulation');
    });
});

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] Admin can assign author for the post', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const selectedAuthor = await writeFreePage.selectFirstAuthor();
        expect(selectedAuthor).not.toBe('');

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await writeFreePage.writeBtn.click();

        const detailFreePage = new DetailFreePage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });
        await expect(detailFreePage.postAuthor).toContainText(selectedAuthor);
    });
});