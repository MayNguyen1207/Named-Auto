import { test, expect } from '../../utils/fixtures';
import { MemberProfilePage } from '../../pages/MemberProfilePage';
import memoData from '../../data-test/member-profile-data/memo-data.json';

test.describe('[Memo Popup]', async () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let memberProfilePage: MemberProfilePage;
    let mockData: any;

    test.beforeEach(async ({ page }) => {
        mockData = structuredClone(memoData.defaultList);

        // Mock GET /memo
        await page.route('**/memo*type=recv*', async route => {
            const headers = route.request().headers();
            if (headers['named-session']) {
                await route.fulfill({ json: mockData });
            } else {
                await route.continue();
            }
        });

        // Mock POST /memo/delete
        await page.route('**/memo/delete*', async route => {
            const request = route.request();
            const method = request.method();
            const headers = request.headers();

            if (method === 'POST' && headers['named-session']) {
                let deleteType: string | null = null;
                let meIds: number[] = [];

                const contentType = headers['content-type'] || '';
                const bodyText = request.postData() || '';

                if (contentType.includes('application/json')) {
                    const body = JSON.parse(bodyText);
                    deleteType = body.delete_type ?? null;
                    meIds = (body.me_ids ?? []).map(Number);
                } else {
                    const params = new URLSearchParams(bodyText);
                    deleteType = params.get('delete_type');
                    meIds = params.getAll('me_ids').concat(params.getAll('me_ids[]'))
                        .flatMap(v => v.split(',')).map(Number);
                }

                // Case 1: Delete all (except memo contains unreceived item: me_get_yn === 'N')
                if (deleteType === 'all') {
                    mockData.list = mockData.list.filter((item: any) => item.me_get_yn === 'N');
                    mockData.total_cnt = mockData.list.length;
                }
                // Case 2: Delete read (keep unread + unreceived gift items: me_get_yn === 'N')
                else if (deleteType === 'read') {
                    mockData.list = mockData.list.filter((item: any) => item.is_read === false || item.me_get_yn === 'N');
                    mockData.total_cnt = mockData.list.length;
                }
                // Case 3: Delete by id
                else if (deleteType === 'id') {
                    mockData.list = mockData.list.filter((item: any) => !meIds.includes(Number(item.me_id)));
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

        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
        await memberProfilePage.memoPopupBtn.click();
        await expect(memberProfilePage.memoPopup).toBeVisible();
    });

    test('Each memo is displayed normally', async () => {
        const typeMap: Record<string, string> = {
            '1': '일반',
            '2': '아이템',
            '3': '랜덤',
            '4': '기타',
            '5': '건빵',
            '88': '게시판',
            '99': '무료 답장'
        };

        const canDelete = (d: any): boolean => {
            if (!d.is_read) return false;
            if (d.memo_reward_type === 'ITEM') return d.me_get_yn === 'Y';
            if (['POINT', 'MEDAL', 'EXP'].includes(d.memo_reward_type) && Number(d.me_get_point) > 0) {
                return d.me_get_yn === 'Y';
            }
            return true;
        };

        await memberProfilePage.memoItemsList.locator('[data-index="0"]').waitFor({ state: 'attached' });

        for (let i = 0; i < memoData.defaultList.list.length; i++) {
            const data = memoData.defaultList.list[i];

            await test.step(`Check memo item #${i + 1} (me_id=${data.me_id})`, async () => {
                const item = memberProfilePage.getMemoItemElements(i);

                const itemLocator = memberProfilePage.memoItemsList.locator(`[data-index="${i}"]`);
                if (await itemLocator.count() === 0) {
                    const scroller = memberProfilePage.memoPopup.getByTestId('virtuoso-scroller');
                    for (let attempt = 0; attempt < 10; attempt++) {
                        if (await itemLocator.count() > 0) break;
                        await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
                        await memberProfilePage.page.waitForTimeout(300);
                    }
                    await itemLocator.waitFor({ state: 'attached' });
                }

                const expectedMessage = data.memosub ? data.memosub : data.me_memo;
                await expect(item.message).toHaveText(expectedMessage);

                await expect(item.sender).toHaveText(data.sender_nick);

                // https://vincoholdinglp.atlassian.net/browse/NOS-22933
                // const expectedType = typeMap[data.memo_type];
                // await expect(item.type).toHaveText(expectedType);

                await expect(item.dateTime).toHaveText(data.me_send_datetime.split(' ')[0]);

                if (canDelete(data)) {
                    await expect(item.deleteBtn).toBeVisible();
                } else {
                    await expect(item.deleteBtn).toBeHidden();
                }

                if (!['1', '3', '7'].includes(data.me_id)) {
                    await expect(item.readDot).toHaveClass(/visible/);
                    await expect(item.message).not.toHaveClass(/text-light-grey/);
                } else {
                    await expect(item.readDot).toHaveClass(/invisible/);
                    await expect(item.message).toHaveClass(/text-light-grey/);
                }
            });
        }
    });

    test('User can delete read memo', async () => {
        await memberProfilePage.memoReadDelBtn.click();
        for (const data of memoData.defaultList.list) {
            const message = data.memosub ? data.memosub : data.me_memo;
            const isDeleted = data.is_read === true && data.me_get_yn !== 'N';
            if (isDeleted) {
                await expect(memberProfilePage.memoPopup.getByText(message)).toBeHidden();
            } else {
                await expect(memberProfilePage.memoPopup.getByText(message)).toBeVisible();
            }
        }
    });

    test('User can delete all memos', async () => {
        await memberProfilePage.memoAllDelBtn.click();
        for (const data of memoData.defaultList.list) {
            const message = data.memosub ? data.memosub : data.me_memo;
            if (['1', '2', '3', '6', '7'].includes(data.me_id)) {
                await expect(memberProfilePage.memoPopup.getByText(message)).toBeHidden();
            } else {
                await expect(memberProfilePage.memoPopup.getByText(message)).toBeVisible();
            }
        }
    });

    test('User can delete a memo', async () => {
        const firstItem = memberProfilePage.getMemoItemElements(0);
        await firstItem.deleteBtn.click();

        const firstItemData = memoData.defaultList.list[0];
        const secondItemData = memoData.defaultList.list[1];

        const firstMessage = firstItemData.memosub ? firstItemData.memosub : firstItemData.me_memo;
        const secondMessage = secondItemData.memosub ? secondItemData.memosub : secondItemData.me_memo;

        await expect(memberProfilePage.memoPopup.getByText(firstMessage)).toBeHidden();
        await expect(memberProfilePage.memoPopup.getByText(secondMessage)).toBeVisible();
    });

    test('User can open a memo', async ({ page }) => {
        const firstItemData = memoData.defaultList.list[0];
        const firstItem = memberProfilePage.getMemoItemElements(0);
        await firstItem.message.click();
        await expect(page).toHaveURL(`/memo/received/${firstItemData.me_id}`);
    });
});

test.describe('[Memo Popup] Navigation button', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    let memberProfilePage: MemberProfilePage;

    test.beforeEach(async ({ page }) => {
        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
        await memberProfilePage.memoPopupBtn.click();
        await expect(memberProfilePage.memoPopup).toBeVisible();
    });

    const navTests = [
        { name: 'Recieved Memo Box', getBtn: (p: MemberProfilePage) => p.memoRecievedBoxBtn, url: '/memo/received' },
        { name: 'Sent Memo Box', getBtn: (p: MemberProfilePage) => p.memoSentBoxBtn, url: '/memo/sent' },
        { name: 'Write Memo screen', getBtn: (p: MemberProfilePage) => p.memoWriteBtn, url: '/memo/write' }
    ];

    for (const { name, getBtn, url } of navTests) {
        test(`User can navigate to ${name}`, async ({ page }) => {
            await getBtn(memberProfilePage).click();
            await expect(page).toHaveURL(url);
        });
    }
});

test.describe('[Memo Popup] Prisoner', () => {
    test.use({ storageState: 'playwright/.auth/prisoner.json' });

    let memberProfilePage: MemberProfilePage;
    let mockData: any;

    test.beforeEach(async ({ page }) => {
        mockData = structuredClone(memoData.emptyList);

        // Mock GET /memo
        await page.route('**/memo*type=recv*', async route => {
            const headers = route.request().headers();
            if (headers['named-session']) {
                await route.fulfill({ json: mockData });
            } else {
                await route.continue();
            }
        });

        memberProfilePage = new MemberProfilePage(page);
        await memberProfilePage.navigateHome();
        await memberProfilePage.memoPopupBtn.click();
        await expect(memberProfilePage.memoPopup).toBeVisible();
    });

    test('Empty list text should be displayed', async () => {
        await expect(memberProfilePage.memoPopup.getByText('쪽지 내역이 없습니다.')).toBeVisible();
    })

    test('Prisoner cannot open Write memo screen', async ({ page }) => {
        await memberProfilePage.memoWriteBtn.click();
        await expect(page).toHaveURL('/memo/write');
        await expect(memberProfilePage.noticeDialog).toBeVisible();
        await expect(memberProfilePage.noticeDialog).toContainText(
            /전과로 인해 \d{4}년 \d{1,2}월 \d{1,2}일 까지 쪽지를 발송할 수 없습니다/
        );
    })
})