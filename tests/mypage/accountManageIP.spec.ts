import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management IP Tests', () => {
    let myInfoPage: MyInfoPage;

    const fillIPFields = async (page: Page, ipParts: string[]) => {
        for (let i = 0; i < 4; i++) {
            await page.getByTestId('input-field').nth(i + 2).fill(ipParts[i]);
        }
    };

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
    });

    test.describe('[MyInfo] User without IP entries', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('지정IP 서비스 UI elements and add dialog', async ({ page }) => {
            await expect(page.getByRole('heading', { name: mypageData.ipService.expectedTexts.heading })).toBeVisible();
            await expect(page.locator('p.text-xs.whitespace-pre-line')).toBeVisible();
            await expect(myInfoPage.addIPButton).toBeVisible();

            await myInfoPage.addIPButton.click();
            await myInfoPage.verifyAddIPDialogUI(mypageData.ipService.expectedTexts, ['210', '245', '49', '54']);
        });

        test('Empty IP validation message is shown', async ({ page }) => {
            await myInfoPage.addIPButton.click();
            await page.getByRole('radio', { name: mypageData.ipService.expectedTexts.manualInput }).click();

            const ipInput = page.getByTestId('input-field').nth(2);
            await ipInput.click();
            await ipInput.fill('1');
            await ipInput.press('Backspace');

            await expect(page.getByText(mypageData.ipService.expectedTexts.emptyIpMessage, { exact: true })).toBeVisible();
        });

        test('Empty IP name validation message is shown', async ({ page }) => {
            await myInfoPage.addIPButton.click();
            await page.getByRole('radio', { name: mypageData.ipService.expectedTexts.manualInput }).click();

            await fillIPFields(page, ['210', '245', '49', '54']);

            await myInfoPage.ipNameTextbox.fill('a');
            await myInfoPage.ipNameTextbox.press('Backspace');

            await expect(page.getByText(mypageData.ipService.expectedTexts.emptyIpNameMessage, { exact: true })).toBeVisible();
        });

        test('Already registered IP validation message is shown', async ({ page }) => {
            await myInfoPage.addIPButton.click();

            await fillIPFields(page, ['210', '245', '49', '54']);
            await myInfoPage.ipNameTextbox.fill('a');
            await myInfoPage.ipDialogSubmitBtn.click();

            await myInfoPage.addIPButton.click();

            await fillIPFields(page, ['210', '245', '49', '54']);
            await myInfoPage.ipNameTextbox.fill('b');
            await myInfoPage.ipDialogSubmitBtn.click();

            await expect(page.getByText(mypageData.ipService.expectedTexts.alreadyRegisteredIpMessage)).toBeVisible();

            await myInfoPage.ipDialogCancelBtn.click();
            await myInfoPage.deleteIPButton.click();
            await expect(page.getByText('210.245.49.54를 삭제하시겠습니까?')).toBeVisible();
            await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
            await expect(page.getByRole('button', { name: '삭제' })).toBeVisible();
            await page.getByRole('button', { name: '삭제' }).click();
            await expect(page.getByText('삭제되었습니다.')).toBeVisible();
        });

        test('Maximum 10 IPs can be registered', async ({ page }) => {
            test.setTimeout(120000);
            // Create 10 IPs
            for (let i = 1; i <= 10; i++) {
                await myInfoPage.addIPButton.click();
                await fillIPFields(page, ['192', '168', '0', i.toString()]);
                await myInfoPage.ipNameTextbox.fill(`ip${i}`);
                await myInfoPage.ipDialogSubmitBtn.click();
                await expect(myInfoPage.ipDialogSubmitBtn).toBeHidden();
            }

            // Try to add 11th IP and verify max limit message
            await myInfoPage.addIPButton.click();
            await fillIPFields(page, ['192', '168', '0', '11']);
            await myInfoPage.ipNameTextbox.fill('ip11');
            await myInfoPage.ipDialogSubmitBtn.click();
            await expect(page.getByText('최대 10개의 아이피 등록이 가능합니다.')).toBeVisible();
            await myInfoPage.ipDialogCancelBtn.click();

            // Delete all 10 IPs
            for (let i = 10; i >= 1; i--) {
                await myInfoPage.deleteIPButton.first().click();
                await page.getByRole('button', { name: '삭제' }).click();
                await expect(myInfoPage.deleteIPButton).toHaveCount(i - 1);
            }
        });
    });

    test.describe('[MyInfo] User with IP entries', () => {
        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.beforeEach(async ({ page }) => {
            await page.goto('/mypage/info?');
        });

        test('Redirect to phone verification when adding IP as a non-phone user', async ({ page }) => {
            await myInfoPage.addIPButton.click();
            await page.getByRole('button', { name: '본인 인증' }).click();
            await expect(page).toHaveURL(/.*openVerifyPhone=1&verifyPhoneCallbackUrl=%2Fmypage%2Finfo/);
        });
    });
});
