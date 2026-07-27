import { Locator, Page, expect } from '@playwright/test';

export class MyInfoPage {
  readonly page: Page;
  private readonly otpInput: Locator;
  private readonly otpSendButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.otpInput = page.getByTestId('input-otp-root');
    this.otpSendButton = page.getByRole('button', { name: 'OTP 받기' });
    this.cancelButton = page.getByRole('button', { name: '취소' });
  }


  async verifyRewardElementsVisible(expectedTexts: {
    title: string;
    subtitle: string;
    guideButton: string;
    progressBar: string;
  }) {
    await expect(this.page.getByText(expectedTexts.title)).toBeVisible();
    await expect(this.page.getByText(expectedTexts.subtitle)).toBeVisible();
    await expect(this.page.getByRole('button', { name: expectedTexts.guideButton })).toBeVisible();
    await expect(this.page.locator('div').filter({ hasText: expectedTexts.progressBar }).nth(2)).toBeVisible();
  }
  async verifyCurrentPoints(points: string) {
    await expect(this.page.locator('div').filter({ hasText: points }).nth(4)).toBeVisible();
    await expect(this.page.getByText(points)).toBeVisible();
  }

  async openRewardGuideDialog(guideButtonName: string) {
    await this.page.getByRole('button', { name: guideButtonName }).click();
  }

  async verifyRewardGuideDialogVisible(noticeText: string) {
    await expect(this.page.locator('dl:visible').first()).toBeVisible();
    await expect(this.page.getByText(noticeText)).toBeVisible();
  }

  async closeRewardGuideDialog() {
    await this.page.locator('.tabler-icon.tabler-icon-x').click();
  }

  async verifyRewardGuideDialogHidden() {
    await expect(this.page.getByRole('dialog')).toBeHidden();
  }

  async verifyUnauthenticatedEmailUI(expectedEmail: string) {
    const emailInput = this.page.getByRole('textbox', { name: '이메일' });
    await expect(emailInput).toBeVisible();
    await expect(this.page.getByLabel('이메일')).toBeVisible();
    await expect(emailInput).toHaveValue(expectedEmail);

    await expect(this.page.locator('.tabler-icon.tabler-icon-circle-x-filled > path')).toBeVisible();

    const unverifiedBadge = this.page.locator('span:has-text("미인증 – 지금 인증하기")');
    await expect(unverifiedBadge).toBeVisible();
  }

  async openVerificationDialog() {
    await this.page.getByText('미인증 – 지금 인증하기').click();
  }

  async verifyVerificationDialogVisible() {
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async verifyVerificationDialogUI(userEmail: string) {
    await expect(this.page.getByRole('heading', { name: '이메일 인증받기' })).toBeVisible();

    await expect(this.page.locator('label').filter({ hasText: '이메일' }).first()).toBeVisible();

    const emailInput = this.page.locator('input[name="email"]');
    await expect(emailInput).toHaveValue(userEmail);

    await expect(this.page.getByLabel('OTP 입력')).toBeVisible();
    await expect(this.page.getByTestId('input-otp-root')).toBeVisible();

    await expect(this.page.getByRole('button', { name: 'OTP 받기' })).toBeVisible();
    await expect(this.page.getByRole('button', { name: '취소' })).toBeVisible();

    await expect(this.page.getByRole('img')).toBeVisible();
  }

  async closeVerificationDialogWithIcon() {
    const closeIcon = this.page.getByRole('img');
    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
  }

  async verifyVerificationDialogClosedAndEmailUnchanged(expectedEmail: string) {
    await expect(this.page.getByRole('dialog')).toBeHidden();
    await this.verifyUnauthenticatedEmailUI(expectedEmail);
  }

  async requestOtp() {
    await this.otpSendButton.click();
  }

  async cancelVerificationDialog() {
    await this.cancelButton.click();
  }

  async mockOtpSendError(mockedMessage: string) {
    await this.page.route('**/send-code-verify-email**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: mockedMessage }),
      });
    });
  }

  async mockOtpSendSuccess() {
    await this.page.route('**/send-code-verify-email**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: "OK", data: {} }),
      });
    });
  }

  async verifyOtpSendError(expectedMessage: string) {
    await this.otpSendButton.click();
    await expect(this.page.getByText(expectedMessage)).toBeVisible();
    await this.page.unroute('**/send-code-verify-email**');
  }

  async mockOtpEmailError(errorCode: number, errorMessage: string) {
    await this.page.route('**/send-code-verify-email**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: errorCode, message: errorMessage }),
      });
    });
  }

  async verifyOtpEmailErrorDialog(expectedMessage: string) {
    await this.otpSendButton.click();
    await expect(this.page.getByText(expectedMessage, { exact: true })).toBeVisible();
    await this.page.unroute('**/send-code-verify-email**');
  }

  async mockExpiredOtpError() {
    await this.page.route('**/confirm-verify-email**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1006,
          message: '인증 시간이 만료 되었습니다. 인증 번호를 다시 요청해 주세요.',
        }),
      });
    });
  }

  async verifyExpiredOtpError(expectedMessage: string) {
    await this.page.getByRole('button', { name: '인증 완료' }).click();
    await expect(this.page.getByText(expectedMessage, { exact: true })).toBeVisible();
    await this.page.unroute('**/confirm-verify-email**');
  }

  async submitOtp(otp: string) {
    await this.otpInput.click();
    await this.otpInput.fill(otp);
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

  async verifyInvalidOtpError(expectedCode: number, expectedMessage: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('confirm-verify-email') &&
        response.request().method() === 'POST'
    );

    await this.page.getByRole('button', { name: '인증 완료' }).click();

    const response = await responsePromise;
    const responseData = await response.json();

    expect(responseData.code).toBe(expectedCode);
    expect(responseData.message).toBe(expectedMessage);

    await expect(this.page.getByText(responseData.message)).toBeVisible();
  }

  async verifyIncompleteOtpValidation(expectedMessage: string) {
    await expect(this.page.getByText(expectedMessage)).toBeVisible();
  }

  async verifyOtpResendCountdownMessage() {
    await expect(this.page.getByText(/OTP 재전송은 \d+초 후에 가능합니다/)).toBeVisible();
  }

  async verifyResendButtonHidden() {
    await expect(this.page.getByText('OTP를 받지 못하셨나요?')).toBeHidden();
    await expect(this.page.getByRole('button', { name: '인증번호 재발송' })).toBeHidden();
  }

  async verifyResendButtonVisible() {
    await expect(this.page.getByText('OTP를 받지 못하셨나요?')).toBeVisible();
    await expect(this.page.getByRole('button', { name: '인증번호 재발송' })).toBeVisible();
  }

  async clickResendOtp() {
    await this.page.getByRole('button', { name: '인증번호 재발송' }).click();
  }

  async verifyResendOtpSuccess(expectedMessage: string) {
    await expect(this.page.getByText(expectedMessage, { exact: true })).toBeVisible();
  }

  async verifyAuthenticatedEmailUI(expectedEmail: string) {
    const emailInput = this.page.getByRole('textbox', { name: '이메일' });
    await expect(emailInput).toHaveValue(expectedEmail);

    await expect(this.page.locator('.tabler-icon.tabler-icon-circle-check-filled > path').first()).toBeVisible();
    await expect(this.page.locator('p').filter({ hasText: '인증 완료' }).first()).toBeVisible();
    await expect(this.page.locator('button').filter({ hasText: '변경하기' }).first()).toBeVisible();
  }

  async openChangeEmailDialog() {
    await this.page.locator('button').filter({ hasText: '변경하기' }).first().click();
  }

  async verifyChangeEmailDialogVisible() {
    await expect(this.page.getByTestId('dialog-content')).toBeVisible();
  }
}
