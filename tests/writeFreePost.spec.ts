import {test, expect} from '@playwright/test';
import {WriteFreePage} from '../pages/WriteFreePage';
import {PostDetailPage} from '../pages/PostDetailPage';
import postData from '../data-test/write-post-data.json';

test.describe('Guest Flow', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    let writeFreePage: WriteFreePage;
    
    test.beforeEach(async ({ page }) => {
        test.setTimeout(30000);
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });
    
    test('[Community] Guest is navigated to Login page when accessing Write Post page', async ({page}) => {
        await expect(page).toHaveURL(/\/login\?callbackUrl=\/community\/create\?boardType=free/);
    });
});

test.describe('Normal User Flow', () => {
    let writeFreePage: WriteFreePage;
    
    test.beforeEach(async ({ page }) => {
        writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
    });
    
    test('[Community] User can go back when clicking Cancel button', async ({page}) => {
        const currentUrl = page.url();
        await writeFreePage.clickCancelBtn();
        await expect(page).not.toHaveURL(currentUrl);
    })

    test('[Community] User can write Free post with valid data', async ({page}) => {

        for (const lnkData of postData.lnkData.valid) {
            await writeFreePage.insertLink(lnkData.text, lnkData.url);
            await page.keyboard.press('Enter');
        }

        await writeFreePage.writePost(postData.valid.title, postData.valid.content);
        await page.keyboard.press('Enter');
        await writeFreePage.insertEmoji();
        await writeFreePage.contentInput.focus();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Home');
        await page.keyboard.press('Shift+End');
        await writeFreePage.clickBoldBtn();
        await writeFreePage.clickWriteBtn();

        const postDetailPage = new PostDetailPage(page);
        await expect(page).toHaveURL(/.*community\/free/, { timeout: 15000 });
        await expect(postDetailPage.postTitle).toHaveText(postData.valid.title);
        await expect(postDetailPage.postContent).toContainText(postData.valid.content);
        await expect(postDetailPage.emojiImg.first()).toBeVisible();
        
        const innerHTML = await postDetailPage.postContent.innerHTML();
        console.log(innerHTML); 
        expect(innerHTML).toContain('<strong>업종별로는 반도체 제조업의 배당금 규모가 5조 6924억 원으로 전체의 15.1%를 차지하며 가장 많았다.</strong>');

        const txtLink = postDetailPage.postContent.getByRole('link', { name: 'Google Search' });
        await expect(txtLink).toBeVisible();
        await expect(txtLink).toHaveAttribute('href', "https://www.google.com");

        const plainLink = postDetailPage.postContent.getByRole('link', { name: 'https://mail.google.com' });
        await expect(plainLink).toBeVisible();
        await expect(plainLink).toHaveAttribute('href', "https://mail.google.com");
    });

    for (const data of postData.invalid) {      
        test(`[Community] ${data.name}`, async ({ page }) => {
            await writeFreePage.writePost(data.title, data.content);
            switch (data.id) {
                case 'spaceTitle':
                    await expect(writeFreePage.writeBtn).toBeDisabled();
                    await writeFreePage.clearTitleInput();
                    await expect(writeFreePage.titleErrorMsg).toBeVisible();
                    break;
                case 'emptyTitle':
                case 'emptyContent':
                    await expect(writeFreePage.writeBtn).toBeDisabled();
                    break;
                default:
                    await expect(writeFreePage.writeBtn).toBeEnabled();
                    await writeFreePage.clickWriteBtn();
                    break;
            }
            if (data.toastMsg) {
                await writeFreePage.verifyToastMsg('error', data.toastMsg);
            }
        });    
    }

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