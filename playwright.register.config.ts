import { defineConfig, devices } from '@playwright/test';
import teamConfig from './playwright.config';

// A separate config prevents unrelated account-login setup from running for Register.
export default defineConfig({
    ...teamConfig,
    testDir: './tests/auth/register',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0, // Registration creates accounts; do not repeat it automatically on CI.
    timeout: 60000,
    expect: { timeout: 10000 },
    use: {
    ...teamConfig.use,
    baseURL: process.env.REGISTER_BASE_URL ?? 'http://dev-v2.named.net',
    storageState: { cookies: [], origins: [] },
    trace: 'retain-on-failure',

    // Cho phép Clipboard API hoạt động trên HTTP (Chromium)
    launchOptions: {
        args: [
            '--unsafely-treat-insecure-origin-as-secure=http://dev-v2.named.net'
        ]
    },
},
    projects: process.env.CI
        ? [
            { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
            { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
            { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
        : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    });
