import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';

test.describe('[MyInfo] Login History Tests', () => {
    let myInfoPage: MyInfoPage;

    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

    test.beforeEach(async ({ page }) => {
        myInfoPage = new MyInfoPage(page);
        await page.goto('/mypage/info?');
        await myInfoPage.loginHistoryLink.click();
        await expect(myInfoPage.loginHistoryHeading).toBeVisible();
    });

    test('Verify Login History UI elements', async ({ page }) => {
        await expect(myInfoPage.loginHistoryCalendarButton).toBeVisible();
        await expect(myInfoPage.loginHistoryTable).toBeVisible();
        await expect(myInfoPage.loginHistorySelectTrigger).toBeVisible();
        await expect(myInfoPage.loginHistoryChevronLeft).toBeVisible();
        await expect(myInfoPage.loginHistoryChevronRight).toBeVisible();
        await expect(myInfoPage.loginHistoryMorePages).toBeVisible();
        await expect(myInfoPage.loginHistoryLastPageButton).toBeVisible();
        await expect(page.locator('button').filter({ hasText: '1' }).first()).toBeVisible();
        await expect(page.locator('button').filter({ hasText: '2' }).first()).toBeVisible();
    });

    test('Calendar popover opens and closes when clicking outside', async ({ page }) => {
        await myInfoPage.loginHistoryCalendarButton.click();
        await expect(myInfoPage.loginHistoryCalendarPopover).toBeVisible();

        await page.mouse.click(0, 0);
        await expect(myInfoPage.loginHistoryCalendarPopover).toBeHidden();
    });

    test('Close dialog functionality', async () => {
        await myInfoPage.loginHistoryCloseButton.click();
        await expect(myInfoPage.dialog).toBeHidden();
    });

    test('Filter by today date shows matching records', async ({ page }) => {
        await myInfoPage.loginHistoryDateFilterTrigger.click();
        await myInfoPage.loginHistoryTodayButton.click();

        const today = new Date().toLocaleDateString('sv-SE');
        const todayDateRegex = new RegExp(today);

        await expect(page.getByRole('cell', { name: todayDateRegex }).first()).toBeVisible();
    });

    test('First record data remains consistent after clicking refresh button', async ({ page }) => {
        const firstDateCell = page.getByRole('cell', { name: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/ }).first();
        const initialText = await firstDateCell.textContent();
        await page.getByRole('dialog').getByRole('button').nth(1).click();
        const afterText = await page.getByRole('cell', { name: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/ }).first().textContent();
        expect(afterText).toBe(initialText);
    });

    test('Scroll thumb appears when changing items per page to 20', async ({ page }) => {
        await myInfoPage.loginHistorySelectTrigger.click();
        await page.getByRole('option', { name: '20' }).click();
        await expect(myInfoPage.loginHistoryScrollThumb).toBeVisible();

        await expect(page.locator('tbody tr').nth(10)).toBeVisible();

        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBeGreaterThan(10);
    });
});
