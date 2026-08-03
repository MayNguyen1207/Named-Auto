import { Locator, Page, expect } from '@playwright/test';

export class MyInfoPage {
    readonly page: Page;

    // OTP section
    readonly otpInput: Locator;
    readonly otpSendButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;

    // Password section
    readonly passwordChangedHeading: Locator;
    readonly changePasswordButton: Locator;
    readonly changePasswordDialog: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmNewPasswordInput: Locator;
    readonly submitChangePasswordButton: Locator;
    readonly cancelChangePasswordButton: Locator;
    readonly changePasswordCloseIcon: Locator;

    // Reward section
    readonly rewardCloseIcon: Locator;

    // Email verification - Unverified
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
    readonly newEmailInput: Locator;

    // OTP resend section
    readonly resendOtpText: Locator;
    readonly resendOtpButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.otpInput = page.getByTestId('input-otp-root');
        this.otpSendButton = page.getByRole('button', { name: 'OTP 받기' });
        this.cancelButton = page.getByRole('button', { name: '취소' });
        this.confirmButton = page.getByRole('button', { name: '인증 완료' });

        this.passwordChangedHeading = page.getByRole('heading', { name: '변경됨' });
        this.changePasswordButton = page.getByTestId('dialog-trigger').nth(1);
        this.changePasswordDialog = page.getByRole('dialog');
        this.currentPasswordInput = page.getByLabel('현재 비밀번호');
        this.newPasswordInput = page.getByLabel('새 비밀번호', { exact: true });
        this.confirmNewPasswordInput = page.getByLabel('새 비밀번호 확인');
        this.submitChangePasswordButton = page.getByRole('button', { name: '변경하기' });
        this.cancelChangePasswordButton = page.getByRole('button', { name: '취소' });
        this.changePasswordCloseIcon = page.getByTestId('dialog-header').getByRole('img');

        this.rewardCloseIcon = page.locator('.tabler-icon.tabler-icon-x');

        this.emailInput = page.getByRole('textbox', { name: '이메일' });
        this.emailLabel = page.getByLabel('이메일');
        this.unverifiedIcon = page.locator('.tabler-icon.tabler-icon-circle-x-filled > path');
        this.unverifiedBadge = page.locator('span:has-text("미인증 – 지금 인증하기")');
        this.verifyNowLink = page.getByText('미인증 – 지금 인증하기');

        this.verificationDialog = page.getByRole('dialog');
        this.verificationDialogHeading = page.getByRole('heading', { name: '이메일 인증받기' });
        this.verificationEmailLabel = page.locator('label').filter({ hasText: '이메일' }).first();
        this.verificationEmailInput = page.locator('input[name="email"]');
        this.verificationOtpLabel = page.getByLabel('OTP 입력');
        this.verificationCloseIcon = page.getByRole('img');

        this.authenticatedIcon = page.locator('.tabler-icon.tabler-icon-circle-check-filled').first();
        this.authenticatedBadge = page.locator('p').filter({ hasText: '인증 완료' }).first();
        this.changeEmailButton = page.locator('button').filter({ hasText: '변경하기' }).first();
        this.changeEmailDialog = page.getByTestId('dialog-content');
        this.newEmailInput = page.getByRole('textbox', { name: '새 이메일 주소' });

