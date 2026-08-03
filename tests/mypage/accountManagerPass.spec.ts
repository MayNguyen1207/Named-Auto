import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';

test.describe('[MyInfor] Account Management Password Tests', () => {
  let loginPage: LoginPage;
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    myInfoPage = new MyInfoPage(page);
  });
  test('Verify password change reminder dialog is visible after login', async ({ page }) => {
    const user = loginData.unauthenticatedEmail;
    await page.goto('/login?callbackUrl=/mypage/info?');
    await loginPage.login(user.email, user.password);

    await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
    await expect(page.getByText('변경하지 않음')).toBeVisible();
  });

  test.describe('Change password dialog', () => {
    test.beforeEach(async ({ page }) => {
      const user = loginData.authenticatedEmail;
      await page.goto('/login?callbackUrl=/mypage/info?');
      await loginPage.login(user.email, user.password);
      await myInfoPage.openChangePasswordDialog();
    });

    test('Verify change password dialog UI elements are visible', async () => {
      await myInfoPage.verifyChangePasswordDialogVisible();
    });

    test('Verify placeholder text disappears when user types in each password field', async () => {
      await myInfoPage.verifyPasswordPlaceholdersDisappearWhenTyping();
    });

    test('Verify validation message when current password is empty', async () => {
      await myInfoPage.fillChangePasswordForm({
        newPass: 'Named@1234',
        confirmPass: 'Named@1234',
      });
      await myInfoPage.submitChangePassword();
      await myInfoPage.verifyPasswordValidationMessage('현재 비밀번호를 입력해 주세요.');
    });

    test('Verify validation messages when new password and confirm password are empty', async () => {
      await myInfoPage.fillChangePasswordForm({ currentPass: 'Named@123' });
      await myInfoPage.submitChangePassword();
      await myInfoPage.verifyPasswordValidationMessage('새 비밀번호를 입력해주세요.');
      await myInfoPage.verifyPasswordValidationMessage('새 비밀번호 확인을 입력해 주세요.');
    });

    test('Verify validation message when new password and confirm password do not match', async () => {
      await myInfoPage.fillChangePasswordForm({
        currentPass: 'Named@123',
        newPass: 'Named@1234',
        confirmPass: 'Named@123w',
      });
      await myInfoPage.submitChangePassword();
      await myInfoPage.verifyPasswordValidationMessage('새 비밀번호와 비밀번호 확인이 일치하지 않습니다. 다시 입력해 주세요.');
    });

    const invalidLengthPasswords = [
      { label: 'too short (4 chars)', password: 'a1B@' },
      { label: 'too long (21 chars)', password: 'Abc123!Abc123!Abc123!' },
    ];

    for (const { label, password } of invalidLengthPasswords) {
      test(`Verify password length validation when new password is ${label}`, async () => {
        await myInfoPage.fillChangePasswordForm({ newPass: password });
        await myInfoPage.submitChangePassword();
        await myInfoPage.verifyPasswordValidationMessage('비밀번호는 6~18자여야 합니다.');
      });
    }

    const invalidComplexityPasswords = [
      { label: 'missing special char (Abc12345)', password: 'Abc12345' },
      { label: 'missing number (Abcdef!@)', password: 'Abcdef!@' },
      { label: 'missing letter (123456!@)', password: '123456!@' },
      { label: 'only numbers (12345678)', password: '12345678' },
    ];

    for (const { label, password } of invalidComplexityPasswords) {
      test(`Verify password complexity validation when new password is ${label}`, async () => {
        await myInfoPage.fillChangePasswordForm({ newPass: password });
        await myInfoPage.submitChangePassword();
        await myInfoPage.verifyPasswordValidationMessage('영문, 숫자, 특수문자를 모두 포함해야 합니다..');
      });
    }

    test('Verify dialog is hidden after clicking 취소 button', async () => {
      await myInfoPage.cancelChangePassword();
      await myInfoPage.verifyChangePasswordDialogHidden();
    });

    test('Verify dialog is hidden after clicking close icon', async () => {
      await myInfoPage.closeChangePasswordDialog();
      await myInfoPage.verifyChangePasswordDialogHidden();
    });
  });
});
