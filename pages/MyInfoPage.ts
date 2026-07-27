import { Locator, Page, expect } from '@playwright/test';

export class MyInfoPage {
    // Page
    readonly page: Page;

    // OTP section
    readonly otpInput: Locator;
    readonly otpSendButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;

    // Reward section
    readonly rewardCloseIcon: Locator;

    // Email verification section - Unverified
    readonly emailInput: Locator;
    readonly emailLabel: Locator;
    readonly unverifiedIcon: Locator;
    readonly unverifiedBadge: Locator;
    readonly verifyNowLink: Locator;

    // Email verification dialog
    readonly verificationDialog: Locator;
    readonly verificationDialogHeading: Locator;
    readonly verificationEmailLabel: Locator;
    readonly verificationEmailInput: Locator;
    readonly verificationOtpLabel: Locator;
    readonly verificationCloseIcon: Locator;

    // Email verification - Authenticated
    readonly authenticatedIcon: Locator;
    readonly authenticatedBadge: Locator;
    readonly changeEmailButton: Locator;
    readonly changeEmailDialog: Locator;

    // OTP resend section
    readonly resendOtpText: Locator;
    readonly resendOtpButton: Locator;

    constructor(page: Page) {
      this.page = page;

      // OTP section
      this.otpInput = page.getByTestId('input-otp-root');
      this.otpSendButton = page.getByRole('button', { name: 'OTP 받기' });
      this.cancelButton = page.getByRole('button', { name: '취소' });
      this.confirmButton = page.getByRole('button', { name: '인증 완료' });

      // Reward section
      this.rewardCloseIcon = page.locator('.tabler-icon.tabler-icon-x');

      // Email verification section - Unverified
      this.emailInput = page.getByRole('textbox', { name: '이메일' });
      this.emailLabel = page.getByLabel('이메일');
      this.unverifiedIcon = page.locator('.tabler-icon.tabler-icon-circle-x-filled > path');
      this.unverifiedBadge = page.locator('span:has-text("미인증 – 지금 인증하기")');
      this.verifyNowLink = page.getByText('미인증 – 지금 인증하기');

      // Email verification dialog
      this.verificationDialog = page.getByRole('dialog');
      this.verificationDialogHeading = page.getByRole('heading', { name: '이메일 인증받기' });
      this.verificationEmailLabel = page.locator('label').filter({ hasText: '이메일' }).first();
      this.verificationEmailInput = page.locator('input[name="email"]');
      this.verificationOtpLabel = page.getByLabel('OTP 입력');
      this.verificationCloseIcon = page.getByRole('img');

      // Email verification - Authenticated
      this.authenticatedIcon = page.locator('.tabler-icon.tabler-icon-circle-check-filled > path').first();
      this.authenticatedBadge = page.locator('p').filter({ hasText: '인증 완료' }).first();
      this.changeEmailButton = page.locator('button').filter({ hasText: '변경하기' }).first();
      this.changeEmailDialog = page.getByTestId('dialog-content');

      // OTP resend section
      this.resendOtpText = page.getByText('OTP를 받지 못하셨나요?');
      this.resendOtpButton = page.getByRole('button', { name: '인증번호 재발송' });
    }

    // ============= Private Helper Methods =============
    private async click(locator: Locator) {
        await locator.click();
    }
    private async expectVisible(locator: Locator) {
        await expect(locator).toBeVisible();
    }
    private async expectHidden(locator: Locator) {
        await expect(locator).toBeHidden();
    }
    private async mockRoute(pattern: string, status: number, body: any) {
        await this.page.route(pattern, async (route) => {
            await route.fulfill({
                status: status,
                contentType: 'application/json',
                body: JSON.stringify(body),
            });
        });
    }
    private async unroutePattern(pattern: string) {
        await this.page.unroute(pattern);
    }

    private async fillOtpInput(otpCode: string) {
        await this.otpInput.click();
        await this.otpInput.fill(otpCode);
    }

    // ============= Reward Methods =============
    async verifyRewardElementsVisible(expectedTexts: {
        title: string;
        subtitle: string;
        guideButton: string;
        progressBar: string;
    }) {
        const elementsToCheck = [
            this.page.getByText(expectedTexts.title),
            this.page.getByText(expectedTexts.subtitle),
            this.page.getByRole('button', { name: expectedTexts.guideButton }),
            this.page.locator('div').filter({ hasText: expectedTexts.progressBar }).nth(2),
        ];
        for (const element of elementsToCheck) {
            await this.expectVisible(element);
        }
    }
    async verifyCurrentPoints(pointsValue: string) {
        const pointsElements = [
            this.page.locator('div').filter({ hasText: pointsValue }).nth(4),
            this.page.getByText(pointsValue),
        ];
        for (const element of pointsElements) {
            await this.expectVisible(element);
        }
    }
    async openRewardGuideDialog(buttonName: string) {
        const rewardButton = this.page.getByRole('button', { name: buttonName });
        await this.click(rewardButton);
    }
    async verifyRewardGuideDialogVisible(noticeText: string) {
        const dialogElements = [
            this.page.locator('dl:visible').first(),
            this.page.getByText(noticeText),
        ];
        for (const element of dialogElements) {
            await this.expectVisible(element);
        }
    }
    async closeRewardGuideDialog() {
        await this.click(this.rewardCloseIcon);
    }
    async verifyRewardGuideDialogHidden() {
        await this.expectHidden(this.page.getByRole('dialog'));
    }

