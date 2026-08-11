import { test, expect } from '../../../../utils/fixtures';
import { SoccerListPage } from '../../../../pages/SoccerListPage';
import { LoginPage } from '../../../../pages/LoginPage';
import loginData from '../../../../data-test/login-data.json';


test.describe('Guest Flow', () => {
    let soccerListPage: SoccerListPage;
    let likedHrefs: string[];

    test.beforeEach(async ({ page }) => {
        soccerListPage = new SoccerListPage(page);
        await soccerListPage.navigate();

        await test.step('Verify that likedMatchArea is not visible by default', async () => {
            await expect(soccerListPage.likedMatchArea).not.toBeVisible();
        });

        likedHrefs = [];

        await test.step('Like matchCard number 1, 3, 5', async () => {
            likedHrefs = await soccerListPage.likeMatchCards([0, 2, 4]);
        });
    });

    test.afterEach(async () => {
        await soccerListPage.unlikeAllLikedMatchCards([0, 2, 4]);
    });

    test('[Soccer] Guest can like and unlike matches', async ({ page }) => {
        test.fail(true, 'https://vincoholdinglp.atlassian.net/browse/NOS-17681');
        
        await test.step('Verify that favTab shows the count of liked matches', async () => {
            await expect(soccerListPage.favTab).toHaveText(`관심 경기 (${likedHrefs.length})`);
        });

        await test.step('Verify that likedMatchArea is visible after liking match', async () => {
            await expect(soccerListPage.likedMatchArea).toBeVisible();
        });

        await test.step('Verify that likedMatchCards is correct', async () => {
            for (const href of likedHrefs) {
                await expect(soccerListPage.likedMatchCards.locator(`a[href="${href}"]`).first()).toBeVisible();
            }
        });

        await test.step('Verify that likedMatchArea is shown in all tabs', async () => {
            const tabs = [soccerListPage.allTab, soccerListPage.favTab, soccerListPage.onGoingTab, soccerListPage.waitingTab, soccerListPage.endedTab];
            for (const tab of tabs) {
                await tab.click();
                await expect(soccerListPage.likedMatchArea).toBeVisible();
            }
        });

        await test.step('Verify that all liked matches are still visible after reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await expect(soccerListPage.likedMatchArea).toBeVisible();

            for (const href of likedHrefs) {
                await expect(soccerListPage.likedMatchCards.locator(`a[href="${href}"]`).first()).toBeVisible();
            }
        });
    });

    test('[Soccer] Guest liked matches are maintained after login', async ({ page }) => {
        await test.step('Login with valid account', async () => {
            const loginPage = new LoginPage(page);
            await loginPage.navigate();
            await loginPage.login(loginData.userB.email, loginData.userB.password);
            await expect(page).toHaveURL('/home');
            await soccerListPage.navigate();
        });

        await test.step('Verify that likedMatchArea is maintained in all tabs after login', async () => {
            const tabs = [soccerListPage.allTab, soccerListPage.favTab, soccerListPage.onGoingTab, soccerListPage.waitingTab, soccerListPage.endedTab];
            for (const tab of tabs) {
                await tab.click();
                await expect(soccerListPage.likedMatchArea).toBeVisible();
            }
        });

        await test.step('Verify that likedMatchCards is correct', async () => {
            for (const href of likedHrefs) {
                await expect(soccerListPage.likedMatchCards.locator(`a[href="${href}"]`).first()).toBeVisible();
            }
            await page.waitForTimeout(1000);
        });
    });
});

const roles = [
    { name: 'Normal User', storageState: 'playwright/.auth/user.json' },
    { name: 'Admin', storageState: 'playwright/.auth/admin.json' }
];
for (const role of roles) {
    test.describe(`${role.name} Flow`, () => {
        test.use({ storageState: role.storageState });

        test(`[Soccer] ${role.name} can like and unlike matches`, async ({ page, request, apiBaseURL }) => {
            const soccerListPage = new SoccerListPage(page);
            await soccerListPage.navigate();

            const cookies = await page.context().cookies();
            const sessionCookie = cookies.find(c => c.name === 'dev_session_id');
            const headers: Record<string, string> = sessionCookie ? { 'NAMED-SESSION': sessionCookie.value } : {};

            let likedHrefs: string[] = [];

            await test.step('Like matchCard number 1, 3, 5', async () => {
                likedHrefs = await soccerListPage.likeMatchCards([0, 2, 4]);
            });

            await test.step('Verify that likedMatchCards is correct on UI', async () => {
                for (const href of likedHrefs) {
                    await expect(soccerListPage.likedMatchCards.locator(`a[href="${href}"]`).first()).toBeVisible();
                }
            });

            await test.step('Verify that liked matches are saved in DB via API', async () => {
                const response = await request.get(`${apiBaseURL}/sport/interest-games?sports_ids=1`, { headers });
                expect(response.ok()).toBeTruthy();
                const body = await response.json();
                const responseGameIds = body.soccer || [];

                const gameIds = likedHrefs.map(href => parseInt(href.match(/\d+/g)!.pop()!));
                for (const id of gameIds) {
                    expect(responseGameIds).toContain(id);
                }
            });

            await test.step('Unlike all liked matches', async () => {
                await soccerListPage.unlikeAllLikedMatchCards();
            });

            await test.step('Verify that likedMatchArea is not visible on UI', async () => {
                await expect(soccerListPage.likedMatchArea).not.toBeVisible();
            });

            await test.step('Verify that liked matches are removed from DB via API', async () => {
                const response = await request.get(`${apiBaseURL}/sport/interest-games?sports_ids=1`, { headers });
                expect(response.ok()).toBeTruthy();
                const body = await response.json();
                const responseGameIds = body.soccer || [];

                const gameIds = likedHrefs.map(href => parseInt(href.match(/\d+/g)!.pop()!));
                for (const id of gameIds) {
                    expect(responseGameIds).not.toContain(id);
                }
            });
        });
    });
}