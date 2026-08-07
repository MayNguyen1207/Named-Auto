import { Locator, Page, expect } from '@playwright/test';

export class MyInfoPage {
    readonly page: Page;

    // Common
    readonly otpInput: Locator;
    readonly otpSendButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;
    readonly rewardCloseIcon: Locator;

    // OTP Resend 
    readonly resendOtpText: Locator;
    readonly resendOtpButton: Locator;
    readonly otpResendCountdownText: Locator;

    //  Email – Unverified 
    readonly emailInput: Locator;
    readonly emailLabel: Locator;
    readonly unverifiedIcon: Locator;
    readonly unverifiedBadge: Locator;
    readonly verifyNowLink: Locator;
    readonly verificationDialog: Locator;
    readonly verificationDialogHeading: Locator;
    readonly verificationEmailLabel: Locator;
    readonly verificationEmailInput: Locator;
    readonly verificationOtpLabel: Locator;
    readonly verificationCloseIcon: Locator;

    // Email – Authenticated
    readonly authenticatedIcon: Locator;
    readonly authenticatedBadge: Locator;
    readonly changeEmailButton: Locator;
    readonly changeEmailDialog: Locator;
    readonly newEmailInput: Locator;

    // Phone – Unverified 
    readonly unverifiedPhoneIcon: Locator;
    readonly unverifiedPhoneButton: Locator;
    readonly unverifiedPhoneInput: Locator;
    readonly unverifiedPhoneDialog: Locator;
    readonly closeUnverifiedPhonePopup: Locator;
    readonly unverifiedPhoneDialogHeading: Locator;
    readonly unverifiedPhonePlaceholderInput: Locator;
    readonly unverifiedPhoneCountryIcon: Locator;
    readonly unverifiedPhoneCountryCodeButton: Locator;
    readonly unverifiedPhoneOtpLabel: Locator;
    readonly unverifiedPhoneOtpTextbox: Locator;
    readonly unverifiedPhoneCancelButton: Locator;
    readonly unverifiedPhoneOtpSendButton: Locator;

    // Phone – Verified / Change 
    readonly verifiedPhoneIcon: Locator;
    readonly verifiedPhoneInput: Locator;
    readonly changePhoneButton: Locator;
    readonly changePhoneDialog: Locator;
    readonly phoneChangeDialogHeading: Locator;
    readonly phoneChangePhoneNumberLabel: Locator;
    readonly phoneChangeCountryCodeButton: Locator;
    readonly phoneChangePhoneInput: Locator;
    readonly phoneChangeOtpLabel: Locator;
    readonly phoneChangeOtpInput: Locator;
    readonly phoneChangeCancelButton: Locator;
    readonly phoneChangeOtpSendButton: Locator;
    readonly phoneCountryCodeCommandRoot: Locator;
    readonly phoneCountryCodeCommandInput: Locator;
    readonly phoneCountryCodeOption: Locator;
    readonly phoneSelectedCountryButton: Locator;

    // Password 
    readonly passwordChangedHeading: Locator;
    readonly changePasswordButton: Locator;
    readonly changePasswordDialog: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmNewPasswordInput: Locator;
    readonly submitChangePasswordButton: Locator;
    readonly cancelChangePasswordButton: Locator;
    readonly changePasswordCloseIcon: Locator;

