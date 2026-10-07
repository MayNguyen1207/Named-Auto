import { test, expect } from '../../../../utils/fixtures';
import { SoccerDetailChatPage } from '../../../../pages/sports/soccer/SoccerDetailChatPage';
import matchData from '../../../../data-test/match-detail-data.json';

test.describe('User Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let soccerDetailChatPage: SoccerDetailChatPage;
    let matchId = matchData.matchLink.normal;

    test.beforeEach(async ({ page }) => {
        soccerDetailChatPage = new SoccerDetailChatPage(page);
        await soccerDetailChatPage.navigate(matchId);
    });

    test('[Soccer] User can turn on/off Star Candy filter', async () => {
        await test.step('Verify starCandyActiveBtn is visible by default', async () => {
            await expect(soccerDetailChatPage.starCandyActiveBtn).toBeVisible();
        });

        await test.step('Click starCandyActiveBtn => button switches to starCandyRevokeBtn and shows info toast', async () => {
            await soccerDetailChatPage.starCandyActiveBtn.click();
            await expect(soccerDetailChatPage.starCandyRevokeBtn).toBeVisible();
            await soccerDetailChatPage.verifyToastMsg('info', '별사탕 모두보기가 활성화 됩니다.');
        });

        await test.step('Click again => button reverts to starCandyActiveBtn and shows info toast', async () => {
            await soccerDetailChatPage.starCandyRevokeBtn.click();
            await expect(soccerDetailChatPage.starCandyActiveBtn).toBeVisible();
            await soccerDetailChatPage.verifyToastMsg('info', '별사탕 모두보기가 비활성화 됩니다.');
        });
    });

    test('[Soccer] User can turn on/off Eye icon', async () => {
        const eyeIcon = soccerDetailChatPage.eyeBtn.locator('svg');

        await test.step('Verify eyeBtn is visible and svg has class tabler-icon-eye by default', async () => {
            await expect(soccerDetailChatPage.eyeBtn).toBeVisible();
            await expect(eyeIcon).toHaveAttribute('class', 'tabler-icon tabler-icon-eye ');
        });

        await test.step('Click eyeBtn => svg class switches to tabler-icon-eye-off and shows info toast', async () => {
            await soccerDetailChatPage.eyeBtn.click();
            await expect(eyeIcon).toHaveAttribute('class', 'tabler-icon tabler-icon-eye-off ');
            await soccerDetailChatPage.verifyToastMsg('info', '응원하기 모두보기가 활성화 됩니다.');
        });

        await test.step('Click again => svg class reverts to tabler-icon-eye and shows info toast', async () => {
            await soccerDetailChatPage.eyeBtn.click();
            await expect(eyeIcon).toHaveAttribute('class', 'tabler-icon tabler-icon-eye ');
            await soccerDetailChatPage.verifyToastMsg('info', '응원하기 모두보기가 비활성화 됩니다.');
        });
    })
})