import { test, expect, type TestInfo } from '@playwright/test';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';
import mypageData from '../../data-test/mypage-data.json';
import path from 'path';

test.describe('[MyInfor] Account Management Tests', () => {
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    myInfoPage = new MyInfoPage(page);
  });

  test.describe('[MyInfo] Unauthenticated Email User Tests', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });
    let userNotVerifiedEmail: any;

    test.beforeEach(async ({ page }) => {
      userNotVerifiedEmail = loginData.valid;
      await page.goto('/mypage/info?');
    });

    test('Verify reward section is visible for valid account from storage state', async ({ page }) => {
      await myInfoPage.verifyRewardElementsVisible(mypageData.reward.expectedTexts);
      await myInfoPage.verifyCurrentPoints(mypageData.reward.expectedTexts.currentPoints);
      await myInfoPage.openRewardGuideDialog(mypageData.reward.expectedTexts.guideButton);
      await myInfoPage.verifyRewardGuideDialogVisible(mypageData.reward.dialogExpectedTexts.noticeText);
      await myInfoPage.closeRewardGuideDialog();
      await myInfoPage.verifyRewardGuideDialogHidden();
    });

    test('Verify unauthenticated email display and dialog', async ({ page }) => {
      await myInfoPage.verifyUnauthenticatedEmailUI(userNotVerifiedEmail.email);
      await myInfoPage.openVerificationDialog();
      await myInfoPage.verifyVerificationDialogVisible();
      await myInfoPage.verifyVerificationDialogUI(userNotVerifiedEmail.email);
    });

    test.describe('[MyInfo] OTP Error Handling', () => {

      test.beforeEach(async ({ page }) => {
        await myInfoPage.mockOtpSendSuccess();
        await myInfoPage.openVerificationDialog();
      });

      test('Verify invalid OTP shows error from API', async ({ page }) => {
        await page.unroute('**/send-code-verify-email**');
        await myInfoPage.requestOtp();
        await myInfoPage.submitOtp(userNotVerifiedEmail.invalidOtp);
        await myInfoPage.verifyInvalidOtpError(
          userNotVerifiedEmail.expectedErrorCode,
          userNotVerifiedEmail.expectedErrorMessage
        );
      });

      test('Verify incomplete OTP shows frontend validation message', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.submitOtp(userNotVerifiedEmail.incompleteOtp);
        await myInfoPage.verifyIncompleteOtpValidation(userNotVerifiedEmail.incompleteOtpErrorMessage);
      });

      test('Verify system error popup when OTP send API fails (500)', async ({ page }) => {
        await myInfoPage.mockOtpSendError(userNotVerifiedEmail.mockedOtpSendErrorMessage);
        await myInfoPage.verifyOtpSendError(userNotVerifiedEmail.mockedOtpSendErrorMessage);
      });

      test('Verify empty OTP shows frontend validation message', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.typeAndDeleteOtp();
        await myInfoPage.verifyIncompleteOtpValidation(userNotVerifiedEmail.incompleteOtpErrorMessage);
      });

      test('Verify OTP field only accepts numeric input', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.verifyOtpOnlyAcceptsNumbers(userNotVerifiedEmail.nonNumericOtp);
      });

      test('Verify OTP resend rate limit shows countdown message', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.verifyOtpResendCountdownMessageEmail();
      });

      test('Verify OTP resend countdown persists after reopening verification dialog', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.verifyOtpResendCountdownMessageEmail();
        await myInfoPage.dialogCancelBtn.click();
        await myInfoPage.openVerificationDialog();
        await myInfoPage.verifyOtpResendCountdownMessageEmail();
      });

      test('Verify clicking cancel closes verification dialog and keeps email unchanged', async ({ page }) => {
        await myInfoPage.dialogCancelBtn.click();
        await myInfoPage.verifyVerificationDialogClosedAndEmailUnchanged(userNotVerifiedEmail.email);
      });

      test('Verify clicking dialog close icon returns to previous screen and keeps email unchanged', async ({ page }) => {
        await myInfoPage.closeVerificationDialogWithIcon();
        await myInfoPage.verifyVerificationDialogClosedAndEmailUnchanged(userNotVerifiedEmail.email);
      });

      test('Verify expired OTP displays 1006 expiration message', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.mockExpiredOtpError();
        await myInfoPage.submitOtp('123456');
        await myInfoPage.verifyExpiredOtpError(
          '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.'
        );
      });

      test('Verify OTP resend button visibility before and after 3 minutes', async ({ page }) => {
        await page.clock.install();
        await myInfoPage.requestOtp();
        await myInfoPage.verifyResendButtonHidden();
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
        await page.unroute('**/send-code-verify-email**');
      });

      test('Verify error dialog when OTP email send fails (API code 1030)', async ({ page }) => {
        await myInfoPage.mockOtpEmailError(
          userNotVerifiedEmail.mockedEmailSendErrorCode,
          userNotVerifiedEmail.mockedEmailSendErrorMessage
        );
        await myInfoPage.verifyOtpEmailErrorDialog(userNotVerifiedEmail.mockedEmailSendErrorMessage);
      });

      test('Verify resend OTP sends a new code after 3 minutes', async ({ page }) => {
        await page.clock.install();
        await myInfoPage.requestOtp();
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
        await page.unroute('**/send-code-verify-email**');
        await myInfoPage.clickResendOtp();
        await myInfoPage.verifyResendOtpSuccess(userNotVerifiedEmail.otpResendSuccessMessage);
      });
    });
  });

  test.describe('[MyInfo] Authenticated Email User Tests', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/prisoner.json') });
    let userVerifiedEmail: any;

    test.beforeEach(async ({ page }) => {
      userVerifiedEmail = loginData.prisoner;
      await page.goto('/mypage/info?');
    });

    test('Verify authenticated email display and change dialog', async ({ page }) => {
      await myInfoPage.verifyAuthenticatedEmailUI(userVerifiedEmail.email);
      await myInfoPage.openChangeEmailDialog();
      await expect(myInfoPage.changeEmailDialog).toBeVisible();
    });

    test('Verify new email validation messages', async ({ page }) => {
      await myInfoPage.openChangeEmailDialog();
      await expect(myInfoPage.changeEmailDialog).toBeVisible();

      const validationScenarios = [
        { email: '', expectedMsg: userVerifiedEmail.validation.emptyEmailMessage },
        { email: userVerifiedEmail.validation.invalidEmail, expectedMsg: userVerifiedEmail.validation.invalidEmailMessage }
      ];
      for (const { email, expectedMsg } of validationScenarios) {
        await myInfoPage.fillNewEmail(email);
        await myInfoPage.verifyNewEmailValidationMessage(expectedMsg);
      }

      await myInfoPage.fillNewEmail(userVerifiedEmail.email);
      await myInfoPage.requestOtp();
      await myInfoPage.verifyNewEmailValidationMessage(`${userVerifiedEmail.email}${userVerifiedEmail.validation.registeredEmailMessage}`, true);
    });

    test('Verify successful OTP request for new email', async ({ page }) => {
      await myInfoPage.openChangeEmailDialog();
      await expect(myInfoPage.changeEmailDialog).toBeVisible();

      await myInfoPage.fillNewEmail(userVerifiedEmail.validation.newEmail);
      await myInfoPage.mockOtpChangeEmailSuccess();
      await myInfoPage.requestOtp();
      await myInfoPage.verifyNewEmailValidationMessage(userVerifiedEmail.validation.otpSentMessage, true);
      await expect(myInfoPage.changeEmailButton).toBeVisible();
      await myInfoPage.verifyOtpResendCountdownMessage();
    });

    test('Verify OTP email failure shows error', async ({ page }) => {
      await myInfoPage.openChangeEmailDialog();
      await myInfoPage.fillNewEmail(userVerifiedEmail.validation.newEmail);
      await myInfoPage.mockOtpChangeEmailError(
        userVerifiedEmail.validation.mockedOtpSendErrorCode,
        userVerifiedEmail.validation.mockedOtpSendErrorMessage
      );
      await myInfoPage.requestOtp();
      await myInfoPage.verifyNewEmailValidationMessage(userVerifiedEmail.validation.mockedOtpSendErrorMessage);
      await page.unroute('**/send-code-change-email**');
    });

    test.describe('[MyInfo] After OTP Requested for New Email', () => {

      test.beforeEach(async ({ page }) => {
        await myInfoPage.openChangeEmailDialog();
        await myInfoPage.fillNewEmail(userVerifiedEmail.validation.newEmail);
        await myInfoPage.mockOtpChangeEmailSuccess();
        await myInfoPage.requestOtp();
      });

      test('Verify incorrect OTP is rejected', async ({ page }) => {
        await myInfoPage.submitOtp(userVerifiedEmail.validation.invalidOtp);
        await myInfoPage.clickSubmitChangeEmail();
        await myInfoPage.verifyNewEmailValidationMessage(userVerifiedEmail.validation.invalidOtpMessage);
      });

      test('Verify incomplete OTP code (<6) shows error', async ({ page }) => {
        await myInfoPage.submitOtp(userVerifiedEmail.validation.incompleteOtp);
        await myInfoPage.verifyNewEmailValidationMessage(userVerifiedEmail.validation.incompleteOtpMessage, true);
      });

      test('Verify expired OTP displays 1006 expiration message', async ({ page }) => {
        await myInfoPage.mockExpiredOtpChangeEmailError();
        await myInfoPage.submitOtp('123456');
        await myInfoPage.clickSubmitChangeEmail();
        await myInfoPage.verifyNewEmailValidationMessage('인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.');
        await page.unroute('**/confirm-change-email**');
      });

      test('Verify "취소" (Cancel) and "X" button both close the email change dialog without saving', async ({ page }) => {
        await myInfoPage.dialogCancelBtn.click();
        await myInfoPage.verifyChangeEmailDialogClosedAndEmailUnchanged(userVerifiedEmail.email);

        await page.reload();
        await myInfoPage.openChangeEmailDialog();
        await myInfoPage.closeVerificationDialogWithIcon();
        await myInfoPage.verifyChangeEmailDialogClosedAndEmailUnchanged(userVerifiedEmail.email);
      });
    });

    test.describe('[MyInfo] OTP Resend Countdown for Email Change', () => {

      test.beforeEach(async ({ page }) => {
        await page.clock.install();
        await myInfoPage.mockOtpChangeEmailSuccess();
        await myInfoPage.openChangeEmailDialog();
        await myInfoPage.fillNewEmail(userVerifiedEmail.validation.newEmail);
        await myInfoPage.requestOtp();
      });

      test('Verify "Resend OTP" link is hidden during countdown and appears after countdown reaches 00:00', async ({ page }) => {
        await myInfoPage.verifyResendButtonHidden();
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
        await page.unroute('**/send-code-change-email**');
      });

      test('Verify user can request OTP again after countdown and resend link appears', async ({ page }) => {
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
        await page.unroute('**/send-code-change-email**');
        await myInfoPage.clickResendOtp();
        await myInfoPage.verifyResendOtpSuccess(userVerifiedEmail.validation.otpResendSuccessMessage);
      });
    });
  });
});