    constructor(page: Page) {
        this.page = page;

        // Common
        this.otpInput = page.getByTestId('input-otp-root');
        this.otpSendButton = page.getByRole('button', { name: 'OTP 받기' });
        this.cancelButton = page.getByRole('button', { name: '취소' });
        this.confirmButton = page.getByRole('button', { name: '인증 완료' });
        this.rewardCloseIcon = page.locator('.tabler-icon.tabler-icon-x');

        // OTP Resend
        this.resendOtpText = page.getByText('OTP를 받지 못하셨나요?');
        this.resendOtpButton = page.getByRole('button', { name: '인증번호 재발송' });
        this.otpResendCountdownText = page.getByText(/OTP 재전송은 \d+초 후에 가능합니다/);

        // Email – Unverified
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

        // Email – Authenticated
        this.authenticatedIcon = page.locator('.tabler-icon.tabler-icon-circle-check-filled').first();
        this.authenticatedBadge = page.locator('p').filter({ hasText: '인증 완료' }).first();
        this.changeEmailButton = page.locator('button').filter({ hasText: '변경하기' }).first();
        this.changeEmailDialog = page.getByTestId('dialog-content');
        this.newEmailInput = page.getByRole('textbox', { name: '새 이메일 주소' });

        // Phone – Unverified
        this.unverifiedPhoneIcon = page.locator('.absolute.right-3 svg.tabler-icon-circle-x-filled').nth(1);
        this.unverifiedPhoneButton = page.getByRole('button', { name: '미인증 – 지금 인증하기' });
        this.unverifiedPhoneInput = page.getByRole('textbox', { name: '핸드폰 번호' });
        this.unverifiedPhoneDialog = page.getByRole('dialog');
        this.closeUnverifiedPhonePopup = page.getByRole('button', { name: '취소' });
        this.unverifiedPhoneDialogHeading = page.getByRole('heading', { name: '핸드폰 인증받기' });
        this.unverifiedPhonePlaceholderInput = page.getByPlaceholder('핸드폰 번호 입력');
        this.unverifiedPhoneCountryIcon = page.locator('svg').filter({ hasText: 'KR' }).first();
        this.unverifiedPhoneCountryCodeButton = page.getByTestId('dialog-content').getByTestId('popover-trigger');
        this.unverifiedPhoneOtpLabel = page.getByLabel('OTP 입력');
        this.unverifiedPhoneOtpTextbox = page.getByRole('textbox', { name: 'OTP 입력' });
        this.unverifiedPhoneCancelButton = page.getByRole('button', { name: '취소' });
        this.unverifiedPhoneOtpSendButton = page.getByRole('button', { name: 'OTP 받기' });

        // Phone – Verified / Change
        this.verifiedPhoneIcon = page.locator('.absolute.right-3 svg.tabler-icon-circle-check-filled');
        this.changePhoneButton = page.getByRole('button', { name: '변경하기' }).nth(1);
        this.changePhoneDialog = page.getByTestId('dialog-content');
        this.verifiedPhoneInput = page.getByRole('textbox', { name: '핸드폰 번호' });
        this.phoneChangeDialogHeading = page.getByRole('heading', { name: '핸드폰 번호 변경하기' });
        this.phoneChangePhoneNumberLabel = page.locator('label').filter({ hasText: '핸드폰 번호' }).first();
        this.phoneChangeCountryCodeButton = page.getByTestId('dialog-content').getByTestId('popover-trigger');
        this.phoneChangePhoneInput = page.getByPlaceholder('핸드폰 번호 입력');
        this.phoneChangeOtpLabel = page.getByLabel('OTP 입력');
        this.phoneChangeOtpInput = page.getByTestId('input-otp-root');
        this.phoneChangeCancelButton = page.getByRole('button', { name: '취소' });
        this.phoneChangeOtpSendButton = page.getByRole('button', { name: 'OTP 받기' });
        this.phoneCountryCodeCommandRoot = page.getByTestId('command-root');
        this.phoneCountryCodeCommandInput = page.getByTestId('command-input');
        this.phoneCountryCodeOption = page.getByText('미국').nth(1);
        this.phoneSelectedCountryButton = page.locator('button:has-text("+1")');

        // Password
        this.passwordChangedHeading = page.getByRole('heading', { name: '변경됨' });
        this.changePasswordButton = page.getByTestId('dialog-trigger').nth(1);
        this.changePasswordDialog = page.getByRole('dialog');
        this.currentPasswordInput = page.getByLabel('현재 비밀번호');
        this.newPasswordInput = page.getByLabel('새 비밀번호', { exact: true });
        this.confirmNewPasswordInput = page.getByLabel('새 비밀번호 확인');
        this.submitChangePasswordButton = page.getByRole('button', { name: '변경하기' });
        this.cancelChangePasswordButton = page.getByRole('button', { name: '취소' });
        this.changePasswordCloseIcon = page.getByTestId('dialog-header').getByRole('img');
    }

