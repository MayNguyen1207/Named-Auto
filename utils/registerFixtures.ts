import { test as base, expect } from './fixtures';
import { RegisterPage } from '../pages/RegisterPage';

export const test = base.extend<{ registerPage: RegisterPage }>({
    storageState: { cookies: [], origins: [] },
    registerPage: async ({ page }, use) => {
        const registerPage = new RegisterPage(page);
        await registerPage.navigate();
        await use(registerPage);
    },
});
export { expect };
