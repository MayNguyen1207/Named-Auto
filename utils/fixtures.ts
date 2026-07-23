import { test as base } from '@playwright/test';

type CustomWorkerFixtures = {
    apiBaseURL: string;
    sportsApiBaseURL: string;
};

export const test = base.extend<{}, CustomWorkerFixtures>({
    apiBaseURL: [async ({}, use) => {
        const url = process.env.API_BASE_URL ?? 'http://dev-v2.challenger-api.named.net';
        await use(url);
    }, { scope: 'worker' }],
    sportsApiBaseURL: [async ({}, use) => {
        const url = process.env.SPORTS_API_BASE_URL ?? 'http://43.202.207.115:8090';
        await use(url);
    }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';
