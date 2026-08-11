import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management Nickname Tests', () => {
    let myInfoPage: MyInfoPage;

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
    });

    test.describe('[MyInfo] User without Nickname item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Nickname management and purchase navigation', async ({ page }) => {
            await test.step('Verify nickname management UI elements are visible', async () => {
                await myInfoPage.verifyNicknameManagementUI(
                    mypageData.nickname.expectedTexts.countText,
                    mypageData.nickname.expectedTexts.changeItemText
                );
            });

            await test.step('Click purchase button and verify navigation to market', async () => {
                await myInfoPage.clickPurchaseButton();
                await expect(page).toHaveURL(mypageData.nickname.marketUrl);
            });
        });
    });

    test.describe('[MyInfo] User with Nickname item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Verify nickname UI with item and compare level icon', async ({ page }) => {
            await test.step('Verify nickname UI elements are visible when user has item', async () => {
                await myInfoPage.verifyNicknameManagementUIWithItem(
                    mypageData.nickname.expectedTexts.countTextWithItem,
                    mypageData.nickname.expectedTexts.changeItemText
                );
            });

            await test.step('Compare level icon src with nickname icon src', async () => {
                await myInfoPage.compareLevelIconWithNicknameIcon();
            });

            await test.step('Open change nickname dialog and verify UI', async () => {
                await myInfoPage.verifyChangeNicknameDialogUI({
                    notice1: mypageData.nickname.expectedTexts.dialogNotice1,
                    notice2: mypageData.nickname.expectedTexts.dialogNotice2,
                    notice3: mypageData.nickname.expectedTexts.dialogNotice3,
                    changeItemText: mypageData.nickname.expectedTexts.changeItemText
                });
            });

            await test.step('Verify nickname validation messages', async () => {
                for (const scenario of mypageData.nickname.validations) {
                    await myInfoPage.fillAndVerifyNicknameValidation(scenario.input, scenario.message);
                }
            });

            await test.step('Verify dialog closes with cancel button', async () => {
                await myInfoPage.cancelChangeNicknameDialog(mypageData.nickname.expectedTexts.countTextWithItem);
            });
        });
    });
});
