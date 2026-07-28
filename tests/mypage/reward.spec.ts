import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyInfo] Reward Feature Tests', () => {
  let loginPage: LoginPage;
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    myInfoPage = new MyInfoPage(page);
  });

  test('[MyInfo] Verify reward page elements', async ({ page }) => {
    await page.goto('/login?callbackUrl=/mypage/info?');
    await loginPage.login(loginData.loginFromOtherPage.email, loginData.loginFromOtherPage.password);
    await myInfoPage.verifyRewardElementsVisible(mypageData.reward.expectedTexts);
    await myInfoPage.verifyCurrentPoints(mypageData.reward.expectedTexts.currentPoints);
    await myInfoPage.openRewardGuideDialog(mypageData.reward.expectedTexts.guideButton);
    await myInfoPage.verifyRewardGuideDialogVisible(mypageData.reward.dialogExpectedTexts.noticeText);
    await myInfoPage.closeRewardGuideDialog();
    await myInfoPage.verifyRewardGuideDialogHidden();
  });
});