    // ============= Email Verification Methods (Unverified) =============
    async verifyUnauthenticatedEmailUI(emailAddress: string) {
        const unauthenticatedEmailElements = [
            this.emailInput,
            this.emailLabel,
            this.unverifiedIcon,
            this.unverifiedBadge,
        ];
        for (const element of unauthenticatedEmailElements) {
            await this.expectVisible(element);
        }
        await expect(this.emailInput).toHaveValue(emailAddress);
    }
    async openVerificationDialog() {
        await this.click(this.verifyNowLink);
    }
    async verifyVerificationDialogVisible() {
        await this.expectVisible(this.verificationDialog);
    }
    async verifyVerificationDialogUI(emailAddress: string) {
        const dialogElements = [
            this.verificationDialogHeading,
            this.verificationEmailLabel,
            this.verificationOtpLabel,
            this.otpInput,
            this.otpSendButton,
            this.cancelButton,
            this.verificationCloseIcon,
        ];
        for (const element of dialogElements) {
            await this.expectVisible(element);
        }

        await expect(this.verificationEmailInput).toHaveValue(emailAddress);
    }

    async closeVerificationDialogWithIcon() {
        await this.expectVisible(this.verificationCloseIcon);
        await this.click(this.verificationCloseIcon);
    }

    async verifyVerificationDialogClosedAndEmailUnchanged(emailAddress: string) {
        await this.expectHidden(this.verificationDialog);
        await this.verifyUnauthenticatedEmailUI(emailAddress);
    }

    // ============= OTP Request Methods =============
    async requestOtp() {
        await this.click(this.otpSendButton);
    }
    async cancelVerificationDialog() {
        await this.click(this.cancelButton);
    }

    // ============= Mock OTP / Error Scenarios =============
    async mockOtpSendError(errorMessage: string) {
        await this.mockRoute('**/send-code-verify-email**', 500, {
            code: 500,
            message: errorMessage,
        });
    }
    async mockOtpSendSuccess() {
        await this.mockRoute('**/send-code-verify-email**', 200, {
            code: 200,
            message: 'OK',
            data: {},
        });
    }
    async verifyOtpSendError(expectedErrorMessage: string) {
        await this.click(this.otpSendButton);
        await this.expectVisible(this.page.getByText(expectedErrorMessage));
        await this.unroutePattern('**/send-code-verify-email**');
    }
    async mockOtpEmailError(errorCode: number, errorMessage: string) {
        await this.mockRoute('**/send-code-verify-email**', 400, {
            code: errorCode,
            message: errorMessage,
        });
    }
    async verifyOtpEmailErrorDialog(expectedErrorMessage: string) {
        await this.click(this.otpSendButton);
        await this.expectVisible(this.page.getByText(expectedErrorMessage, { exact: true }));
        await this.unroutePattern('**/send-code-verify-email**');
    }
    async mockExpiredOtpError() {
        await this.mockRoute('**/confirm-verify-email**', 400, {
            code: 1006,
            message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.',
        });
    }
    async verifyExpiredOtpError(expectedErrorMessage: string) {
        await this.click(this.confirmButton);
        await this.expectVisible(this.page.getByText(expectedErrorMessage, { exact: true }));
        await this.unroutePattern('**/confirm-verify-email**');
    }

    // ============= OTP Input Methods =============
    async submitOtp(otpCode: string) {
        await this.fillOtpInput(otpCode);
    }
    async typeAndDeleteOtp() {
        await this.otpInput.click();
        await this.otpInput.fill('1');
        await this.otpInput.press('Backspace');
    }
    async verifyOtpOnlyAcceptsNumbers(nonNumericInput: string) {
        await this.otpInput.click();
        await this.otpInput.pressSequentially(nonNumericInput);
        await expect(this.otpInput).toHaveValue('');
    }
    async verifyInvalidOtpError(expectedErrorCode: number, expectedErrorMessage: string) {
        const responsePromise = this.page.waitForResponse(
            (response) =>
                response.url().includes('confirm-verify-email') &&
                response.request().method() === 'POST'
        );

        await this.click(this.confirmButton);
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.code).toBe(expectedErrorCode);
        expect(responseData.message).toBe(expectedErrorMessage);
        await this.expectVisible(this.page.getByText(responseData.message));
    }

    // ============= OTP Resend Methods =============
    async verifyIncompleteOtpValidation(validationErrorMessage: string) {
        await this.expectVisible(this.page.getByText(validationErrorMessage));
    }
    async verifyOtpResendCountdownMessage() {
        const countdownMessage = this.page.getByText(/OTP 재전송은 \d+초 후에 가능합니다/);
        await this.expectVisible(countdownMessage);
    }
    async verifyResendButtonHidden() {
        const resendElements = [
            this.resendOtpText,
            this.resendOtpButton,
        ];
        for (const element of resendElements) {
            await this.expectHidden(element);
        }
    }
    async verifyResendButtonVisible() {
        const resendElements = [
            this.resendOtpText,
            this.resendOtpButton,
        ];
        for (const element of resendElements) {
            await this.expectVisible(element);
        }
    }
    async clickResendOtp() {
        await this.click(this.resendOtpButton);
    }
    async verifyResendOtpSuccess(successMessage: string) {
        await this.expectVisible(this.page.getByText(successMessage, { exact: true }));
    }

    // ============= Email Verification Methods (Authenticated) =============
    async verifyAuthenticatedEmailUI(emailAddress: string) {
        await expect(this.emailInput).toHaveValue(emailAddress);
        const verifiedEmailElements = [
            this.authenticatedIcon,
            this.authenticatedBadge,
            this.changeEmailButton,
        ];
        for (const element of verifiedEmailElements) {
            await this.expectVisible(element);
        }
    }

    async openChangeEmailDialog() {
        await this.click(this.changeEmailButton);
    }
    async verifyChangeEmailDialogVisible() {
        await this.expectVisible(this.changeEmailDialog);
    }
}
