import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/sports/soccer/SoccerListPage';

test.describe('Guest Flow', () => {

    let soccerListPage: SoccerListPage;

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();
    });

    test('[Soccer] User can click Reload button to update the list', async ({ page }) => {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const pad = (n: number) => String(n).padStart(2, '0');

        await test.step('Verify reload on today page', async () => {
            await expect(async () => {
                await Promise.all([
                    page.waitForResponse(resp => resp.url().includes('sports/soccer/today-games') && resp.status() === 200, { timeout: 2000 }),
                    soccerListPage.reloadBtn.click(),
                ]);
            }).toPass({ timeout: 10000 });
        });

        await test.step('Verify reload on next day page', async () => {
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextApiDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;

            await expect(async () => {
                await Promise.all([
                    page.waitForResponse(resp => resp.url().includes(`games?date=${nextApiDate}`) && resp.status() === 200, { timeout: 2000 }),
                    soccerListPage.nextDayBtn.click(),
                ]);
            }).toPass({ timeout: 10000 });

            await expect(async () => {
                await Promise.all([
                    page.waitForResponse(resp => resp.url().includes(`games?date=${nextApiDate}`) && resp.status() === 200, { timeout: 2000 }),
                    soccerListPage.reloadBtn.click(),
                ]);
            }).toPass({ timeout: 10000 });
        });
    });

    test('[Soccer] User can turn on and turn off the sound', async ({ page }) => {
        await expect(soccerListPage.soundBtn).not.toBeChecked();

        await expect(async () => {
            await soccerListPage.soundBtn.click();
            await expect(soccerListPage.soundBtn).toBeChecked({ timeout: 10000 });
        }).toPass({ timeout: 15000 });

        await page.reload();
        await expect(soccerListPage.soundBtn).toBeChecked({ timeout: 10000 });

        await soccerListPage.soundBtn.click();
        await expect(soccerListPage.soundBtn).not.toBeChecked({ timeout: 10000 });

        await page.reload();
        await expect(soccerListPage.soundBtn).not.toBeChecked({ timeout: 10000 });
    });

    test('[Soccer] User can turn on and turn off the prompt', async ({ page }) => {
        await expect(soccerListPage.promptBtn).not.toBeChecked();

        await expect(async () => {
            await soccerListPage.promptBtn.click();
            await expect(soccerListPage.promptBtn).toBeChecked({ timeout: 10000 });
        }).toPass({ timeout: 15000 });

        await page.reload();
        await expect(soccerListPage.promptBtn).toBeChecked({ timeout: 10000 });

        await soccerListPage.promptBtn.click();
        await expect(soccerListPage.promptBtn).not.toBeChecked();

        await page.reload();
        await expect(soccerListPage.promptBtn).not.toBeChecked({ timeout: 10000 });
    });

    test('[Soccer] User can change the display of list', async ({ page }) => {
        const firstMatchLayout = soccerListPage.matchCards.first().locator('a > div');
        await expect(firstMatchLayout).toHaveClass(/grid/, { timeout: 15000 });

        await soccerListPage.verticalBtn.click();
        await expect(firstMatchLayout).toHaveClass(/flex/);

        await page.reload();
        await expect(firstMatchLayout).toHaveClass(/flex/);

        await soccerListPage.horizontalBtn.click();
        await expect(firstMatchLayout).toHaveClass(/grid/);

        await page.reload();
        await expect(firstMatchLayout).toHaveClass(/grid/);
    });
})