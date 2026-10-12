import { test, expect } from '../../utils/fixtures';
import { MemberProfilePage } from '../../pages/MemberProfilePage';
import loginData from '../../data-test/login-data.json';

test.describe('[Member Profile Area]', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let memberProfilePage: MemberProfilePage;

    test.beforeEach(async ({ page }) => {
        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
    });

    test('User avatar, level icon, username are displayed normally', async () => {
        const { avatar, levelIcon, username } = memberProfilePage.getProfilePopupBtnElements(loginData.valid.expectedUsername);
        await expect(avatar).toBeVisible();
        await expect(levelIcon).toBeVisible();
        await expect(username).toBeVisible();
    });

    const popupTests = [
        { triggerName: 'username', popupName: 'profile popup', btn: 'profilePopupBtn', content: 'profilePopup' },
        { triggerName: 'notification button', popupName: 'notification popup', btn: 'notificationPopupBtn', content: 'notificationPopup' },
        { triggerName: 'memo button', popupName: 'memo popup', btn: 'memoPopupBtn', content: 'memoPopup' },
    ] as const;

    for (const { triggerName, popupName, btn, content } of popupTests) {
        test(`User can click ${triggerName} to open ${popupName}`, async () => {
            await memberProfilePage[btn].click();
            await expect(memberProfilePage[content]).toBeVisible();
        });
    }
})