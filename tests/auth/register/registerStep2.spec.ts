import { test, expect } from '../../../utils/registerFixtures';
import data from '../../../data-test/register-data.json';
import { randomRegisterPhone } from '../../../utils/testRandomDataRegister';

test.describe('[Auth][Register] Step 2', () => {
    test.beforeEach(async ({ registerPage: r }) => { await r.proceedToStep2(); });

    test('REG-S2-DEFAULT Phone, Korea +82, Send disabled', async ({ registerPage: r }) => {
        await expect(r.phoneInput).toBeEnabled();
        await expect(r.phoneInput).toBeEmpty();
        await expect(r.koreaCode).toBeVisible();
        await expect(r.countryButton).toBeVisible();
        await expect(r.sendOtpButton).toBeDisabled();
        await expect(r.loginLink).toBeVisible();
        await expect(r.homeButton).toBeVisible();
    });

    test('REG-S2-LOGIN-RETURN Preserve Step 2 when switching tabs', async ({ registerPage: r }) => {
        await r.goToLogin();
        await r.registerTab.click();
        await r.expectStep2();
    });

    test('REG-S2-HOME-RESTART Home then restart from Step 1', async ({ registerPage: r }) => {
        await r.goHome();
        await r.navigate();
        await expect(r.emailInput).toBeEmpty();
        await r.proceedToStep2();
    });

    test('REG-S2-COUNTRY Change country and restore Korea', async ({ registerPage: r }) => {

    // Mở dropdown chọn quốc gia
    await r.countryButton.click();

    // Tìm mã quốc gia 592
    await r.page.getByRole('combobox').fill('592');

    // Chọn Guyana
    await r.page.locator('span.flex-1.text-sm').getByText('가이아나', { exact: true }).click();

    // Verify hiển thị +592
    await expect(
    r.page.getByTestId('popover-trigger')
        .getByText('+592', { exact: true })
      ).toBeVisible();

    // Mở lại dropdown quốc gia
    await r.page.getByRole('button', { name: /GY\s*\+592/ }).click();

    // Chọn lại Korea
    await r.selectKoreaFromOpenDropdown();

    // Verify mã quốc gia trở về +82
    await expect(r.koreaCode).toBeVisible();
});

    test('REG-S2-PHONE-VALID Eight digits enable Send', async ({ registerPage: r }) => {
        await r.fillPhone(randomRegisterPhone());
        await expect(r.sendOtpButton).toBeEnabled();
    });

    for (const phone of ['', '123']) {
        test(`REG-S2-PHONE-INCOMPLETE ${phone || 'empty'}`, async ({ registerPage: r }) => {
            await r.fillPhone(phone);
            await expect(r.sendOtpButton).toBeDisabled();
        });
    }

    test('REG-S2-PHONE-DUPLICATE Existing phone shows error', async ({ registerPage: r }) => {

    // 1. Số điện thoại đã tồn tại
    const existingPhone = '1083230228';

    // 2. Nhập số điện thoại
    await r.fillPhone(existingPhone);

    // 3. Kiểm tra nút Send OTP được Enabled
    await expect(r.sendOtpButton).toBeEnabled();

    // 4. Nhấn Send OTP
    await r.sendOtpButton.click();

    // 5. Kiểm tra thông báo số điện thoại đã tồn tại
    await expect(r.phoneUsedMsg).toBeVisible({
        timeout: 10000
    });
});

    test('REG-S2-SEND Notice confirmation advances Step 3', async ({ registerPage: r }) => {
        await r.proceedToStep3();
        await r.expectStep3();
        await expect(r.completeButton).toBeDisabled();
    });
});
