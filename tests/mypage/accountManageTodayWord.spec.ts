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
                await myInfoPage.todayWordPurchaseButton.click();
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
                await expect(myInfoPage.todayWordInput).toBeVisible();
                await expect(myInfoPage.todayWordPurchaseLink).toBeVisible();
                await expect(myInfoPage.todayWordChangeButton).toBeVisible();
                await expect(page.getByRole('img', { name: '오늘의 한마디' })).toBeVisible();
                await myInfoPage.openTodayWordChangeDialog(
                    mypageData.todayWord.expectedTexts.countTextWithItem,
                    mypageData.todayWord.expectedTexts.todayWordValue,
                    mypageData.todayWord.expectedTexts.changeItemText
                );
                await expect(page.getByRole('heading', { name: mypageData.todayWord.expectedTexts.dialogHeading })).toBeVisible();
                await expect(myInfoPage.todayWordDialogInput).toBeVisible();
                await expect(myInfoPage.todayWordDialogInput).toHaveValue(mypageData.todayWord.expectedTexts.todayWordValue);
                await expect(myInfoPage.todayWordDialogLabel).toBeVisible();
                await expect(page.getByText(mypageData.todayWord.expectedTexts.dialogNotice1, { exact: true })).toBeVisible();
                await expect(page.getByText(mypageData.todayWord.expectedTexts.dialogNotice2, { exact: true })).toBeVisible();
                await expect(page.getByText(mypageData.todayWord.expectedTexts.dialogNotice3, { exact: true })).toBeVisible();
                await expect(myInfoPage.todayWordDialogCancelButton).toBeVisible();
                await expect(myInfoPage.todayWordDialogDeleteButton).toBeVisible();
                await expect(myInfoPage.todayWordDialogSubmitButton).toBeVisible();
                await expect(myInfoPage.todayWordDialogCloseIcon).toBeVisible();
            });

            await test.step('Verify Today Word dialog input validation messages', async () => {
                for (const scenario of mypageData.todayWord.validations) {
                    await myInfoPage.fillTodayWordInput(scenario.input);
                    await expect(page.locator('p').filter({ hasText: scenario.message })).toBeVisible();
                }
            });

            await test.step('Verify delete confirmation and cancel flow', async () => {
                await myInfoPage.todayWordDialogDeleteButton.click();
                await expect(page.getByText(mypageData.todayWord.expectedTexts.deleteConfirmMessage, { exact: true })).toBeVisible();
                await myInfoPage.dialogCancelBtn.click();
                await expect(page.getByTestId('dialog-content')).toBeVisible();
                await myInfoPage.todayWordDialogCancelButton.click();
                await expect(page.locator('span').filter({ hasText: mypageData.todayWord.expectedTexts.countTextWithItem }).first()).toBeVisible();
            });
        });
    });
});

