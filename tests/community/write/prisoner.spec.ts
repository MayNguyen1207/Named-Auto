import { test, expect } from '../../../utils/fixtures';
import { WriteFreePage } from '../../../pages/community/WriteFreePage';
import loginData from '../../../data-test/login-data.json';
import fs from 'fs';
import path from 'path';

test.describe('Prisoner Flow', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    test('[Community] A modal should be shown when prisoner accesses Write Post page', async ({ page, request, apiBaseURL }) => {
        const authData = JSON.parse(fs.readFileSync(path.resolve('playwright/.auth/prisoner.json'), 'utf-8'));
        const sessionId = authData.cookies.find((c: any) => c.name === 'dev_session_id')?.value;

        const response = await request.get(`${apiBaseURL}/me`, {
            headers: {
                'NAMED-SESSION': sessionId
            }
        });
        const data = await response.json();
        const [year, month, day] = data.jail_released_date.split('-');

        const writeFreePage = new WriteFreePage(page);
        await writeFreePage.navigate();
        await expect(writeFreePage.jailPoster).toBeVisible();
        await expect(writeFreePage.prisonNotice).toContainText(
            `${loginData.prisoner.expectedUsername}님은 비매너의 죄명으로 영창에 수감되어 네임드의 서비스를 이용하실 수 없습니다.\n
            ${year}년 ${month}월 ${day}일 00:00부터 정상 이용이 가능합니다.`
        );

        await writeFreePage.previousPageBtn.click();
        await expect(page).not.toHaveURL('/community\/create\?boardType=free', { timeout: 10000 });
    });
});