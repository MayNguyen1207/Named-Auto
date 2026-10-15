import { test, expect } from '../../../utils/registerFixtures';
import data from '../../../data-test/register-data.json';

// No auth or state shared between tests. Each success case creates a separate account.
test.describe('[Auth][Register] Completion', () => {
    test('REG-COMPLETE-AUTO Success redirects home and logs in', async ({ registerPage: r }, testInfo) => {
        test.setTimeout(120000);
        const identity = await r.completeFreshRegistration();
        await testInfo.attach('created-dev-account', {
            body: JSON.stringify(identity, null, 2), contentType: 'application/json',
        });
        await expect(r.successText).toBeVisible();
        // Wait on the URL instead of a fixed sleep(10000).
        await r.expectHomeLoggedIn();
    });

    test('REG-COMPLETE-HOME-NOW Home immediately and logged in', async ({ registerPage: r }, testInfo) => {
        test.setTimeout(120000);
        const identity = await r.completeFreshRegistration();
        await testInfo.attach('created-dev-account', {
            body: JSON.stringify(identity, null, 2), contentType: 'application/json',
        });
        // Nếu popup xuất hiện thì nhấn 확인
    if (await r.confirmDialogButton.isVisible()) {
        await r.confirmDialogButton.click();
    }

    // Nếu đã tự chuyển Home thì không cần click nữa
    if (!/\/home(?:[?#].*)?$/.test(r.page.url())) {
        await r.homeNowButton.click({ timeout: 5000 });
    }

    // Kiểm tra đã về Home và đăng nhập thành công
    await r.expectHomeLoggedIn();
    });

    test('REG-COMPLETE-RESEND Resend then valid OTP completes registration', async ({ registerPage: r }, testInfo) => {
        test.setTimeout(750000); // 3 bounded attempts, each potentially waiting for resend.
        const identity = await r.completeFreshRegistration({ resend: true });
        await testInfo.attach('created-dev-account', {
            body: JSON.stringify(identity, null, 2), contentType: 'application/json',
        });
        // Nếu popup xuất hiện thì nhấn 확인
        if (await r.confirmDialogButton.isVisible()) {
            await r.confirmDialogButton.click({ timeout: 5000 });
        }

        // Nếu hệ thống đã tự chuyển Home thì không click nữa
        if (!/\/home(?:[?#].*)?$/.test(r.page.url())) {
            await r.homeNowButton.click({ timeout: 5000 });
        }

        // Xác nhận đã về Home và đăng nhập thành công
        await r.expectHomeLoggedIn();
    });
test('REG-S3-HOME Register two accounts successfully', async ({ registerPage: r }) => {
    test.setTimeout(300000);

    // 1. Đăng ký tài khoản thứ nhất
    const firstAccount = await r.completeFreshRegistration();

    // 2. Kiểm tra đăng ký thành công và về Home
    if (await r.confirmDialogButton.isVisible()) {
        await r.confirmDialogButton.click();
    }

    if (!/\/home(?:[?#].*)?$/.test(r.page.url())) {
        await r.homeNowButton.click({ timeout: 5000 });
    }

    await r.expectHomeLoggedIn();
    console.log('[ACCOUNT 1] Registered:', firstAccount.email);

    // 3. Mở menu tài khoản
    await r.page.locator(
        "//div[@class='flex items-center py-1 px-2 bg-navy-700 rounded-sm h-9']//*[name()='svg']"
    ).click();

    // 4. Nhấn Logout
    await r.page.getByRole('button', {
        name: '로그아웃',
        exact: true
    }).click();

    // 5. Chờ Logout hoàn tất và nút Register xuất hiện
    await expect(r.registerLink).toBeVisible({
        timeout: 10000
    });

    // 6. Mở lại màn Register
    await r.navigate();
    await r.expectStep1();

    // 7. Đăng ký tài khoản thứ hai
    const secondAccount = await r.completeFreshRegistration();

    // 8. Kiểm tra đăng ký thành công và về Home
    if (await r.confirmDialogButton.isVisible()) {
        await r.confirmDialogButton.click();
    }

    if (!/\/home(?:[?#].*)?$/.test(r.page.url())) {
        await r.homeNowButton.click({ timeout: 5000 });
    }

    await r.expectHomeLoggedIn();
    console.log('[ACCOUNT 2] Registered:', secondAccount.email);

    // 9. Kiểm tra hai tài khoản khác nhau
    expect(secondAccount.email).not.toBe(firstAccount.email);
    expect(secondAccount.phone).not.toBe(firstAccount.phone);
});
    test('NMD-REG-NEG-017 Existing email rejected at Step 1',
    async ({ registerPage: r }) => {

        // 1. Nhập Email đã tồn tại
        const existingEmail = 'a@gmail.com';

        // 2. Điền đầy đủ thông tin Step 1
        await r.fillStep1(existingEmail);

        // 3. Kiểm tra nút Next được Enabled
        await expect(r.nextButton).toBeEnabled();

        // 4. Nhấn Next để kiểm tra Email trùng
        await r.page.getByRole('button', {
            name: '다음 단계',
            exact: true
        }).click();

        // 5. Kiểm tra thông báo Email đã tồn tại
        await expect(
            r.page.getByText(
                '이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요.',
                { exact: true }
            )
        ).toBeVisible({ timeout: 10000 });

        // 6. Kiểm tra vẫn ở Step 1
        await r.expectStep1();

        // 7. Kiểm tra không chuyển sang Step 2
        await expect(r.phoneInput).toBeHidden();

        // 8. Kiểm tra không đăng ký thành công
        await expect(r.successText).toBeHidden();
    }
);
});
