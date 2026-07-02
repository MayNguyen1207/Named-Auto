import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['allure-playwright', { outputFolder: 'allure-results' }]]
    : [['html', { open: 'always' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://dev-v2.named.net',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, },

    ...(process.env.CI
      ? [
        /* Khi chạy trên GitHub (isCI = true): Chạy cả 3 browser */
        { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: path.resolve(__dirname, 'playwright/.auth/guest.json'), }, dependencies: ['setup'], },
        { name: 'firefox', use: { ...devices['Desktop Firefox'], storageState: path.resolve(__dirname, 'playwright/.auth/guest.json'), }, dependencies: ['setup'], },
        { name: 'webkit', use: { ...devices['Desktop Safari'], storageState: path.resolve(__dirname, 'playwright/.auth/guest.json'), }, dependencies: ['setup'], },
      ]
      : [
        /* Khi chạy ở Local (isCI = false): Chỉ chạy duy nhất Chrome cho nhanh */
        { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: path.resolve(__dirname, 'playwright/.auth/guest.json'), }, dependencies: ['setup'], },
      ]
    )
  ]
});
/* Test against mobile viewports. */
// {
//   name: 'Mobile Chrome',
//   use: { ...devices['Pixel 5'] },
// },
// {
//   name: 'Mobile Safari',
//   use: { ...devices['iPhone 12'] },
// },

/* Test against branded browsers. */
// {
//   name: 'Microsoft Edge',
//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
// },
// {
//   name: 'Google Chrome',
//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
// },

/* Run your local dev server before starting the tests */
// webServer: {
//   command: 'npm run start',
//   url: 'http://localhost:3000',
//   reuseExistingServer: !process.env.CI,
// },
