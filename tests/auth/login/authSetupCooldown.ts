import { test } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

let hasWaited = false;
test.beforeAll(async () => {
  if (!hasWaited) {
    hasWaited = true;
    await new Promise(resolve => setTimeout(resolve, 25000));
  }
});
