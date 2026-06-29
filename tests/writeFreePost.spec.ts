import { test, expect } from '@playwright/test';
import { WriteFreePage } from '../pages/WriteFreePage';
import { PostDetailPage } from '../pages/PostDetailPage';
import postData from '../data-test/write-post-data.json';
import imageData from '../data-test/image-data/.image-data.json';

test.describe('Guest Flow', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        test.setTimeout(30000);
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] Guest is navigated to Login page when accessing Write Post page', async ({ page }) => {
        await expect(page).toHaveURL(/\/login\?callbackUrl=\/community\/create\?boardType=free/);
    });
});

test.describe('Normal User Flow', () => {
    let writeFreePage: WriteFreePage;

    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });

    test('[Community] User can go back when clicking Cancel button', async ({ page }) => {
        const currentUrl = page.url();
        await writeFreePage.cancelBtn.click();
        await expect(page).not.toHaveURL(currentUrl);
    })

    test('[Community] User can write Free post with valid data, add emoji, format text, insert link and insert valid image', async ({ page }) => {
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

        const postDetailPage = new PostDetailPage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });

        const txtLink = postDetailPage.postContent.getByRole('link', { name: 'Google Search' });
        await expect(txtLink).toBeVisible();
        await expect(txtLink).toHaveAttribute('href', "https://www.google.com");

        const plainLink = postDetailPage.postContent.getByRole('link', { name: 'https://mail.google.com' });
        await expect(plainLink).toBeVisible();
        await expect(plainLink).toHaveAttribute('href', "https://mail.google.com");

        await expect(postDetailPage.postTitle).toHaveText(postData.valid.title);
        await expect(postDetailPage.postContent).toContainText(postData.valid.content);

        await expect(postDetailPage.emojiImg.first()).toBeVisible();

        const innerHTML = await postDetailPage.postContent.innerHTML();
        console.log(innerHTML);
        expect(innerHTML).toContain('<strong>업종별로는 반도체 제조업의 배당금 규모가 5조 6924억 원으로 전체의 15.1%를 차지하며 가장 많았다.</strong>');
    });

    /*TODO: Update after dev update Bypass ReCaptcha
    test('[Community] User can insert valid image into post content', async ({page}) => {
        await writeFreePage.enterTitle("이미지");
        await writeFreePage.uploadImageFromMainButton('data-test/image-data/valid-img.png');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await writeFreePage.uploadImageFromSubButton('data-test/image-data/valid-gif.gif');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await writeFreePage.insertImageByUrl(imageData.valid.path);
        await writeFreePage.writeBtn.click();

        const postDetailPage = new PostDetailPage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });

        await expect(postDetailPage.postContentImg).toHaveCount(3);
        const count = await postDetailPage.postContentImg.count();
        for (let i = 0; i < count; i++) {
            await expect(postDetailPage.postContentImg.nth(i)).toHaveJSProperty('complete', true);
            const width = await postDetailPage.postContentImg.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
            expect(width).toBeGreaterThan(0);
        }
    });*/

    test('[Community] Image should not be added when user clicks X button or Cancel button', async ({ page }) => {
        await writeFreePage.insertImgBtn.click();
        await writeFreePage.addImgLnkBtn.click();
        await writeFreePage.imgLnkInput.fill(imageData.valid.path);
        await writeFreePage.closeAddImgLnkBtn.click();
        await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();

        await writeFreePage.insertImgBtn.click();
        await writeFreePage.addImgLnkBtn.click();
        await writeFreePage.imgLnkInput.fill(imageData.valid.path);
        await writeFreePage.cancelAddImgLnkBtn.click();
        await expect(page.locator('img[src*="20260622143506588"]')).not.toBeVisible();
    });

    //Invalid titles and contents
    for (const data of postData.invalid) {
        test(`[Community] ${data.name}`, async ({ page }) => {
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
        test(`[Community] ${data.name}`, async ({ page }) => {
            await writeFreePage.closeMainBannerIfPresent();
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

    test('[Community] User can open, edit, remove the link inserted in post content', async ({ page }) => {
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

    //Invalid images
    test('[Community] User cannot upload invalid image', async ({ page }) => {
        await writeFreePage.closeMainBannerIfPresent();
        
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