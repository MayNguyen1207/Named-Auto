import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import loginData from '../../../data-test/login-data.json';
import postData from '../../../data-test/write-post-data.json';
import imageData from '../../../data-test/image-data/.image-data.json';
import videoData from '../../../data-test/video-data/.video-data.json';

test.describe('Normal User Flow; Write Post and submit', () => {

    test.describe.serial('Continuously create posts', () => {
        test.use({ storageState: 'playwright/.auth/user.json' });

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

        test('[Community] User cannot write post continuously in 1 minute', async ({ browserName }) => {
            test.skip(browserName !== 'chromium', 'Specific error in initializing the Editor on the WebKit emulator');

            await writeFreePage.writePost(postData.continuousRule.title, postData.continuousRule.content);
            await writeFreePage.writeBtn.click();
            await writeFreePage.verifyToastMsg("error", postData.continuousRule.toastMsg);
        });
    });

    test('[Community] User can insert valid image into post content', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login(loginData.userB.email, loginData.userB.password);

        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

        await writeFreePage.uploadImageFromMainButton('data-test/image-data/valid-img.png');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.uploadImageFromSubButton('data-test/image-data/valid-gif.gif');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        await writeFreePage.insertImageByUrl(imageData.valid.path);

        await writeFreePage.enterTitle("이미지");
        await writeFreePage.writeBtn.scrollIntoViewIfNeeded();
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
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const loginPage = new LoginPage(page);
        await loginPage.navigate();
        await loginPage.login(loginData.userC.email, loginData.userC.password);

        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();

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
        test(`[Community] ${data.name}`, async ({ browserName }) => {
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

    test('[Community] User can open, edit, remove the link inserted in post content', async ({ browserName }) => {
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

        const buttonsToTest = [writeFreePage.dialogCloseBtn, writeFreePage.dialogCancelBtn];

        for (const btn of buttonsToTest) {
            await writeFreePage.insertImgBtn.click();
            await writeFreePage.addImgLnkBtn.click();
            await writeFreePage.imgLnkInput.fill(imageData.valid.path);
            await btn.click();
            await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();
        }
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

        const invalidCases = [
            { action: () => writeFreePage.uploadImageFromMainButton(imageData.tooLarge.path), data: imageData.tooLarge },
            { action: () => writeFreePage.uploadImageFromMainButton(imageData.invalidFormat.path), data: imageData.invalidFormat },
            { action: () => writeFreePage.insertImageByUrl(imageData.invalidUrl.path), data: imageData.invalidUrl }
        ];

        for (const { action, data } of invalidCases) {
            await action();
            await writeFreePage.verifyToastMsg('error', data.errorMsg);
            await expect(writeFreePage.imgArea).not.toBeVisible();
        }
    });

    test('[Community] Video should not be added when user clicks X button or Cancel button', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const buttonsToTest = [writeFreePage.dialogCloseBtn, writeFreePage.dialogCancelBtn];

        for (const btn of buttonsToTest) {
            await writeFreePage.videoMenuBtn.click();
            await writeFreePage.insertVideoLnkBtn.click();
            await writeFreePage.videoLnkInput.fill(videoData.valid.path);
            await btn.click();
            await expect(page.locator('iframe[src*="aSte18D2_YE"]')).not.toBeVisible();
        }
    });

    test('[Community] User cannot upload invalid video', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Specific error in initializing the Editor on the WebKit emulator');

        const invalidCases = [
            { action: () => writeFreePage.insertVideoByUrl(videoData.invalidUrl.path), data: videoData.invalidUrl, locator: 'figure.media' },
            { action: () => writeFreePage.uploadVideoFile(videoData.toolarge.path), data: videoData.toolarge, locator: 'figure.video' },
            { action: () => writeFreePage.uploadVideoFile(videoData.invalidFormat.path), data: videoData.invalidFormat, locator: 'figure.video' }
        ];

        for (const { action, data, locator } of invalidCases) {
            await action();
            await writeFreePage.verifyToastMsg('error', data.errorMsg);
            await expect(page.locator(locator)).not.toBeVisible();
        }
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