import { test, expect } from '../../utils/fixtures';
import { MemberProfilePage } from '../../pages/MemberProfilePage';
import notiData from '../../data-test/member-profile-data/notifications-data.json';

test.describe('[Notification Popup]', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let memberProfilePage: MemberProfilePage;
    let mockData: any;

    test.beforeEach(async ({ page }) => {
        mockData = structuredClone(notiData);

        // Mock GET /me/notify/list
        await page.route('**/me/notify/list*', async route => {
            const headers = route.request().headers();
            if (headers['named-session']) {
                await route.fulfill({ json: mockData });
            } else {
                await route.continue();
            }
        });

        // Mock DELETE or other modifications
        await page.route('**/me/notify*', async route => {
            const request = route.request();
            const method = request.method();

            if (method === 'DELETE') {
                const url = new URL(request.url());
                const notifyId = url.searchParams.get('notify_id');
                const delType = url.searchParams.get('del_type');

                // Case 1: Delete by del_type ('all' or 'read')
                if (delType === 'all') {
                    mockData.list = [];
                    mockData.total_cnt = 0;
                }
                else if (delType === 'read') {
                    mockData.list = mockData.list.filter((item: any) => item.is_read !== 'Y');
                    mockData.total_cnt = mockData.list.length;
                }
                // Case 2: Delete by notify_id
                else if (notifyId) {
                    mockData.list = mockData.list.filter((item: any) => item.notify_id !== Number(notifyId));
                    mockData.total_cnt = mockData.list.length;
                }

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    json: { status: 200, message: "Success" }
                });
            } else {
                await route.fallback();
            }
        });

        // Mock PUT /me/notify/{notify_id} - mark notification as read
        await page.route('**/me/notify/*', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    json: { status: 200, message: 'Success' }
                });
            } else {
                await route.fallback();
            }
        });

        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
        await memberProfilePage.notificationPopupBtn.click();
        await expect(memberProfilePage.notificationPopup).toBeVisible();
    });

    test('Each notification is displayed normally', async () => {
        const firstItem = memberProfilePage.getNotiItemElements(0);
        await expect(firstItem.message).toHaveText('선물이 도착하였습니다.');
        await expect(firstItem.type).toHaveText('선물');
        await expect(firstItem.dateTime).toHaveText('2026-10-07 15:40:57');
        await expect(firstItem.deleteBtn).toBeVisible();
        await expect(firstItem.readDot).toHaveClass(/invisible/);
        await expect(firstItem.message).toHaveClass(/text-light-grey/);

        const secondItem = memberProfilePage.getNotiItemElements(1);
        await expect(secondItem.message).toHaveText('자유의 글에 댓글이 등록되었습니다.');
        await expect(secondItem.type).toHaveText('댓글');
        await expect(secondItem.dateTime).toHaveText('2026-09-15 16:22:09');
        await expect(secondItem.deleteBtn).toBeVisible();
        await expect(secondItem.readDot).toHaveClass(/visible/);
        await expect(secondItem.message).not.toHaveClass(/text-light-grey/);
    });

    test('User can delete read notification', async () => {
        await memberProfilePage.notiReadDelBtn.click();
        await expect(memberProfilePage.notificationPopup.getByText('선물이 도착하였습니다.')).toBeHidden();
        await expect(memberProfilePage.notificationPopup.getByText('자유의 글에 댓글이 등록되었습니다.')).toBeVisible();
    });

    test('User can delete all notification', async () => {
        await memberProfilePage.notiAllDelBtn.click();
        await expect(memberProfilePage.notificationPopup.getByText('선물이 도착하였습니다.')).toBeHidden();
        await expect(memberProfilePage.notificationPopup.getByText('자유의 글에 댓글이 등록되었습니다.')).toBeHidden();
        await expect(memberProfilePage.notificationPopup.getByText('알림 내역이 없습니다.')).toBeVisible();
    });

    test('User can delete a notification', async () => {
        const firstItem = memberProfilePage.getNotiItemElements(0);
        await firstItem.deleteBtn.click();
        await expect(memberProfilePage.notificationPopup.getByText('선물이 도착하였습니다.')).toBeHidden();
        await expect(memberProfilePage.notificationPopup.getByText('자유의 글에 댓글이 등록되었습니다.')).toBeVisible();
    });

    test('User can navigate to the post when clicking notification about comment', async ({ page }) => {
        const secondItemData = notiData.list[1];
        const secondItem = memberProfilePage.getNotiItemElements(1);
        await secondItem.message.click();
        await expect.soft(page).toHaveURL(`/community/free/${secondItemData.rel_id}`);
    });

    test('User can navigate to the post when clicking notification about reply comment', async ({ page }) => {
        const thirdItemData = notiData.list[2];
        const thirdItem = memberProfilePage.getNotiItemElements(2);
        await thirdItem.message.click();
        await expect(page).toHaveURL(`/community/free/${thirdItemData.rel_id}`)
    })
});