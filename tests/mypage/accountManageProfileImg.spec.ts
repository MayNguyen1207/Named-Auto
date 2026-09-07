import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management Profile Image Tests', () => {
    let myInfoPage: MyInfoPage;

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
    });

    test.describe('[MyInfo] User without Profile Image item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Profile image management UI and purchase navigation', async ({ page }) => {
            const { heading, sizeNotice, contentNotice, changeItemText, countText } =
                mypageData.profileImage.expectedTexts;

            await test.step('Verify profile image UI elements are visible', async () => {
                await myInfoPage.verifyProfileImageUI({ heading, sizeNotice, contentNotice, changeItemText, countText });
            });

            await test.step('Click purchase button and verify navigation to market', async () => {
                await myInfoPage.profileImagePurchaseButton.click();
                await expect(page).toHaveURL(mypageData.profileImage.marketUrl);
            });
        });

        test('Profile image management options', async ({ page }) => {
            const { noItemMessage, deleteConfirmMessage } = mypageData.profileImage.expectedTexts;

            await test.step('Verify profile image management options are visible', async () => {
                await myInfoPage.profileImageEditIcon.click();
                await expect(myInfoPage.ImageUploadOption).toBeVisible();
                await expect(myInfoPage.ImageDeleteOption).toBeVisible();
            });

            await test.step('Click upload option and verify no-item message is shown', async () => {
                await myInfoPage.ImageUploadOption.click();
                await expect(page.getByText(noItemMessage)).toBeVisible();
            });

            await test.step('Click delete option and verify confirmation dialog is shown', async () => {
                await expect(page.getByText(noItemMessage)).toBeHidden();

                const isDeleteOptionVisible = await myInfoPage.ImageDeleteOption.isVisible();
                if (!isDeleteOptionVisible) {
                    await myInfoPage.profileImageEditIcon.click();
                }

                await expect(myInfoPage.ImageDeleteOption).toBeVisible();
                await myInfoPage.ImageDeleteOption.click();

                await expect(page.getByText(deleteConfirmMessage, { exact: true })).toBeVisible();
                await expect(myInfoPage.dialogCancelBtn).toBeVisible();
                await expect(myInfoPage.dialogConfirmBtn).toBeVisible();

                await myInfoPage.dialogCancelBtn.click();
                await expect(myInfoPage.dialog).toBeHidden();
            });
        });
    });

    test.describe('[MyInfo] User with Profile Image item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.describe('Upload Profile Image dialog flow case', () => {
            test.beforeEach(async ({ page }) => {
                await page.goto('/mypage/info?');
                await myInfoPage.profileImageEditIcon.click();
                await myInfoPage.ImageUploadOption.click();
            });

            test('Upload valid profile image and verify crop behavior', async ({ page }) => {
                await test.step('Upload valid img and verify crop UI elements are shown', async () => {
                    await myInfoPage.pfImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/valid-profile-img.jpg'));

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

            test('Upload valid profile GIF and verify crop behavior', async ({ page }) => {
                await test.step('Upload GIF and verify crop image is visible', async () => {
                    await myInfoPage.pfImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/valid-gif-img-profile.gif'));

                    await expect(myInfoPage.cropImage).toBeVisible();
                });

                await test.step('Verify crop GIF src does not contain .gif extension', async () => {
                    const src = await myInfoPage.cropImage.getAttribute('src');
                    expect(src).not.toMatch(/\.gif/i);
                });
            });

            const uploadErrorCases = [
                {
                    name: 'invalid format (video)',
                    file: path.resolve(__dirname, '../../data-test/video-data/valid-video.mp4'),
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
                    await myInfoPage.pfImageFileInput.setInputFiles(file);
                    await expect(page.getByText(mypageData.profileImage.expectedTexts[messageKey])).toBeVisible();
                });
            }
        });

        test('Upload profile image success and verify item count decreases after confirmation', async ({ page }) => {
            await page.goto('/mypage/info?');

            const initialCountText = (await myInfoPage.profileImageCountText.textContent()) ?? '';
            expect(initialCountText).toMatch(/\(보유: \d+개\)/);

            await test.step('Upload profile image and confirm', async () => {
                await myInfoPage.profileImageEditIcon.click();
                await myInfoPage.ImageUploadOption.click();
                await myInfoPage.pfImageFileInput.setInputFiles(path.resolve(__dirname, '../../data-test/image-data/valid-profile-img.jpg'));
                await page.getByRole('button', { name: '예' }).click();
            });

            await test.step('Verify profileImage visible, success message shown, and count changed', async () => {
                await expect(myInfoPage.profileImage).toBeVisible();
                await expect(page.getByText('회원 이미지가 변경되었습니다.')).toBeVisible();

                await expect.poll(
                    async () => await myInfoPage.profileImageCountText.textContent(),
                    { timeout: 10000 }
                ).not.toBe(initialCountText);
            });
        });
    });
});
