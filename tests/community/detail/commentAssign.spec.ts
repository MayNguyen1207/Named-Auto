import { test, expect } from '../../../utils/fixtures';
import { DetailFreePage } from '../../../pages/DetailFreePage';
import freePostData from '../../../data-test/free-post-data.json';

test.describe('Admin Flow', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('[Community] Admin can assign author to the comment', async ({ page }) => {
        const detailFreePage = new DetailFreePage(page);
        await detailFreePage.navigate(freePostData.postUrl.blockedPost);

        await detailFreePage.cmtAuthorPicker.scrollIntoViewIfNeeded();
        const authorName = await detailFreePage.selectFirstCmtAuthor();

        const commentContent = `Assigned Comment ${Date.now()}`;
        await detailFreePage.writeCmt(commentContent);
        await detailFreePage.verifyToastMsg("success", freePostData.cmtMsg.success);

        const cmtEl = detailFreePage.getCmtElementByText(commentContent);
        const actualAuthor = await cmtEl.authorLabel.textContent();
        expect(actualAuthor?.trim()).toBe(authorName);

        await cmtEl.deleteCmtBtn.click();
        await detailFreePage.dialogConfirmBtn.click();
        await detailFreePage.verifyToastMsg("success", freePostData.deleteCmtMsg.success);
    });
})