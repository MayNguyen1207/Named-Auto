import { test, expect } from '@playwright/test';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';
import path from 'path';

test.describe('[MyInfor] Account Management Password Tests', () => {
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    myInfoPage = new MyInfoPage(page);
  });

  test.describe('Password Change Reminder', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

    test.beforeEach(async ({ page }) => {
      await page.goto('/mypage/info?');
    });

    test('Verify password change reminder dialog is visible after login', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
      await expect(page.getByText('변경하지 않음')).toBeVisible();
    });
  });

  test.describe('Change password dialog', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/prisoner.json') });

    test.beforeEach(async ({ page }) => {
      await page.goto('/mypage/info?');
      await myInfoPage.changePasswordButton.click();
    });

    test('Verify change password dialog UI and placeholder behavior', async ({ page }) => {
      await test.step('Dialog UI elements are visible', async () => {
        await myInfoPage.verifyChangePasswordDialogVisible();
      });

      await test.step('Placeholder text disappears when user types', async () => {
        await myInfoPage.verifyPasswordPlaceholdersDisappearWhenTyping();
      });
    });

    test('Verify password field validation messages', async ({ page }) => {
      for (const { step, currentPass, newPass, confirmPass, messages } of mypageData.passwordValidation.fieldValidation) {
        await test.step(step, async () => {
          await myInfoPage.fillChangePasswordForm({
            currentPass: currentPass ?? undefined,
            newPass: newPass ?? undefined,
            confirmPass: confirmPass ?? undefined,
          });
          await myInfoPage.submitChangePasswordButton.click();
          for (const message of messages) {
            await expect(page.getByText(message, { exact: true })).toBeVisible();

          }
        });
      }
    });

    test('Verify password length and complexity validation', async ({ page }) => {
      for (const { step, newPass, message } of mypageData.passwordValidation.lengthComplexity) {
        await test.step(step, async () => {
          await myInfoPage.fillChangePasswordForm({ newPass });
          await myInfoPage.submitChangePasswordButton.click();
          await expect(page.getByText(message, { exact: true })).toBeVisible();
        });
      }
    });

    test('Verify dialog closes via 취소 button and close icon', async () => {
      await test.step('취소 button closes the dialog', async () => {
        await myInfoPage.dialogCancelBtn.click();;
        await expect(myInfoPage.dialog).toBeHidden();
      });

      await test.step('Reopen dialog', async () => {
        await myInfoPage.changePasswordButton.click();
      });

      await test.step('Close icon closes the dialog', async () => {
        await myInfoPage.changePasswordCloseIcon.click();;
        await expect(myInfoPage.dialog).toBeHidden();;
      });
    });
  });
});
