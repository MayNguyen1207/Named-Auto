import { test, expect } from '@playwright/test';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';
import { UNAUTHENTICATED_EMAIL_STATE, AUTHENTICATED_EMAIL_STATE } from './mypage.setup';

test.describe('[MyInfor] Account Management Password Tests', () => {
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    myInfoPage = new MyInfoPage(page);
  });

  test.describe('Password Change Reminder', () => {
    test.use({ storageState: UNAUTHENTICATED_EMAIL_STATE });

    test('Verify password change reminder dialog is visible after login', async ({ page }) => {
      await page.goto('/mypage/info?');

      await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
      await expect(page.getByText('변경하지 않음')).toBeVisible();
    });
  });

  test.describe('Change password dialog', () => {
    test.use({ storageState: AUTHENTICATED_EMAIL_STATE });

    test.beforeEach(async ({ page }) => {
      await page.goto('/mypage/info?');
      await myInfoPage.openChangePasswordDialog();
    });

    test('Verify change password dialog UI and placeholder behavior', async () => {
      await test.step('Dialog UI elements are visible', async () => {
        await myInfoPage.verifyChangePasswordDialogVisible();
      });

      await test.step('Placeholder text disappears when user types', async () => {
        await myInfoPage.verifyPasswordPlaceholdersDisappearWhenTyping();
      });
    });

    test('Verify password field validation messages', async () => {
      await test.step('Empty new & confirm password show errors', async () => {
        await myInfoPage.fillChangePasswordForm({ currentPass: 'Named@123' });
        await myInfoPage.submitChangePassword();
        await myInfoPage.verifyPasswordValidationMessage('새 비밀번호를 입력해주세요.');
        await myInfoPage.verifyPasswordValidationMessage('새 비밀번호 확인을 입력해 주세요.');
      });

      await test.step('Empty current password shows error', async () => {
        await myInfoPage.fillChangePasswordForm({ newPass: 'Named@1234', confirmPass: 'Named@1234' });
        await myInfoPage.submitChangePassword();
        await myInfoPage.verifyPasswordValidationMessage('현재 비밀번호를 입력해 주세요.');
      });

      await test.step('Mismatched new & confirm password shows error', async () => {
        await myInfoPage.fillChangePasswordForm({ currentPass: 'Named@123', newPass: 'Named@1234', confirmPass: 'Named@123w' });
        await myInfoPage.submitChangePassword();
        await myInfoPage.verifyPasswordValidationMessage('새 비밀번호와 비밀번호 확인이 일치하지 않습니다. 다시 입력해 주세요.');
      });
    });

    test('Verify password length and complexity validation', async () => {
      const cases = [
        { step: 'Too short password (4 chars) shows length error', newPass: 'a1B@', message: '비밀번호는 6~18자여야 합니다.' },
        { step: 'Too long password (21 chars) shows length error', newPass: 'Abc123!Abc123!Abc123!', message: '비밀번호는 6~18자여야 합니다.' },
        { step: 'Missing special char shows complexity error', newPass: 'Abc12345', message: '영문, 숫자, 특수문자를 모두 포함해야 합니다..' },
        { step: 'Missing number shows complexity error', newPass: 'Abcdef!@', message: '영문, 숫자, 특수문자를 모두 포함해야 합니다..' },
        { step: 'Missing letter shows complexity error', newPass: '123456!@', message: '영문, 숫자, 특수문자를 모두 포함해야 합니다..' },
        { step: 'Only numbers shows complexity error', newPass: '12345678', message: '영문, 숫자, 특수문자를 모두 포함해야 합니다..' },
      ];

      for (const { step, newPass, message } of cases) {
        await test.step(step, async () => {
          await myInfoPage.fillChangePasswordForm({ newPass });
          await myInfoPage.submitChangePassword();
          await myInfoPage.verifyPasswordValidationMessage(message);
        });
      }
    });

    test('Verify dialog closes via 취소 button and close icon', async () => {
      await test.step('취소 button closes the dialog', async () => {
        await myInfoPage.cancelChangePassword();
        await myInfoPage.verifyChangePasswordDialogHidden();
      });

      await test.step('Reopen dialog', async () => {
        await myInfoPage.openChangePasswordDialog();
      });

      await test.step('Close icon closes the dialog', async () => {
        await myInfoPage.closeChangePasswordDialog();
        await myInfoPage.verifyChangePasswordDialogHidden();
      });
    });
  });
});
