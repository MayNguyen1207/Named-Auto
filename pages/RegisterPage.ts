import { expect, Locator, Page } from '@playwright/test';
import data from '../data-test/register-data.json';
import { buildRegisterIdentity, RegisterIdentity, randomRegisterEmail, randomRegisterPhone } from '../utils/testRandomDataRegister';

type OtpResult = 'success' | 'email-used' | 'phone-used' | 'otp-error';

export class RegisterPage {
    readonly page: Page;
    readonly registerLink: Locator;
    readonly registerTab: Locator;
    readonly loginTab: Locator;
    readonly loginLink: Locator;
    readonly homeButton: Locator;
    readonly emailInput: Locator;
    readonly emailFormatMsg: Locator;
    readonly emailUsedMsg: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly passwordToggle: Locator;
    readonly confirmPasswordToggle: Locator;
    readonly passwordLengthText: Locator;
    readonly passwordCompositionText: Locator;
    readonly passwordMismatchMsg: Locator;
    readonly agreeCheckbox: Locator;
    readonly termsButton: Locator;
    readonly privacyButton: Locator;
    readonly closePolicyButton: Locator;
    readonly nextButton: Locator;
    readonly phoneInput: Locator;
    readonly countryButton: Locator;
    readonly koreaCode: Locator;
    readonly phoneUsedMsg: Locator;
    readonly sendOtpButton: Locator;
    readonly noticeTitle: Locator;
    readonly confirmDialogButton: Locator;
    readonly otpTitle: Locator;
    readonly otpHelp: Locator;
    readonly otpInput: Locator;
    readonly completeButton: Locator;
    readonly backButton: Locator;
    readonly countdown: Locator;
    readonly resendHelp: Locator;
    readonly resendButton: Locator;
    readonly errorTitle: Locator;
    readonly otpErrorMsg: Locator;
    readonly successText: Locator;
    readonly homeNowButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.registerLink = page.getByRole('link', { name: '회원가입', exact: true });
        this.registerTab = page.getByRole('tab', { name: '회원가입', exact: true });
        this.loginTab = page.getByRole('tab', { name: '로그인', exact: true });
        this.loginLink = page.getByRole('link', { name: '로그인', exact: true });
        this.homeButton = page.getByRole('button', { name: '메인페이지로 이동', exact: true });
        this.emailInput = page.getByRole('textbox', { name: '이메일', exact: true });
        this.emailFormatMsg = page.getByText(data.messages.emailFormat, { exact: true });
        this.emailUsedMsg = page.getByText(data.messages.emailUsed, { exact: true });
        this.passwordInput = page.locator('input[name="password"]');
        this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
        // Click the owning button, rather than its SVG child.
        this.passwordToggle = page.getByTestId('password-visibility-toggle');
        this.confirmPasswordToggle = page.getByTestId('confirmPassword-visibility-toggle');
        this.passwordLengthText = page.getByText(data.messages.passwordLength, { exact: true });
        this.passwordCompositionText = page.getByText(data.messages.passwordComposition, { exact: true });
        this.passwordMismatchMsg = page.getByText(data.messages.passwordMismatch, { exact: true });
        this.agreeCheckbox = page.getByTestId('auth-register-agree-checkbox');
        this.termsButton = page.getByRole('button', { name: '이용약관', exact: true });
        this.privacyButton = page.getByRole('button', { name: '개인정보 수집·이용 안내', exact: true });
        this.closePolicyButton = page.getByRole('button', { name: 'Close', exact: true });
        this.nextButton = page.getByRole('button', { name: '다음 단계', exact: true });
        this.phoneInput = page.getByLabel('휴대폰 번호', { exact: true });
       this.countryButton = page.getByRole('button', {
            name: /KR\s*\+82/});
        this.koreaCode = page
        .getByTestId('popover-trigger')
        .getByText('+82', { exact: true });
        this.phoneUsedMsg = page.getByText(data.messages.phoneUsed, { exact: true });
        this.sendOtpButton = page.getByRole('button', { name: '인증 번호 받기', exact: true });
        this.noticeTitle = page.locator('span').filter({ hasText: /^알림$/ }).first();
        this.confirmDialogButton = page.getByRole('button', { name: '확인', exact: true });
        this.otpTitle = page.getByText('인증번호 입력', { exact: true });
        this.otpHelp = page.getByText('인증번호 6자리 입력', { exact: true });
        // The provided Step 3 locator requires exactly one textbox. Fail on ambiguity.
        this.otpInput = page.getByRole('textbox');
        this.completeButton = page.getByRole('button', { name: '인증 완료', exact: true });
        this.backButton = page.getByRole('button', { name: '뒤로 가기', exact: true });
        this.countdown = page.getByText(/OTP 재전송은 .+ 후에 가능합니다\./);
        this.resendHelp = page.getByText('OTP를 받지 못하셨나요?', { exact: true });
        this.resendButton = page.getByText('인증번호 재전송', { exact: true });
        this.errorTitle = page.locator('span').filter({ hasText: /^오류$/ }).first();
        this.otpErrorMsg = page
        .getByRole('dialog')
        .getByText(data.messages.otpIncorrect, { exact: true });
        this.successText = page.getByText('계정이 성공적으로', { exact: true });
        this.homeNowButton = page.getByText('홈 바로 가기', { exact: true });
    }

    async navigate() {
        await this.page.goto('/home');
        await this.registerLink.click();
        await this.expectStep1();
    }

    async expectRegisterSelected() {
        // Selected tab and keyboard focus are different states.
        await expect(this.registerTab).toHaveAttribute('aria-selected', 'true');
        await expect(this.loginTab).toHaveAttribute('aria-selected', 'false');
    }

    async expectStep1() {
        await this.expectRegisterSelected();
        await expect(this.emailInput).toBeVisible();
        await expect(this.nextButton).toBeVisible();
    }

    async fillEmail(value: string) {
        await this.emailInput.focus();
        await this.emailInput.fill(value);
        await this.emailInput.blur();
    }

    async checkboxChecked(): Promise<boolean> {
        return this.agreeCheckbox.evaluate(element => {
            if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
            const state = element.getAttribute('aria-checked') ?? element.getAttribute('data-state');
            if (state === 'true' || state === 'checked') return true;
            if (state === 'false' || state === 'unchecked') return false;
            const input = element.querySelector<HTMLInputElement>('input[type="checkbox"]');
            if (input) return input.checked;
            // Existing BasePage uses these Tabler checkbox icons.
            if (element.querySelector('svg.tabler-icon-square-rounded-check')) return true;
            if (element.querySelector('svg.tabler-icon-square-rounded')) return false;
            throw new Error('Checkbox state is not exposed. Inspect auth-register-agree-checkbox DOM.');
        });
    }

    async expectAgreement(checked: boolean) {
        await expect.poll(() => this.checkboxChecked()).toBe(checked);
    }

    async setAgreement(checked: boolean) {
        if (await this.checkboxChecked() !== checked) await this.agreeCheckbox.click();
        await this.expectAgreement(checked);
    }

    async fillStep1(email: string, password = data.validPassword, confirmation = password, agree = true) {
        await this.fillEmail(email);
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(confirmation);
        await this.confirmPasswordInput.blur();
        await this.setAgreement(agree);
    }

    async proceedToStep2(email = randomRegisterEmail()): Promise<string> {
        for (let attempt = 0; attempt < data.maxIdentityAttempts; attempt++) {
            await this.fillStep1(email);
            // Wait for a concrete UI outcome; don't swallow a timeout or another validation error.
            await expect.poll(async () =>
                await this.emailUsedMsg.isVisible() || await this.nextButton.isEnabled()
            ).toBe(true);
            if (await this.emailUsedMsg.isVisible()) { email = randomRegisterEmail(); continue; }
            await this.nextButton.click();
            await expect.poll(async () =>
                await this.phoneInput.isVisible() || await this.emailUsedMsg.isVisible()
            ).toBe(true);
            if (await this.emailUsedMsg.isVisible()) { email = randomRegisterEmail(); continue; }
            await this.expectStep2();
            return email;
        }
        throw new Error('Email remained duplicated after the bounded retry limit.');
    }

    async expectPasswordRules(length: boolean, composition: boolean) {
        // These selectors must come from the real DOM. No guessed CSS colour/class means PASS.
        const lengthSelector = process.env.REGISTER_LENGTH_VALID_SELECTOR;
        const compositionSelector = process.env.REGISTER_COMPOSITION_VALID_SELECTOR;
        if (!lengthSelector || !compositionSelector) throw new Error('Configure both REGISTER_*_VALID_SELECTOR values from the live DOM.');
        for (const [selector, valid] of [[lengthSelector, length], [compositionSelector, composition]] as const) {
            // Selector must identify only the valid indicator, not the permanent rule text.
            if (valid) await expect(this.page.locator(selector)).toBeVisible();
            else await expect(this.page.locator(selector)).toBeHidden();
        }
    }

    async openAndClosePolicy(kind: 'terms' | 'privacy') {
        const button = kind === 'terms' ? this.termsButton : this.privacyButton;
        const expected = kind === 'terms' ? '이용약관' : '개인정보 수집·이용 안내';
        await button.click();
        await expect(this.closePolicyButton).toBeVisible();
        // Prefer an explicit policy-container selector if the actual app is not role=dialog.
        const panel = process.env.REGISTER_POLICY_CONTAINER_SELECTOR
            ? this.page.locator(process.env.REGISTER_POLICY_CONTAINER_SELECTOR)
            : this.page.getByRole('dialog');
        await expect(panel).toContainText(expected);
        await this.closePolicyButton.click();
        await expect(this.closePolicyButton).toBeHidden();
        await this.expectStep1();
    }

    async goToLogin() {
        await this.loginLink.click();
        await expect(this.loginTab).toHaveAttribute('aria-selected', 'true');
        await expect(this.registerTab).toHaveAttribute('aria-selected', 'false');
        await expect(this.page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    }

    async goHome() {
        await this.homeButton.click();
        await expect(this.page).toHaveURL(/\/home(?:[?#].*)?$/);
    }

    async expectStep2() {
        await this.expectRegisterSelected();
        await expect(this.phoneInput).toBeVisible();
        await expect(this.sendOtpButton).toBeVisible();
    }

  async selectCountry(name: string) {
    await this.countryButton.click();

    const country = this.page
        .locator('span.flex-1.text-sm')
        .filter({ hasText: new RegExp(`^${name}$`) });

    await expect(country).toHaveCount(1);

    await country.scrollIntoViewIfNeeded();
    await country.click();
}

    async selectKoreaFromOpenDropdown() {
    const country = this.page
        .getByTestId('command-item')
        .locator('span.flex-1.text-sm')
        .filter({ hasText: /^대한민국$/ });

    await country.scrollIntoViewIfNeeded();
    await country.click();

    await expect(
        this.page.getByTestId('popover-trigger')
            .getByText('+82', { exact: true })
    ).toBeVisible();
}

   async fillPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    await this.phoneInput.clear();
    await this.phoneInput.pressSequentially(digits, { delay: 80 });
    await this.phoneInput.blur();

      }

    async sendOtpAndExpectNotice(): Promise<'notice' | 'phone-used'> {
        await expect(this.sendOtpButton).toBeEnabled();
        await this.sendOtpButton.click();
        let result = '';
        await expect.poll(async () => {
            result = await this.phoneUsedMsg.isVisible() ? 'phone-used'
                : await this.noticeTitle.isVisible() ? 'notice' : '';
            return result;
        }, { timeout: 15000 }).not.toBe('');
        return result as 'notice' | 'phone-used';
    }

    async proceedToStep3(phone = randomRegisterPhone()): Promise<string> {
        await expect(this.koreaCode).toBeVisible();
        for (let attempt = 0; attempt < data.maxIdentityAttempts; attempt++) {
            await this.fillPhone(phone);
            if (await this.phoneUsedMsg.isVisible()) { phone = randomRegisterPhone(); continue; }
            const result = await this.sendOtpAndExpectNotice();
            if (result === 'phone-used') { phone = randomRegisterPhone(); continue; }
            await this.confirmDialogButton.click();
            await this.expectStep3();
            return phone;
        }
        throw new Error('Phone remained duplicated after the bounded retry limit.');
    }

    async expectStep3() {
        await this.expectRegisterSelected();
        await expect(this.otpTitle).toBeVisible();
        await expect(this.otpHelp).toBeVisible();
        await expect(this.otpInput).toHaveCount(1);
        await expect(this.completeButton).toBeVisible();
    }

    async prepareStep3(): Promise<RegisterIdentity> {
        const email = await this.proceedToStep2();
        const phone = await this.proceedToStep3();
        return { email, phone };
    }

    async submitOtp(otp: string) {
        await this.otpInput.fill(otp);
        await expect(this.completeButton).toBeEnabled();
        await this.completeButton.click();
    }

    async otpResult(): Promise<OtpResult> {
        let result: OtpResult | '' = '';
        await expect.poll(async () => {
            result = await this.emailUsedMsg.isVisible() ? 'email-used'
                : await this.phoneUsedMsg.isVisible() ? 'phone-used'
                : await this.otpErrorMsg.isVisible() ? 'otp-error'
                : await this.successText.isVisible() ? 'success' : '';
            return result;
        }, { timeout: 15000 }).not.toBe('');
        return result as OtpResult;
    }

 async expectIncorrectOtp() {
    // 1. Xác định popup lỗi OTP
    const dialog = this.page.getByRole('dialog').filter({
        hasText: data.messages.otpIncorrect
    });

    // 2. Chờ popup xuất hiện
    await expect(dialog).toBeVisible({
        timeout: 10000
    });

    // 3. Kiểm tra nội dung lỗi
    await expect(
        dialog.getByText(data.messages.otpIncorrect, {
            exact: true
        })
    ).toBeVisible();

    // 4. Chờ 2 giây để popup ổn định
    await this.page.waitForTimeout(2000);

    const confirmButton = dialog.getByRole('button', {
        name: '확인',
        exact: true
    });

    // 5. Click lần thứ nhất
    await confirmButton.click({ timeout: 10000 });

    // 6. Nếu popup vẫn mở thì click lần thứ hai
    if (await dialog.isVisible()) {
        await this.page.waitForTimeout(1000);

        if (await dialog.isVisible()) {
            console.log('[OTP] Popup still open, clicking second time');
            await confirmButton.click({ timeout: 5000 });
        }
    }

    // 7. Kiểm tra popup đã đóng
    await expect(dialog).toBeHidden({
        timeout: 5000
    });

    // 8. Kiểm tra vẫn ở màn nhập OTP (Step 3)
    await this.expectStep3();
}

    async waitForResend() {
        await expect(this.resendHelp).toBeVisible({ timeout: data.resendTimeoutMs });
        await expect(this.resendButton).toBeVisible();
    }

    async resendOtp() {
        await this.waitForResend();
        await this.resendButton.click();
        await expect(this.noticeTitle).toBeVisible();
        await this.confirmDialogButton.click();
        await this.expectStep3();
        await expect(this.countdown).toBeVisible();
    }

    async completeFreshRegistration(options: { resend?: boolean } = {}): Promise<RegisterIdentity> {
        let identity = buildRegisterIdentity();
        for (let attempt = 0; attempt < data.maxIdentityAttempts; attempt++) {
            if (attempt > 0) await this.navigate();
            identity.email = await this.proceedToStep2(identity.email);
            identity.phone = await this.proceedToStep3(identity.phone);
            if (options.resend) await this.resendOtp();
            await this.submitOtp(process.env.REGISTER_VALID_OTP ?? data.validOtp);
            const result = await this.otpResult();
            if (result === 'success') return identity;
            if (result === 'otp-error') throw new Error('Configured dev OTP was rejected. Registration did not succeed.');
            // Only a specific duplicate response allows regeneration. Other errors fail above.
            identity = result === 'email-used'
                ? { ...identity, email: randomRegisterEmail() }
                : { ...identity, phone: randomRegisterPhone() };
        }
        throw new Error('Registration remained duplicated after the bounded retry limit.');
    }

    async expectHomeLoggedIn() {
        await expect(this.page).toHaveURL(/\/home(?:[?#].*)?$/, { timeout: data.autoRedirectTimeoutMs });
        const home = new (await import('./HomePage')).HomePage(this.page);
        await expect(home.loginLink).toBeHidden();
        await expect(this.registerLink).toBeHidden();
        // Stronger proof than URL alone: verify a user-specific home control.
        const marker = process.env.REGISTER_LOGGED_IN_SELECTOR;
        if (marker) await expect(this.page.locator(marker)).toBeVisible();
        else await expect(this.page.getByRole('link', { name: '마이페이지', exact: true })).toBeVisible();
    }
}
