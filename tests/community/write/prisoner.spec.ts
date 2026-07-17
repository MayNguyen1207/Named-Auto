import { test, expect } from '@playwright/test';
import { WriteFreePage } from '../../../pages/WriteFreePage';
import loginData from '../../../data-test/login-data.json';

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] A modal should be shown when prisoner accesses Write Post page', async ({ page }) => {
        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await expect(writeFreePage.jailPoster).toBeVisible();
        await expect(writeFreePage.prisonNotice).toContainText(
            "서비스 이용 제한 안내" +
            loginData.prisoner.expectedUsername + "님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.");

        await writeFreePage.previousPageBtn.click();
        await expect(page).not.toHaveURL('/community\/create\?boardType=free', { timeout: 10000 });
    });
});