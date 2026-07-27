import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MyInfoPage } from '../../pages/MyInfoPage';
import loginData from '../../data-test/login-data.json';
import mypageData from '../../data-test/mypage-data.json';

test.describe('[MyPage] Reward Feature Tests', () => {
  let loginPage: LoginPage;
  let myInfoPage: MyInfoPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    myInfoPage = new MyInfoPage(page);
  });

  test('[MyPage] Verify reward page elements', async ({ page }) => {
    await page.goto('/login?callbackUrl=/mypage/info?');
    
    await loginPage.login(loginData.loginFromOtherPage.email, loginData.loginFromOtherPage.password);
    
    await myInfoPage.verifyRewardElementsVisible(mypageData.reward.expectedTexts);
    
    // Verify current points
    await myInfoPage.verifyCurrentPoints(mypageData.reward.expectedTexts.currentPoints);

    // Open reward guide dialog
    await myInfoPage.openRewardGuideDialog(mypageData.reward.expectedTexts.guideButton);
    
    // Verify dialog contents
    await myInfoPage.verifyRewardGuideDialogVisible(mypageData.reward.dialogExpectedTexts.noticeText);
    
    // Close dialog and verify it's hidden
    await myInfoPage.closeRewardGuideDialog();
    await myInfoPage.verifyRewardGuideDialogHidden();
  });
});
