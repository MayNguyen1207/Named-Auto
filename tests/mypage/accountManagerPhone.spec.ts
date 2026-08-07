import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Account Management Phone Tests', () => {
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    myInfoPage = new MyInfoPage(page);
  });

  test.describe('[MyInfo] Unverified Phone', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-verified-phone-user.json') });

    test.beforeEach(async ({ page }) => {
      await page.goto('/mypage/info?');
    });

    test('Verify unverified phone dialog UI, country code selection, and OTP countdown', async ({ page }) => {
      await test.step('Open unverified phone manager and verify UI', async () => {
        await myInfoPage.unverifyPhoneManagerScreen();
        await myInfoPage.verifyUnverifiedPhoneDialogUI();
      });

      await test.step('Select country code and request OTP', async () => {
        await myInfoPage.selectPhoneCountryCode();
        await myInfoPage.enterUnverifiedPhoneNumberAndRequestOtp(mypageData.unverifiedPhoneValidation.otpCountdownPhoneNumber);
        await myInfoPage.verifyUnverifiedOtpResendCountdownMessage();
      });

      await test.step('Close dialog via cancel button and reopen to check countdown persists', async () => {
        await myInfoPage.closeUnverifiedPhonePopup.click();
        await myInfoPage.unverifyPhoneManagerScreen();
        await myInfoPage.verifyUnverifiedOtpResendCountdownMessage();
      });
    });

    test('Verify OTP resend functionality and countdown', async ({ page }) => {
      await test.step('Open phone change dialog and request OTP', async () => {
        await myInfoPage.unverifyPhoneManagerScreen();
        await myInfoPage.selectPhoneCountryCode();
        await page.clock.install();
        await myInfoPage.mockOtpVerifyPhoneSuccess();
        await myInfoPage.enterUnverifiedPhoneNumberAndRequestOtp(mypageData.unverifiedPhoneValidation.otpCountdownPhoneNumber);
      });

      await test.step('Verify resend button is hidden during countdown', async () => {
        await myInfoPage.verifyResendButtonHidden();
        await myInfoPage.verifyUnverifiedOtpResendCountdownMessage();
      });

      await test.step('Verify resend button appears after 3 minutes', async () => {
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
      });

      await test.step('Verify resend OTP sends a new code', async () => {
        await page.unroute('**/send-code-verify-phone**');
        await myInfoPage.clickResendOtp();
        await myInfoPage.verifyResendOtpSuccess(mypageData.unverifiedPhoneValidation.resendOtpSuccessMessage);
      });
    });

    test('Verify phone OTP validation errors', async ({ page }) => {
      await test.step('Open phone change dialog and request OTP', async () => {
        await myInfoPage.unverifyPhoneManagerScreen();
        await myInfoPage.selectPhoneCountryCode();
        await myInfoPage.enterUnverifiedPhoneNumberAndRequestOtp(mypageData.unverifiedPhoneValidation.otpCountdownPhoneNumber);
      });

      await test.step('Verify empty phone OTP shows required code validation', async () => {
        await myInfoPage.unverifiedPhoneOtpTextbox.fill('1');
        await myInfoPage.unverifiedPhoneOtpTextbox.press('Backspace');
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.unverifiedPhoneValidation.emptyOtpMessage);
      });

      await test.step('Verify less-than-6-digit phone OTP shows length validation', async () => {
        await myInfoPage.enterUnverifiedPhoneOtp(mypageData.unverifiedPhoneValidation.incompleteOtp);
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.unverifiedPhoneValidation.incompleteOtpMessage);
      });

      await test.step('Verify wrong phone OTP shows invalid code error', async () => {
        await myInfoPage.enterUnverifiedPhoneOtp(mypageData.unverifiedPhoneValidation.invalidOtp);
        await myInfoPage.confirmButton.click();
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.unverifiedPhoneValidation.invalidOtpMessage);
      });

      await test.step('Verify expired phone OTP displays 1006 expiration message', async () => {
        await myInfoPage.enterUnverifiedPhoneOtp(mypageData.unverifiedPhoneValidation.expiredOtp);
        await myInfoPage.mockExpiredOtpVerifyPhoneError();
        await myInfoPage.verifyExpiredPhoneVerifyOtpError(mypageData.unverifiedPhoneValidation.expiredOtpMessage);
      });
    });

    test('Verify phone number input behavior and validation', async () => {
      await myInfoPage.unverifyPhoneManagerScreen();

      for (const scenario of mypageData.unverifiedPhoneValidation.scenarios) {
        if (scenario.selectCountryCode) {
          await myInfoPage.selectPhoneCountryCode();
        }
        if (scenario.serverError) {
          await myInfoPage.mockOtpVerifyPhoneError(scenario.message!);
        }
        await myInfoPage.verifyUnverifiedPhoneNumberScenario(scenario.phoneNumber, scenario.message);
      }
    });
  });

  test.describe('[MyInfo] Verified Phone', () => {
    test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/user.json') });

    test.beforeEach(async ({ page }) => {
      await page.goto('/mypage/info?');
    });

    test('Verify phone change dialog UI, country code selection, and OTP countdown cancellation', async ({ page }) => {
      await test.step('Open phone change dialog and verify UI', async () => {
        await myInfoPage.verifiedPhoneManagerScreen();
        await myInfoPage.verifyPhoneChangeDialogUI();
      });

      await test.step('Select country code and request OTP', async () => {
        await myInfoPage.selectPhoneCountryCode();
        await myInfoPage.enterPhoneNumberAndRequestOtp(mypageData.phoneValidation.otpCountdownPhoneNumber);
        await myInfoPage.verifyOtpResendCountdownMessage();
      });

      await test.step('Cancel dialog and reopen to check countdown persists', async () => {
        await myInfoPage.cancelPhoneChangeDialog();
        await myInfoPage.verifiedPhoneManagerScreen();
        await myInfoPage.verifyOtpResendCountdownMessage();
      });

      await test.step('Close dialog via icon and reopen to check countdown persists', async () => {
        await myInfoPage.closeChangePasswordDialog();
        await myInfoPage.verifiedPhoneManagerScreen();
        await myInfoPage.verifyOtpResendCountdownMessage();
      });
    });

    test('Verify OTP resend functionality and countdown', async ({ page }) => {
      await test.step('Open phone change dialog and request OTP', async () => {
        await myInfoPage.openPhoneChangeDialogAndVerifyUI();
        await myInfoPage.selectPhoneCountryCode();
        await page.clock.install();
        await myInfoPage.mockOtpChangePhoneSuccess();
        await myInfoPage.enterPhoneNumberAndRequestOtp(mypageData.phoneValidation.otpCountdownPhoneNumber);
      });

      await test.step('Verify resend button is hidden during countdown', async () => {
        await myInfoPage.verifyResendButtonHidden();
        await myInfoPage.verifyOtpResendCountdownMessage();
      });

      await test.step('Verify resend button appears after 3 minutes', async () => {
        await page.clock.fastForward('03:00');
        await myInfoPage.verifyResendButtonVisible();
      });

      await test.step('Verify resend OTP sends a new code', async () => {
        await page.unroute('**/send-code-change-phone**');
        await myInfoPage.clickResendOtp();
        await myInfoPage.verifyResendOtpSuccess(mypageData.phoneValidation.resendOtpSuccessMessage);
      });
    });

    test('Verify phone OTP validation errors', async ({ page }) => {
      await test.step('Open phone change dialog and request OTP', async () => {
        await myInfoPage.openPhoneChangeDialogAndVerifyUI();
        await myInfoPage.selectPhoneCountryCode();
        await myInfoPage.enterPhoneNumberAndRequestOtp(mypageData.phoneValidation.otpCountdownPhoneNumber);
      });

      await test.step('Verify empty phone OTP shows required code validation', async () => {
        await myInfoPage.typeAndDeletePhoneChangeOtp();
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.phoneValidation.emptyOtpMessage);
      });

      await test.step('Verify less-than-6-digit phone OTP shows length validation', async () => {
        await myInfoPage.enterPhoneChangeOtp(mypageData.phoneValidation.incompleteOtp);
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.phoneValidation.incompleteOtpMessage);
      });

      await test.step('Verify wrong phone OTP shows invalid code error', async () => {
        await myInfoPage.enterPhoneChangeOtp(mypageData.phoneValidation.invalidOtp);
        await myInfoPage.submitPhoneChange();
        await myInfoPage.verifyIncompleteOtpValidation(mypageData.phoneValidation.invalidOtpMessage);
      });

      await test.step('Verify expired phone OTP displays 1006 expiration message', async () => {
        await myInfoPage.enterPhoneChangeOtp(mypageData.phoneValidation.expiredOtp);
        await myInfoPage.mockExpiredOtpChangePhoneError();
        await myInfoPage.verifyExpiredPhoneChangeOtpError(mypageData.phoneValidation.expiredOtpMessage);
      });
    });

    test('Verify phone number input behavior and validation', async () => {
      await myInfoPage.openPhoneChangeDialogAndVerifyUI();

      for (const scenario of mypageData.phoneValidation.scenarios) {
        if (scenario.selectCountryCode) {
          await myInfoPage.selectPhoneCountryCode();
        }
        if (scenario.serverError) {
          await myInfoPage.mockOtpChangePhoneError(scenario.message!);
        }
        await myInfoPage.verifyPhoneNumberScenario(scenario.phoneNumber, scenario.message);
      }
    });
  });
});