    // Private Helpers 
    private async expectAllVisible(...locators: Locator[]) {
        for (const l of locators) await expect(l).toBeVisible();
    }
    private async expectAllHidden(...locators: Locator[]) {
        for (const l of locators) await expect(l).toBeHidden();
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
    private async verifyPhoneScenario(phoneInput: Locator, sendBtn: Locator, phoneNumber: string, message?: string) {
        await phoneInput.fill(phoneNumber);
        if (message) {
            await sendBtn.click();
            await expect(this.page.getByText(message, { exact: true })).toBeVisible();
        } else {
            await expect(phoneInput).toHaveValue(phoneNumber);
        }
    }
    private async mockPhoneRoute(endpoint: string, success: boolean, errorMessage?: string) {
        if (success) {
            await this.mockRoute(`**/${endpoint}**`, 200, { code: 200, message: 'OK', data: {} });
        } else {
            await this.mockRoute(`**/${endpoint}**`, 500, { code: 500, message: errorMessage ?? '' });
        }
    }
    private async mockExpiredRoute(endpoint: string) {
        await this.mockRoute(`**/${endpoint}**`, 400, { code: 1006, message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.' });
    }
    private async verifyExpiredOtpResponse(endpoint: string, submitAction: () => Promise<void>, expectedErrorMessage: string) {
        const responsePromise = this.page.waitForResponse(
            (r) => r.url().includes(endpoint) && r.request().method() === 'POST'
        );
        await submitAction();
        const responseData = await (await responsePromise).json();
        expect(responseData.code).toBe(1006);
        expect(responseData.message).toBe(expectedErrorMessage);
        await expect(this.page.getByText(responseData.message, { exact: true })).toBeVisible();
        await this.page.unroute(`**/${endpoint}**`);
    }

    // Reward 
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
    async openRewardGuideDialog(buttonName: string) { await this.page.getByRole('button', { name: buttonName }).click(); }
    async verifyRewardGuideDialogVisible(noticeText: string) {
        await this.expectAllVisible(this.page.locator('dl:visible').first(), this.page.getByText(noticeText));
    }
    async closeRewardGuideDialog() { await this.rewardCloseIcon.click(); }
    async verifyRewardGuideDialogHidden() { await expect(this.page.getByRole('dialog')).toBeHidden(); }

    // Email – Unverified
    async verifyUnauthenticatedEmailUI(emailAddress: string) {
        await this.expectAllVisible(this.emailInput, this.emailLabel, this.unverifiedIcon, this.unverifiedBadge);
        await expect(this.emailInput).toHaveValue(emailAddress);
    }
    async openVerificationDialog() { await this.verifyNowLink.click(); }
    async verifyVerificationDialogVisible() { await expect(this.verificationDialog).toBeVisible(); }
    async verifyVerificationDialogUI(emailAddress: string) {
        await this.expectAllVisible(
            this.verificationDialogHeading, this.verificationEmailLabel, this.verificationOtpLabel,
            this.otpInput, this.otpSendButton, this.cancelButton, this.verificationCloseIcon,
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

    // Phone – Unverified
    async unverifyPhoneManagerScreen() {
        await this.expectAllVisible(this.unverifiedPhoneIcon, this.unverifiedPhoneButton);
        await expect(this.unverifiedPhoneInput).toBeDisabled();
        await this.unverifiedPhoneButton.click();
        await expect(this.unverifiedPhoneDialog).toBeVisible();
    }
    async verifyUnverifiedPhoneDialogUI() {
        await this.expectAllVisible(
            this.unverifiedPhoneDialogHeading, this.unverifiedPhonePlaceholderInput,
            this.unverifiedPhoneCountryIcon, this.unverifiedPhoneCountryCodeButton,
            this.unverifiedPhoneOtpLabel, this.unverifiedPhoneOtpTextbox,
            this.unverifiedPhoneCancelButton, this.unverifiedPhoneOtpSendButton,
        );
    }
    async enterUnverifiedPhoneNumberAndRequestOtp(phoneNumber: string) {
        await this.unverifiedPhonePlaceholderInput.fill(phoneNumber);
        await this.unverifiedPhoneOtpSendButton.click();
    }
    async enterUnverifiedPhoneOtp(otpCode: string) { await this.unverifiedPhoneOtpTextbox.fill(otpCode); }
    async verifyUnverifiedOtpResendCountdownMessage() {
        await this.expectAllVisible(this.confirmButton, this.otpResendCountdownText);
    }
    async verifyUnverifiedPhoneNumberScenario(phoneNumber: string, message?: string) {
        await this.verifyPhoneScenario(this.unverifiedPhonePlaceholderInput, this.unverifiedPhoneOtpSendButton, phoneNumber, message);
    }

    // Phone – Verified / Change 
    async verifiedPhoneManagerScreen() {
        await this.expectAllVisible(this.verifiedPhoneIcon, this.changePhoneButton);
        await expect(this.verifiedPhoneInput).toBeDisabled();
        await this.changePhoneButton.click();
        await expect(this.changePhoneDialog).toBeVisible();
    }
    async verifyPhoneChangeDialogUI() {
        await this.expectAllVisible(
            this.phoneChangeDialogHeading, this.phoneChangePhoneNumberLabel,
            this.phoneChangeCountryCodeButton, this.phoneChangePhoneInput,
            this.phoneChangeOtpLabel, this.phoneChangeOtpInput,
            this.phoneChangeCancelButton, this.phoneChangeOtpSendButton,
        );
    }
    async selectPhoneCountryCode() {
        await this.phoneChangeCountryCodeButton.click();
        await expect(this.phoneCountryCodeCommandRoot).toBeVisible();
        await this.phoneCountryCodeCommandInput.fill('+1');
        await this.phoneCountryCodeOption.click();
        await expect(this.phoneSelectedCountryButton).toBeVisible();
    }
    async openPhoneChangeDialogAndVerifyUI() {
        await this.verifiedPhoneManagerScreen();
        await this.verifyPhoneChangeDialogUI();
    }
    async cancelPhoneChangeDialog() { await this.phoneChangeCancelButton.click(); }
    async enterPhoneNumberAndRequestOtp(phoneNumber: string) {
        await this.phoneChangePhoneInput.fill(phoneNumber);
        await this.phoneChangeOtpSendButton.click();
    }
    async enterPhoneChangeOtp(otpCode: string) { await this.phoneChangeOtpInput.fill(otpCode); }
    async submitPhoneChange() {
        await this.changePhoneDialog.getByRole('button', { name: '변경하기' }).first().click();
    }
    async verifyPhoneNumberScenario(phoneNumber: string, message?: string) {
        await this.verifyPhoneScenario(this.phoneChangePhoneInput, this.phoneChangeOtpSendButton, phoneNumber, message);
    }

    // OTP Actions
    async requestOtp() { await this.otpSendButton.click(); }
    async cancelVerificationDialog() { await this.cancelButton.click(); }
    async submitOtp(otpCode: string) {
        await this.otpInput.click();
        await this.otpInput.fill(otpCode);
    }
    async typeAndDeleteOtp() {
        await this.otpInput.click();
        await this.otpInput.fill('1');
        await this.otpInput.press('Backspace');
    }
    async typeAndDeletePhoneChangeOtp() {
        await this.phoneChangeOtpInput.click();
        await this.phoneChangeOtpInput.fill('135674');
        await this.phoneChangeOtpInput.press('Control+A');
        await this.phoneChangeOtpInput.press('Backspace');
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

    // OTP Resend
    async verifyIncompleteOtpValidation(validationErrorMessage: string) {
        await expect(this.page.getByText(validationErrorMessage)).toBeVisible();
    }
    async verifyOtpResendCountdownMessage() {
        await expect(this.page.locator('button').filter({ hasText: '변경하기' }).nth(2)).toBeVisible();
        await expect(this.otpResendCountdownText).toBeVisible();
    }

    async verifyOtpResendCountdownMessageEmail() {
        await expect(this.page.locator('button').filter({ hasText: '변경하기' }).first()).toBeVisible();
        await expect(this.otpResendCountdownText).toBeVisible();
    }
    async verifyResendButtonHidden() { await this.expectAllHidden(this.resendOtpText, this.resendOtpButton); }
    async verifyResendButtonVisible() { await this.expectAllVisible(this.resendOtpText, this.resendOtpButton); }
    async clickResendOtp() { await this.resendOtpButton.click(); }
    async verifyResendOtpSuccess(successMessage: string) {
        await expect(this.page.getByText(successMessage, { exact: true })).toBeVisible();
    }

    // Mock – Email 
    async mockOtpSendError(errorMessage: string) { await this.mockRoute('**/send-code-verify-email**', 500, { code: 500, message: errorMessage }); }
    async mockOtpSendSuccess() { await this.mockRoute('**/send-code-verify-email**', 200, { code: 200, message: 'OK', data: {} }); }
    async mockOtpEmailError(errorCode: number, errorMessage: string) {
        await this.mockRoute('**/send-code-verify-email**', 400, { code: errorCode, message: errorMessage });
    }
    async mockOtpChangeEmailError(errorCode: number, errorMessage: string) {
        await this.mockRoute('**/send-code-change-email**', 400, { code: errorCode, message: errorMessage });
    }
    async mockOtpChangeEmailSuccess() { await this.mockRoute('**/send-code-change-email**', 200, { code: 200, message: 'OK', data: {} }); }
    async mockExpiredOtpChangeEmailError() { await this.mockExpiredRoute('confirm-change-email'); }
    async mockExpiredOtpError() { await this.mockExpiredRoute('confirm-verify-email'); }
    async verifyOtpSendError(expectedErrorMessage: string) {
        await this.otpSendButton.click();
        await expect(this.page.getByText(expectedErrorMessage)).toBeVisible();
        await this.page.unroute('**/send-code-verify-email**');
    }
    async verifyOtpEmailErrorDialog(expectedErrorMessage: string) {
        await this.otpSendButton.click();
        await expect(this.page.getByText(expectedErrorMessage, { exact: true })).toBeVisible();
        await this.page.unroute('**/send-code-verify-email**');
    }
    async verifyExpiredOtpError(expectedErrorMessage: string) {
        await this.confirmButton.click();
        await expect(this.page.getByText(expectedErrorMessage, { exact: true })).toBeVisible();
        await this.page.unroute('**/confirm-verify-email**');
    }

    //  Mock – Phone Change 
    async mockOtpChangePhoneError(errorMessage: string) { await this.mockPhoneRoute('send-code-change-phone', false, errorMessage); }
    async mockOtpChangePhoneSuccess() { await this.mockPhoneRoute('send-code-change-phone', true); }
    async mockExpiredOtpChangePhoneError() { await this.mockExpiredRoute('confirm-change-phone'); }
    async verifyExpiredPhoneChangeOtpError(expectedErrorMessage: string) {
        await this.verifyExpiredOtpResponse('confirm-change-phone', () => this.submitPhoneChange(), expectedErrorMessage);
    }

    // Mock – Phone Verify 
    async mockOtpVerifyPhoneError(errorMessage: string) { await this.mockPhoneRoute('send-code-verify-phone', false, errorMessage); }
    async mockOtpVerifyPhoneSuccess() { await this.mockPhoneRoute('send-code-verify-phone', true); }
    async mockExpiredOtpVerifyPhoneError() { await this.mockExpiredRoute('confirm-verify-phone'); }
    async verifyExpiredPhoneVerifyOtpError(expectedErrorMessage: string) {
        await this.verifyExpiredOtpResponse('confirm-verify-phone', () => this.confirmButton.click(), expectedErrorMessage);
    }

    // Email – Authenticated 
    async verifyAuthenticatedEmailUI(emailAddress: string) {
        await expect(this.emailInput).toHaveValue(emailAddress);
        await this.expectAllVisible(this.authenticatedIcon, this.authenticatedBadge, this.changeEmailButton);
    }
    async openChangeEmailDialog() { await this.changeEmailButton.click(); }
    async verifyChangeEmailDialogVisible() { await expect(this.changeEmailDialog).toBeVisible(); }
    async verifyChangeEmailButtonVisible() { await expect(this.changeEmailButton).toBeVisible(); }
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
    async verifyNewEmailValidationMessage(message: string, exact = false) {
        await expect(this.page.getByText(message, { exact })).toBeVisible();
    }
    async verifyChangeEmailDialogClosed() { await expect(this.changeEmailDialog).toBeHidden(); }
    async verifyChangeEmailDialogClosedAndEmailUnchanged(emailAddress: string) {
        await expect(this.changeEmailDialog).toBeHidden();
        await this.verifyAuthenticatedEmailUI(emailAddress);
    }

    // Password
    async verifyPasswordChangedStatusVisible() {
        await this.expectAllVisible(this.passwordChangedHeading, this.page.getByText(/변경됨/).last());
    }
    async openChangePasswordDialog() { await this.changePasswordButton.click(); }
    async verifyChangePasswordDialogVisible() {
        await this.expectAllVisible(
            this.changePasswordDialog, this.currentPasswordInput,
            this.newPasswordInput, this.confirmNewPasswordInput,
            this.submitChangePasswordButton, this.cancelChangePasswordButton,
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
        for (const locator of [this.currentPasswordInput, this.newPasswordInput, this.confirmNewPasswordInput])
            await locator.clear();
        const fields: [string | undefined, Locator][] = [
            [options.currentPass, this.currentPasswordInput],
            [options.newPass, this.newPasswordInput],
            [options.confirmPass, this.confirmNewPasswordInput],
        ];
        for (const [value, locator] of fields)
            if (value !== undefined) await this.fillInput(locator, value);
    }
    async submitChangePassword() { await this.submitChangePasswordButton.click(); }
    async cancelChangePassword() { await this.cancelChangePasswordButton.click(); }
    async closeChangePasswordDialog() { await this.changePasswordCloseIcon.click(); }
    async verifyChangePasswordDialogHidden() { await expect(this.changePasswordDialog).toBeHidden(); }
    async verifyPasswordValidationMessage(message: string) {
        await expect(this.page.getByText(message, { exact: true })).toBeVisible();
    }
}
