import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';

const formatDate = (date: Date): string => date.toLocaleDateString('sv-SE');

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

        const todayStr = formatDate(new Date());
        await expect(page.getByRole('cell', { name: new RegExp(todayStr) }).first()).toBeVisible();
    });

    test('First record data remains consistent after clicking refresh button', async ({ page }) => {
        const datePattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
        const firstDateCell = page.getByRole('cell', { name: datePattern }).first();

        const initialText = await firstDateCell.textContent();
        await page.getByRole('dialog').getByRole('button').nth(1).click();

        await expect(firstDateCell).toHaveText(initialText ?? '');
    });

    test('Scroll thumb appears when changing items per page to 20', async ({ page }) => {
        await myInfoPage.loginHistorySelectTrigger.click();
        await page.getByRole('option', { name: '20' }).click();
        await expect(myInfoPage.loginHistoryScrollThumb).toBeVisible();

        await expect(page.locator('tbody tr').nth(10)).toBeVisible();

        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBeGreaterThan(10);
    });

    test('Check if the < and > properly navigate to the previous and next month', async ({ page }) => {
        await myInfoPage.loginHistoryCalendarButton.click();
        await expect(myInfoPage.loginHistoryCalendarPopover).toBeVisible();

        const currentMonthLocator = page.getByTestId('calendar-current-month');
        const initialMonthText = await currentMonthLocator.textContent();

        // Navigate to previous month
        await page.getByTestId('calendar-previous-month').click();
        const prevMonthText = await currentMonthLocator.textContent();
        expect(prevMonthText).not.toBe(initialMonthText);

        // Navigate to next month
        await page.getByTestId('calendar-next-month').click();
        const nextMonthText = await currentMonthLocator.textContent();
        expect(nextMonthText).not.toBe(prevMonthText);
    });

    test('Check calendar date ranges for 1 week, 1 month, and 3 months', async ({ page }) => {
        const today = new Date();
        const todayStr = formatDate(today);

        await myInfoPage.loginHistoryDateFilterTrigger.click();

        // 1 week = last 7 days (today - 6)
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 6);
        await page.getByRole('button', { name: '주일' }).click();
        await expect(page.getByText(`${formatDate(oneWeekAgo)} - ${todayStr}`)).toBeVisible();

        // 1 month = last 30 days (today - 29)
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setDate(today.getDate() - 29);
        await page.getByRole('button', { name: '1개월' }).click();
        await expect(page.getByText(`${formatDate(oneMonthAgo)} - ${todayStr}`)).toBeVisible();

        // 3 months = dynamic start date
        await page.getByRole('button', { name: '3개월' }).click();
        await expect(page.getByText(new RegExp(`\\d{4}-\\d{2}-\\d{2} - ${todayStr}`))).toBeVisible();
    });

});
