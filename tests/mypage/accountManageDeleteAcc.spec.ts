import { test, expect } from '@playwright/test';
import path from 'path';
import { MyInfoPage } from '../../pages/MyInfoPage';

test.describe('[MyInfo] Account Delete Tests', () => {
    test.describe('Non-phone user account deletion', () => {
        let myInfoPage: MyInfoPage;

        test.use({ storageState: path.resolve(__dirname, '../../playwright/.auth/non-phone-user.json') });

        test.beforeEach(async ({ page }) => {
            myInfoPage = new MyInfoPage(page);
            await page.goto('/mypage/info');
        });

        test('Verify UI elements for account deletion and cancel delete', async ({ page }) => {
            const expectedTexts = [
                '사용 중인 계정(회원6124',
                '탈퇴한 계정은 본인 및 타인 모두 재사용하거나 복구할 수 없으므로, 신중하게 선택해 주세요',
                '※ 추가 회원가입은 탈퇴일로부터 30',
                '탈퇴 후에는 회원정보 및 개인형 서비스 이용 기록이 모두 삭제됩니다',
                '포인트, 간빵, 캐쉬, 친구 목록, 즐겨찾기 등 개인 정보와 서비스 이용 내역은 완전히 삭제되며, 복구가 불가능합니다',
                '삭제되는 내용을 반드시 확인하신 후, 필요한 데이터는 미리 백업해 주세요',
                '탈퇴 후에도 게시판형 서비스에 등록한 게시물은 유지됩니다',
                '커뮤니티, 인포존 등 게시판에 작성한 글과 댓글은 탈퇴 이후에도 삭제되지 않고 남아있습니다',
                '탈퇴를 진행하기 전에 이메일 인증이 필요합니다',
                '이메일 또는 핸드폰 인증을 통해 탈퇴가 진행되며, 위 내용을 모두 확인하고 동의하신 경우, [위 항목에 동의 및 탈퇴] 버튼을 눌러 탈퇴를 진행'
            ];

            for (const text of expectedTexts) {
                await expect(page.getByText(text)).toBeVisible();
            }

            const agreeAndDeleteButton = page.getByRole('button', { name: '위 항목에 동의 및 탈퇴' });
            await expect(agreeAndDeleteButton).toBeVisible();
            await agreeAndDeleteButton.click();

            await expect(page.locator('input[name="email"]')).toHaveValue('test_acc4@yopmail.com');
            await myInfoPage.otpSendButton.click();
            await myInfoPage.otpInput.click();
            await myInfoPage.otpInput.fill('123456');
            await page.getByRole('button', { name: '인증완료' }).click();

            await expect(page.getByText('탈퇴할 경우 재사용 및 복구가 불가능하며 추가 회원가입은 탈퇴일로부터 30일 후에 가능합니다. 정말 탈퇴하시겠습니까?')).toBeVisible();
            await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
            await expect(page.getByRole('button', { name: '취소' })).toBeVisible();

            await page.getByRole('button', { name: '취소' }).click();
            await expect(page.locator('span').filter({ hasText: '알림' }).first()).toBeHidden();
        });
    });
});
