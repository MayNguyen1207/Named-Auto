import { test, expect } from '../../../utils/registerFixtures';
import data from '../../../data-test/register-data.json';

test.describe('[Auth][Register] Step 3', () => {
    test.beforeEach(async ({ registerPage: r }) => { await r.prepareStep3(); });

    test('REG-S3-DEFAULT OTP text, empty input and disabled Complete', async ({ registerPage: r }) => {
        await r.expectStep3();
        await expect(r.otpInput).toBeEmpty();
        await expect(r.completeButton).toBeDisabled();
        await expect(r.countdown).toBeVisible();
        await expect(r.backButton).toBeVisible();
    });

    test('REG-S3-SIX-DIGITS Enable Complete only after six digits', async ({ registerPage: r }) => {
        await r.otpInput.fill('12345');
        await expect(r.completeButton).toBeDisabled();
        await r.otpInput.fill('123456');
        await expect(r.completeButton).toBeEnabled();
        // No submission: this testcase checks enablement, not OTP validity.
    });

    test('REG-S3-INCORRECT Error notice can be closed', async ({ registerPage: r }) => {
        const invalid = process.env.REGISTER_INVALID_OTP ?? data.invalidOtp;
        expect(invalid).not.toBe(process.env.REGISTER_VALID_OTP ?? data.validOtp);
        await r.submitOtp(invalid);
        await r.expectIncorrectOtp();
    });

    test('REG-S3-BACK Return to Step 2', async ({ registerPage: r }) => {
        await r.backButton.click();
        await r.expectStep2();
    });

    test('REG-S3-COUNTDOWN Countdown decreases', async ({ registerPage: r }) => {
        await expect(r.countdown).toBeVisible();
        const seconds = (text: string) => {
            const minutes = text.match(/(\d+)분/);
            const remaining = text.match(/(\d+)초/);
            if (!minutes && !remaining) throw new Error(`Cannot parse countdown: ${text}`);
            return Number(minutes?.[1] ?? 0) * 60 + Number(remaining?.[1] ?? 0);
        };
        const initial = seconds(await r.countdown.innerText());
        expect(initial).toBeGreaterThan(0);
        await expect.poll(async () => seconds(await r.countdown.innerText()), { timeout: 5000 }).toBeLessThan(initial);
    });

    test('REG-S3-RESEND Wait for availability then resend', async ({ registerPage: r }) => {
        test.setTimeout(300000);
        await r.resendOtp();
        await expect(r.countdown).toBeVisible();
        await expect(r.otpTitle).toBeVisible();
    });

    test('REG-S3-LOGIN Link selects Login', async ({ registerPage: r }) => {
        await r.goToLogin();
    });

});
