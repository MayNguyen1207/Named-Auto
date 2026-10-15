import { test, expect } from '../../../utils/registerFixtures';
import data from '../../../data-test/register-data.json';
import { randomRegisterEmail } from '../../../utils/testRandomDataRegister';

const ruleSelectorsReady = !!process.env.REGISTER_LENGTH_VALID_SELECTOR && !!process.env.REGISTER_COMPOSITION_VALID_SELECTOR;

test.describe('[Auth][Register] Step 1', () => {
    test('NMD-REG-UI-001 Default screen', async ({ registerPage: r }) => {
        await test.step('Register is the selected tab', async () => {
            await r.expectRegisterSelected();
            await expect(r.loginTab).not.toBeFocused();
        });
        await test.step('Fields, rules and actions are visible', async () => {
            for (const locator of [r.homeButton, r.emailInput, r.passwordInput, r.confirmPasswordInput,
                r.passwordLengthText, r.passwordCompositionText, r.agreeCheckbox, r.nextButton, r.loginLink]) {
                await expect(locator).toBeVisible();
            }
            await r.expectAgreement(false);
            await expect(r.nextButton).toBeDisabled();
        });
        // homeButton verifies the logo's navigation control. Actual logo artwork needs its own locator.
    });

    test('NMD-REG-FUNC-002 Logo control returns home', async ({ registerPage: r }) => {
        await r.goHome();
        await expect(r.registerLink).toBeVisible();
    });

    for (const [id, field, placeholder] of [
        ['NMD-REG-UI-003', 'emailInput', '이메일 입력'],
        ['NMD-REG-UI-018', 'passwordInput', '비밀번호 입력'],
        ['NMD-REG-UI-028', 'confirmPasswordInput', '비밀번호 입력'],
    ] as const) {
        test(`${id} Field enabled and placeholder`, async ({ registerPage: r }) => {
            await expect(r[field]).toBeEnabled();
            await expect(r[field]).toHaveAttribute('placeholder', placeholder);
        });
    }

    test('NMD-REG-FUNC-004 Valid random email', async ({ registerPage: r }) => {
        const email = randomRegisterEmail();
        await r.fillEmail(email);
        await expect(r.emailInput).toHaveValue(email);
        await expect(r.emailFormatMsg).toBeHidden();
    });
  for (const item of data.invalidEmails) {
    test(`${item.id} ${item.name}`, async ({ registerPage: r }) => {
        await r.fillEmail(item.value);

        if (item.id === 'NMD-REG-NEG-015') {
            // Email trống sau blur: không hiển thị thông báo lỗi
            await expect(r.emailInput).toHaveValue('');
            await expect(r.emailFormatMsg).toBeHidden();
        } else {
            // Các testcase Email sai định dạng khác
            await expect(r.emailFormatMsg).toBeVisible();
            await expect(r.nextButton).toBeDisabled();
        }
    });
}

    test('NMD-REG-FUNC-011 Uppercase email', async ({ registerPage: r }) => {
        await r.fillEmail(randomRegisterEmail().toUpperCase());
        await expect(r.emailFormatMsg).toBeHidden();
    });

    // Clipboard behavior is tested through a real paste operation on Chromium.
    for (const internalSpace of [false, true]) {
        test(`${internalSpace ? 'NMD-REG-NEG-014' : 'NMD-REG-FUNC-013'} Paste email spaces`,
            async ({ registerPage: r, context, browserName }) => {
                test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium-specific in this suite.');
                const email = randomRegisterEmail();
                const value = internalSpace ? email.replace('@', ' @') : `    ${email}    `;
                await context.grantPermissions(['clipboard-read', 'clipboard-write']);
                await r.page.evaluate(text => navigator.clipboard.writeText(text), value);
                await r.emailInput.focus();
                await r.emailInput.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');
                await r.emailInput.blur();
                if (internalSpace) await expect(r.emailFormatMsg).toBeVisible();
                else {
                    await expect(r.emailInput).toHaveValue(email);
                    await expect(r.emailFormatMsg).toBeHidden();
                }
            });
    }

   test('NMD-REG-UI-019 Realtime password rule updates', async ({ registerPage: r }) => {
    const status = r.page.getByTestId('password-requirement-status');

    // 1. Nhập 5 ký tự: không hợp lệ
    await r.passwordInput.fill('abc@1');
    await expect(status).toHaveClass(/tabler-icon-alert-circle/);

    // 2. Nhập đủ 6 ký tự, có chữ + số + ký tự đặc biệt: hợp lệ
    await r.passwordInput.pressSequentially('2');
    await expect(status).toHaveClass(/tabler-icon-circle-check/);

    // 3. Nhập 6 ký tự nhưng thiếu số và ký tự đặc biệt: không hợp lệ
    await r.passwordInput.fill('abcdef');
    await expect(status).toHaveClass(/tabler-icon-alert-circle/);

    // 4. Nhập 19 ký tự: không hợp lệ
    await r.passwordInput.fill('Abc@123456789012345');
    await expect(status).toHaveClass(/tabler-icon-alert-circle/);

    // 5. Nhập Password hợp lệ trở lại
    await r.passwordInput.fill('Abc@123');
    await expect(status).toHaveClass(/tabler-icon-circle-check/);
});

    for (const item of data.passwordRules) {
    test(`${item.id} Rule states for ${item.value.length} characters`,
        async ({ registerPage: r }) => {

            // 1. Nhập Password
            await r.passwordInput.fill(item.value);

            // 2. Kiểm tra giá trị và trạng thái che Password
            await expect(r.passwordInput).toHaveValue(item.value);
            await expect(r.passwordInput).toHaveAttribute('type', 'password');

            // 3. Kiểm tra kết hợp 2 điều kiện
            // Rule 1: Độ dài từ 6 đến 18 ký tự
            // Rule 2: Có chữ tiếng Anh, số và ký tự đặc biệt
            const isValid = item.length && item.composition;

            const status = r.page.getByTestId('password-requirement-status');

            // 4. Kiểm tra biểu tượng validation
            if (isValid) {
                await expect(status).toHaveClass(/tabler-icon-circle-check/);
                await expect(status).toHaveClass(/text-green/);
            } else {
                await expect(status).toHaveClass(/tabler-icon-alert-circle/);
                await expect(status).toHaveClass(/text-destructive/);
            }
        });
}

    for (const [field, toggle, firstId, secondId] of [
        ['passwordInput', 'passwordToggle', 'NMD-REG-FUNC-021', 'NMD-REG-FUNC-022'],
        ['confirmPasswordInput', 'confirmPasswordToggle', 'NMD-REG-FUNC-030', 'NMD-REG-FUNC-031'],
    ] as const) {
        test(`${firstId} Show password`, async ({ registerPage: r }) => {
            await r[field].fill(data.validPassword);
            await expect(r[field]).toHaveAttribute('type', 'password');
            await r[toggle].click();
            await expect(r[field]).toHaveAttribute('type', 'text');
            await expect(r[field]).toHaveValue(data.validPassword);
        });
        test(`${secondId} Hide password again`, async ({ registerPage: r }) => {
            await r[field].fill(data.validPassword);
            await r[toggle].click();
            await expect(r[field]).toHaveAttribute('type', 'text');
            await r[toggle].click();
            await expect(r[field]).toHaveAttribute('type', 'password');
        });
    }

    test('NMD-REG-FUNC-029 Matching confirmation', async ({ registerPage: r }) => {
        await r.fillStep1(randomRegisterEmail());
        await expect(r.confirmPasswordInput).toHaveValue(data.validPassword);
        await expect(r.confirmPasswordInput).toHaveAttribute('type', 'password');
        await expect(r.passwordMismatchMsg).toBeHidden();
        await expect(r.nextButton).toBeEnabled();
    });

    for (const [id, confirmation] of [
    ['NMD-REG-NEG-032', 'Other@123'],
    ['NMD-REG-NEG-033-CONFIRM', ''],
] as const) {
    test(`${id} Mismatched or blank confirmation`, async ({ registerPage: r }) => {
        await r.fillStep1(randomRegisterEmail(), data.validPassword, confirmation);
        await r.confirmPasswordInput.focus();
        await r.confirmPasswordInput.blur();

        if (confirmation === '') {
            // Confirm Password trống: không hiển thị thông báo lỗi
            await expect(r.passwordMismatchMsg).toBeHidden();
        } else {
            // Confirm Password không khớp: hiển thị thông báo lỗi
            await expect(r.passwordMismatchMsg).toBeVisible();
        }

        await expect(r.nextButton).toBeDisabled();
    });
}

    test('NMD-REG-UI-034 Agreement default unchecked and enabled', async ({ registerPage: r }) => {
        await expect(r.agreeCheckbox).toBeEnabled();
        await r.expectAgreement(false);
    });

    test('NMD-REG-FUNC-035 Check and uncheck', async ({ registerPage: r }) => {
        await r.agreeCheckbox.click();
        await r.expectAgreement(true);
        await r.agreeCheckbox.click();
        await r.expectAgreement(false);
    });

    test('NMD-REG-FUNC-036 Read and close terms', async ({ registerPage: r }) => {
        await r.openAndClosePolicy('terms');
    });
    test('NMD-REG-FUNC-037 Read and close privacy guide', async ({ registerPage: r }) => {
        await r.openAndClosePolicy('privacy');
    });

    const blockedCases = [
        { name: 'invalid email', email: '12@.com', password: data.validPassword, confirmation: data.validPassword, agree: true },
        { name: 'invalid password', password: 'abc@1', confirmation: 'abc@1', agree: true },
        { name: 'mismatched confirmation', password: data.validPassword, confirmation: 'Other@123', agree: true },
        { name: 'unchecked agreement', password: data.validPassword, confirmation: data.validPassword, agree: false },
        { name: 'empty email', email: '', password: data.validPassword, confirmation: data.validPassword, agree: true },
        { name: 'empty password', password: '', confirmation: data.validPassword, agree: true },
        { name: 'empty confirmation', password: data.validPassword, confirmation: '', agree: true },
    ];
    test('NMD-REG-UI-039 Empty form disables Next', async ({ registerPage: r }) => {
        await expect(r.nextButton).toBeDisabled();
    });
    for (const item of blockedCases) {
        test(`NMD-REG-UI-039 ${item.name} disables Next`, async ({ registerPage: r }) => {
            await r.fillStep1(item.email ?? randomRegisterEmail(), item.password, item.confirmation, item.agree);
            await expect(r.nextButton).toBeDisabled();
        });
    }

    test('NMD-REG-FUNC-040-NEXT Valid fields advance Step 2', async ({ registerPage: r }) => {
        await r.proceedToStep2();
        await expect(r.phoneInput).toBeVisible();
    });
    test('NMD-REG-FUNC-040-LOGIN Login link selects Login', async ({ registerPage: r }) => {
        await r.goToLogin();
    });
});
