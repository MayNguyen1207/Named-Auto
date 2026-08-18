import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management Background Image Tests', () => {
    let myInfoPage: MyInfoPage;

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
    });

    test.describe('[MyInfo] User without Background Image item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Background image management UI and purchase navigation', async ({ page }) => {
            await test.step('Verify background image UI elements are visible', async () => {
                await myInfoPage.verifyBgImageUI({
                    heading: mypageData.bgImage.expectedTexts.heading,
                    sizeNotice: mypageData.bgImage.expectedTexts.sizeNotice,
                    contentNotice: mypageData.bgImage.expectedTexts.contentNotice,
                    changeItemText: mypageData.bgImage.expectedTexts.changeItemText,
                    countText: mypageData.bgImage.expectedTexts.countText,
                });
            });

            await test.step('Click purchase button and verify navigation to market', async () => {
                await myInfoPage.bgImagePurchaseButton.click();
                await expect(page).toHaveURL(mypageData.bgImage.marketUrl);
            });
        });
        test('Background image management options', async ({ page }) => {
            await test.step('Verify background image management options are visible', async () => {
                await myInfoPage.bgImageEditIcon.click();
                await expect(myInfoPage.ImageUploadOption).toBeVisible();
                await expect(myInfoPage.ImageDeleteOption).toBeVisible();
            });

            await test.step('Click upload option and verify no-item message is shown', async () => {
                await myInfoPage.ImageUploadOption.click();
                await expect(page.getByText(mypageData.bgImage.expectedTexts.noItemMessage)).toBeVisible();
            });
        });

    });

    test.describe('[MyInfo] User with Background Image item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.describe('Upload Background Image item dialog flow case', () => {
            test.beforeEach(async ({ page }) => {
                await page.goto('/mypage/info?');
                await myInfoPage.bgImageEditIcon.click();
                await myInfoPage.ImageUploadOption.click();
            });

            test('Upload valid background image and verify crop behavior', async ({ page }) => {
                await test.step('Upload valid img and verify crop UI elements are shown', async () => {
                    await myInfoPage.bgImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/bg-valid-img.jpg'));
                    await expect(myInfoPage.cropContainer).toBeVisible();
                    await expect(myInfoPage.cropSliderTrack).toBeVisible();
                    await expect(myInfoPage.cropSliderThumb).toBeVisible();
                    await expect(myInfoPage.cropSliderRange).toBeHidden();
                });

                await test.step('Move cropSliderThumb with keyboard and verify cropImage scale changes', async () => {
                    await myInfoPage.cropSliderThumb.focus();

                    let style = await myInfoPage.cropImage.getAttribute('style');
                    let initialScaleMatch = style?.match(/scale\(([^)]+)\)/);
                    let currentScale = initialScaleMatch ? parseFloat(initialScaleMatch[1]) : 1;

                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.waitForTimeout(200);
                    style = await myInfoPage.cropImage.getAttribute('style');
                    let newScaleMatch = style?.match(/scale\(([^)]+)\)/);
                    let newScale = newScaleMatch ? parseFloat(newScaleMatch[1]) : 1;
                    expect(newScale).toBeGreaterThan(currentScale);

                    currentScale = newScale;

                    await page.keyboard.press('ArrowLeft');
                    await page.keyboard.press('ArrowLeft');
                    await page.waitForTimeout(200);
                    style = await myInfoPage.cropImage.getAttribute('style');
                    newScaleMatch = style?.match(/scale\(([^)]+)\)/);
                    newScale = newScaleMatch ? parseFloat(newScaleMatch[1]) : 1;
                    expect(newScale).toBeLessThan(currentScale);
                });

                await test.step('Click No button and verify dialog is hidden', async () => {
                    await page.getByRole('button', { name: '아니오' }).click();
                    await expect(page.getByRole('dialog')).toBeHidden();
                });
            });

            test('Upload valid background GIF and verify crop behavior', async ({ page }) => {
                await test.step('Upload GIF and verify crop image is visible', async () => {
                    await myInfoPage.bgImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/img-bg-valid.gif'));

                    await expect(myInfoPage.cropImage).toBeVisible();
                });

                await test.step('Verify crop GIF src does not contain .gif extension', async () => {
                    const src = await myInfoPage.cropImage.getAttribute('src');
                    expect(src).not.toMatch(/\.gif/i);
                });

                await test.step('Click delete option and verify confirmation dialog is shown', async () => {
                    await page.getByRole('button', { name: '아니오' }).click();
                    const isDeleteOptionVisible = await myInfoPage.ImageDeleteOption.isVisible();
                    if (!isDeleteOptionVisible) {
                        await myInfoPage.bgImageEditIcon.click();
                    }

                    await expect(myInfoPage.ImageDeleteOption).toBeVisible();
                    await myInfoPage.ImageDeleteOption.click();

                    await expect(page.getByText(mypageData.bgImage.expectedTexts.deleteConfirmMessage, { exact: true })).toBeVisible();
                    await expect(myInfoPage.dialogCancelBtn).toBeVisible();
                    await expect(myInfoPage.dialogConfirmBtn).toBeVisible();

                    await myInfoPage.dialogCancelBtn.click();
                    await expect(myInfoPage.dialog).toBeHidden();
                });
            });

            const uploadErrorCases = [
                {
                    name: 'invalid format',
                    file: path.resolve(__dirname, '../../data-test/image-data/invalid-format-img.tif'),
                    messageKey: 'invalidFormatMessage' as const,
                },
                {
                    name: 'small size image',
                    file: path.resolve(__dirname, '../../data-test/image-data/small-size-100x100.jpg'),
                    messageKey: 'smallSizeMessage' as const,
                },
                {
                    name: 'large size image',
                    file: path.resolve(__dirname, '../../data-test/image-data/toolarge-img.jpg'),
                    messageKey: 'tooLargeMessage' as const,
                },
            ];

            for (const { name, file, messageKey } of uploadErrorCases) {
                test(`Upload ${name} and check error message`, async ({ page }) => {
                    await myInfoPage.bgImageFileInput.setInputFiles(file);
                    await expect(page.getByText(mypageData.bgImage.expectedTexts[messageKey])).toBeVisible();
                });
            }
        });

        test('Upload background image success and verify item count decreases after confirmation', async ({ page }) => {
            await page.goto('/mypage/info?');

            const initialCountText = (await myInfoPage.bgImageCountText.textContent()) ?? '';
            expect(initialCountText).toMatch(/\(보유: \d+개\)/);

            await test.step('Upload background image and confirm', async () => {
                await myInfoPage.bgImageEditIcon.click();
                await myInfoPage.ImageUploadOption.click();
                await myInfoPage.bgImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/bg-valid-img.jpg'));
                await page.getByRole('button', { name: '예' }).click();
            });

            await test.step('Verify bgImage visible, success message shown, and count changed', async () => {
                await expect(myInfoPage.bgImage).toBeVisible();
                await expect(page.getByText('프로필 배경 이미지가 변경되었습니다.')).toBeVisible();

                await expect.poll(
                    async () => await myInfoPage.bgImageCountText.textContent(),
                    { timeout: 3000 }
                ).not.toBe(initialCountText);
            });
        });
    });
});
