import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management Today Word Tests', () => {
    let myInfoPage: MyInfoPage;

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
    });

    test.describe('[MyInfo] User without Today Word item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Today Word management and purchase navigation', async ({ page }) => {
            await test.step('Verify Today Word UI elements are visible', async () => {
                await myInfoPage.verifyTodayWordUI(
                    mypageData.todayWord.expectedTexts.changeItemText,
                    mypageData.todayWord.expectedTexts.countText
                );
            });

            await test.step('Click purchase button and verify navigation to market', async () => {
                await myInfoPage.clickTodayWordPurchaseButton();
                await expect(page).toHaveURL(mypageData.todayWord.marketUrl);
            });
        });
    });

    test.describe('[MyInfo] User with Today Word item', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Verify Today Word UI with item', async ({ page }) => {
            await test.step('Verify Today Word UI elements are visible when user has item', async () => {
                await myInfoPage.verifyTodayWordUIWithItem(
                    mypageData.todayWord.expectedTexts.countTextWithItem,
                    mypageData.todayWord.expectedTexts.todayWordValue,
                    mypageData.todayWord.expectedTexts.changeItemText,
                    {
                        heading: mypageData.todayWord.expectedTexts.dialogHeading,
                        notice1: mypageData.todayWord.expectedTexts.dialogNotice1,
                        notice2: mypageData.todayWord.expectedTexts.dialogNotice2,
                        notice3: mypageData.todayWord.expectedTexts.dialogNotice3,
                    }
                );
            });

            await test.step('Verify Today Word dialog input validation messages', async () => {
                for (const scenario of mypageData.todayWord.validations) {
                    await myInfoPage.fillAndVerifyTodayWordValidation(scenario.input, scenario.message);
                }
            });

            await test.step('Verify delete confirmation and cancel flow', async () => {
                await myInfoPage.clickDeleteAndVerifyCancel(
                    mypageData.todayWord.expectedTexts.deleteConfirmMessage
                );
                await myInfoPage.cancelTodayWordDialog(
                    mypageData.todayWord.expectedTexts.countTextWithItem
                );
            });
        });
    });
});

