import { test as base } from '@playwright/test';

type CustomWorkerFixtures = {
    apiBaseURL: string;
};

export const test = base.extend<{}, CustomWorkerFixtures>({
    apiBaseURL: [async ({}, use) => {
        const url = process.env.API_BASE_URL ?? 'http://dev-v2.challenger-api.named.net';
        await use(url);
    }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';
