import {expect, Locator, Page} from '@playwright/test';

export class LoginPage {
    readonly page:  Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByRole('textbox', { name: '이메일 또는 휴대폰 번호' });
        this.passwordInput = page.getByRole('textbox', { name: '비밀번호' });
        this.loginButton = page.getByRole('button', { name: '로그인', exact: true });
    }

    async gotoLoginPage() {
        await this.page.goto('http://dev-v2.named.net/login');
    }

    async enterEmail(email: string) {
        await this.emailInput.click();
        await this.emailInput.pressSequentially(email, {delay: 50});
        await this.emailInput.fill(email);
        await expect(this.emailInput).toHaveValue(email);
    }
    async enterPassword(password: string) {
        await this.passwordInput.click();
        await this.passwordInput.pressSequentially(password, {delay: 50});
        await this.passwordInput.fill(password);
        await expect(this.passwordInput).toHaveValue(password);
    }
    async clickLoginButton() {
        await expect(this.loginButton).toBeEnabled({timeout: 1000});
        await this.loginButton.click();
    }
}