        this.resendOtpText = page.getByText('OTP를 받지 못하셨나요?');
        this.resendOtpButton = page.getByRole('button', { name: '인증번호 재발송' });
    }

    // ============= Private Helpers =============
    private async expectAllVisible(...locators: Locator[]) {
        for (const locator of locators) await expect(locator).toBeVisible();
    }
    private async expectAllHidden(...locators: Locator[]) {
        for (const locator of locators) await expect(locator).toBeHidden();
    }
    private async mockRoute(pattern: string, status: number, body: object) {
        await this.page.route(pattern, (route) =>
            route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
        );
    }
    private async fillInput(locator: Locator, value: string) {
        await locator.click();
        await locator.fill(value);
    }

    // ============= Reward =============
    async verifyRewardElementsVisible(expectedTexts: { title: string; subtitle: string; guideButton: string; progressBar: string }) {
        await this.expectAllVisible(
            this.page.getByText(expectedTexts.title),
            this.page.getByText(expectedTexts.subtitle),
            this.page.getByRole('button', { name: expectedTexts.guideButton }),
            this.page.locator('div').filter({ hasText: expectedTexts.progressBar }).nth(2),
        );
    }
    async verifyCurrentPoints(pointsValue: string) {
        await this.expectAllVisible(
            this.page.locator('div').filter({ hasText: pointsValue }).nth(4),
            this.page.getByText(pointsValue),
        );
    }
    async openRewardGuideDialog(buttonName: string) {
        await this.page.getByRole('button', { name: buttonName }).click();
    }
    async verifyRewardGuideDialogVisible(noticeText: string) {
        await this.expectAllVisible(
            this.page.locator('dl:visible').first(),
            this.page.getByText(noticeText),
        );
    }
    async closeRewardGuideDialog() {
        await this.rewardCloseIcon.click();
    }
    async verifyRewardGuideDialogHidden() {
        await expect(this.page.getByRole('dialog')).toBeHidden();
    }

    // ============= Email Verification (Unverified) =============
    async verifyUnauthenticatedEmailUI(emailAddress: string) {
        await this.expectAllVisible(this.emailInput, this.emailLabel, this.unverifiedIcon, this.unverifiedBadge);
        await expect(this.emailInput).toHaveValue(emailAddress);
    }
    async openVerificationDialog() {
        await this.verifyNowLink.click();
    }
    async verifyVerificationDialogVisible() {
        await expect(this.verificationDialog).toBeVisible();
    }
    async verifyVerificationDialogUI(emailAddress: string) {
        await this.expectAllVisible(
            this.verificationDialogHeading,
            this.verificationEmailLabel,
            this.verificationOtpLabel,
            this.otpInput,
            this.otpSendButton,
            this.cancelButton,
            this.verificationCloseIcon,
        );
        await expect(this.verificationEmailInput).toHaveValue(emailAddress);
    }
    async closeVerificationDialogWithIcon() {
        await expect(this.verificationCloseIcon).toBeVisible();
        await this.verificationCloseIcon.click();
    }
    async verifyVerificationDialogClosedAndEmailUnchanged(emailAddress: string) {
        await expect(this.verificationDialog).toBeHidden();
        await this.verifyUnauthenticatedEmailUI(emailAddress);
    }

    // ============= OTP Request =============
    async requestOtp() {
        await this.otpSendButton.click();
    }
    async cancelVerificationDialog() {
        await this.cancelButton.click();
    }

    // ============= Mock OTP / Error Scenarios =============
    async mockOtpSendError(errorMessage: string) {
        await this.mockRoute('**/send-code-verify-email**', 500, { code: 500, message: errorMessage });
    }
    async mockOtpChangeEmailError(errorCode: number, errorMessage: string) {
        await this.mockRoute('**/send-code-change-email**', 400, { code: errorCode, message: errorMessage });
    }
    async mockOtpChangeEmailSuccess() {
        await this.mockRoute('**/send-code-change-email**', 200, { code: 200, message: 'OK', data: {} });
    }
    async mockExpiredOtpChangeEmailError() {
        await this.mockRoute('**/confirm-change-email**', 400, { code: 1006, message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.' });
    }
    async mockOtpSendSuccess() {
        await this.mockRoute('**/send-code-verify-email**', 200, { code: 200, message: 'OK', data: {} });
    }
    async verifyOtpSendError(expectedErrorMessage: string) {
        await this.otpSendButton.click();
        await expect(this.page.getByText(expectedErrorMessage)).toBeVisible();
        await this.page.unroute('**/send-code-verify-email**');
    }
    async mockOtpEmailError(errorCode: number, errorMessage: string) {
        await this.mockRoute('**/send-code-verify-email**', 400, { code: errorCode, message: errorMessage });
    }
    async verifyOtpEmailErrorDialog(expectedErrorMessage: string) {
        await this.otpSendButton.click();
        await expect(this.page.getByText(expectedErrorMessage, { exact: true })).toBeVisible();
        await this.page.unroute('**/send-code-verify-email**');
    }
    async mockExpiredOtpError() {
        await this.mockRoute('**/confirm-verify-email**', 400, { code: 1006, message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.' });
    }
    async verifyExpiredOtpError(expectedErrorMessage: string) {
        await this.confirmButton.click();
        await expect(this.page.getByText(expectedErrorMessage, { exact: true })).toBeVisible();
        await this.page.unroute('**/confirm-verify-email**');
    }

    // ============= OTP Input =============
    async submitOtp(otpCode: string) {
        await this.otpInput.click();
        await this.otpInput.fill(otpCode);
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
            (r) => r.url().includes('confirm-verify-email') && r.request().method() === 'POST'
        );
        await this.confirmButton.click();
        const responseData = await (await responsePromise).json();
        expect(responseData.code).toBe(expectedErrorCode);
        expect(responseData.message).toBe(expectedErrorMessage);
        await expect(this.page.getByText(responseData.message)).toBeVisible();
    }

    // ============= OTP Resend =============
    async verifyIncompleteOtpValidation(validationErrorMessage: string) {
        await expect(this.page.getByText(validationErrorMessage)).toBeVisible();
    }
    async verifyOtpResendCountdownMessage() {
        await expect(this.page.getByText(/OTP 재전송은 \d+초 후에 가능합니다/)).toBeVisible();
    }
    async verifyResendButtonHidden() {
        await this.expectAllHidden(this.resendOtpText, this.resendOtpButton);
    }
    async verifyResendButtonVisible() {
        await this.expectAllVisible(this.resendOtpText, this.resendOtpButton);
    }
    async clickResendOtp() {
        await this.resendOtpButton.click();
    }
    async verifyResendOtpSuccess(successMessage: string) {
        await expect(this.page.getByText(successMessage, { exact: true })).toBeVisible();
    }

    // ============= Email Verification (Authenticated) =============
    async verifyAuthenticatedEmailUI(emailAddress: string) {
        await expect(this.emailInput).toHaveValue(emailAddress);
        await this.expectAllVisible(this.authenticatedIcon, this.authenticatedBadge, this.changeEmailButton);
    }
    async openChangeEmailDialog() {
        await this.changeEmailButton.click();
    }
    async verifyChangeEmailDialogVisible() {
        await expect(this.changeEmailDialog).toBeVisible();
    }
    async verifyChangeEmailButtonVisible() {
        await expect(this.changeEmailButton).toBeVisible();
    }
    async fillNewEmail(email: string) {
        await this.newEmailInput.click();
        if (email === '') {
            await this.newEmailInput.fill('a');
            await this.newEmailInput.press('Backspace');
        } else {
            await this.newEmailInput.fill(email);
        }
        await this.newEmailInput.press('Tab');
    }
    async clickSubmitChangeEmail() {
        await this.changeEmailDialog.locator('button').filter({ hasText: '변경하기' }).click();
    }
    async verifyNewEmailValidationMessage(message: string, exact: boolean = false) {
        await expect(this.page.getByText(message, { exact })).toBeVisible();
    }
    async verifyChangeEmailDialogClosed() {
        await expect(this.changeEmailDialog).toBeHidden();
    }
    async verifyChangeEmailDialogClosedAndEmailUnchanged(emailAddress: string) {
        await expect(this.changeEmailDialog).toBeHidden();
        await this.verifyAuthenticatedEmailUI(emailAddress);
    }

    // ============= Password Management =============
    async verifyPasswordChangedStatusVisible() {
        await this.expectAllVisible(
            this.passwordChangedHeading,
            this.page.getByText(/변경됨/).last(),
        );
    }
    async openChangePasswordDialog() {
        await this.changePasswordButton.click();
    }
    async verifyChangePasswordDialogVisible() {
        await this.expectAllVisible(
            this.changePasswordDialog,
            this.currentPasswordInput,
            this.newPasswordInput,
            this.confirmNewPasswordInput,
            this.submitChangePasswordButton,
            this.cancelChangePasswordButton,
            this.changePasswordCloseIcon,
        );
    }
    async verifyPasswordPlaceholdersDisappearWhenTyping() {
        for (const input of [this.currentPasswordInput, this.newPasswordInput, this.confirmNewPasswordInput]) {
            await this.fillInput(input, 'a');
            await expect(input).toHaveValue('a');
        }
    }
    async fillChangePasswordForm(options: { currentPass?: string; newPass?: string; confirmPass?: string }) {
        // Clear all fields first to avoid data leaking between steps
        for (const locator of [this.currentPasswordInput, this.newPasswordInput, this.confirmNewPasswordInput]) {
            await locator.clear();
        }
        const fields: [string | undefined, Locator][] = [
            [options.currentPass, this.currentPasswordInput],
            [options.newPass, this.newPasswordInput],
            [options.confirmPass, this.confirmNewPasswordInput],
        ];
        for (const [value, locator] of fields) {
            if (value !== undefined) await this.fillInput(locator, value);
        }
    }
    async submitChangePassword() {
        await this.submitChangePasswordButton.click();
    }
    async cancelChangePassword() {
        await this.cancelChangePasswordButton.click();
    }
    async closeChangePasswordDialog() {
        await this.changePasswordCloseIcon.click();
    }
    async verifyChangePasswordDialogHidden() {
        await expect(this.changePasswordDialog).toBeHidden();
    }
    async verifyPasswordValidationMessage(message: string) {
        await expect(this.page.getByText(message, { exact: true })).toBeVisible();
    }
}
