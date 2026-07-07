import { test as base } from '@playwright/test';

type CustomFixtures = {
    apiBaseURL: string;
};

export const test = base.extend<CustomFixtures>({
    apiBaseURL: async ({}, use) => {
        const url = process.env.API_BASE_URL ?? 'http://dev-v2.challenger-api.named.net';
        await use(url);
    },
});

export { expect } from '@playwright/test';
