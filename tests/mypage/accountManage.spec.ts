import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';

test.describe('[MyInfor] Account Management Tests', () => {
  let loginPage: LoginPage;
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    myInfoPage = new MyInfoPage(page);
  });

  test.describe('[MyInfo] Unauthenticated Email User Tests', () => {
    let userNotVerifiedEmail: any;

    test.beforeEach(async ({ page }) => {
      userNotVerifiedEmail = loginData.unauthenticatedEmail;
      await page.goto('/login?callbackUrl=/mypage/info?');
      await loginPage.login(userNotVerifiedEmail.email, userNotVerifiedEmail.password);
    });

    test('Verify unauthenticated email display and dialog', async ({ page }) => {
      await myInfoPage.verifyUnauthenticatedEmailUI(userNotVerifiedEmail.email);
      await myInfoPage.openVerificationDialog();
      await myInfoPage.verifyVerificationDialogVisible();
      await myInfoPage.verifyVerificationDialogUI(userNotVerifiedEmail.email);
    });

    test.describe('[MyInfo] OTP Error Handling', () => {
      
      test.beforeEach(async ({ page }) => {
        await myInfoPage.openVerificationDialog();
      });

      test('Verify invalid OTP shows error from API', async ({ page }) => {
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
        await myInfoPage.verifyOtpResendCountdownMessage();
      });

      test('Verify OTP resend countdown persists after reopening verification dialog', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.verifyOtpResendCountdownMessage();
        await myInfoPage.cancelVerificationDialog();
        await myInfoPage.openVerificationDialog();
        await myInfoPage.verifyOtpResendCountdownMessage();
      });

      test('Verify clicking cancel closes verification dialog and keeps email unchanged', async ({ page }) => {
        await myInfoPage.requestOtp();
        await myInfoPage.cancelVerificationDialog();
        await myInfoPage.verifyVerificationDialogClosedAndEmailUnchanged(userNotVerifiedEmail.email);
      });

      test('Verify clicking dialog close icon returns to previous screen and keeps email unchanged', async ({ page }) => {
        await myInfoPage.requestOtp();
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
        await myInfoPage.mockOtpSendSuccess();
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
        await myInfoPage.mockOtpSendSuccess();
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
    let userVerifiedEmail: any;

    test.beforeEach(async ({ page }) => {
      userVerifiedEmail = loginData.authenticatedEmail;
      await page.goto('/login?callbackUrl=/mypage/info?');
      await loginPage.login(userVerifiedEmail.email, userVerifiedEmail.password);
    });

    test('Verify authenticated email display and change dialog', async ({ page }) => {
      await myInfoPage.verifyAuthenticatedEmailUI(userVerifiedEmail.email);
      await myInfoPage.openChangeEmailDialog();
      await myInfoPage.verifyChangeEmailDialogVisible();
    });
  });
});