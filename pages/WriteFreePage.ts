import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class WriteFreePage extends BasePage {
    readonly page: Page;
    readonly boExplainText: Locator;
    readonly boExplainLnk: Locator;
    readonly titleInput: Locator;
    readonly contentInput: Locator;
    readonly boldBtn: Locator;
    readonly emojiBtn: Locator;
    readonly writeBtn: Locator;
    readonly cancelBtn: Locator;
    readonly titleErrorMsg: Locator;
    readonly termsLnk: Locator;
    readonly prisonTermsLnk: Locator;

    // Shared Dialog Buttons
    readonly dialogInsertBtn: Locator;
    readonly dialogCloseBtn: Locator;
    readonly dialogCancelBtn: Locator;

    readonly seeMoreBtn: Locator;
    //Insert Link related locator
    readonly insertLnkBtn: Locator;
    readonly txtLnkInput: Locator;
    readonly lnkInput: Locator;
    readonly errorLnkMsg: Locator;
    readonly lnkPreview: Locator;
    readonly editLnkBtn: Locator;
    readonly updateLnkBtn: Locator;
    readonly lnkAttributeBtn: Locator;
    readonly toggleTabBtn: Locator;
    readonly removeLnkBtn: Locator;

    //Insert image related locator
    readonly uploadImgBtn: Locator;
    readonly insertImgBtn: Locator;
    readonly uploadImgSubBtn: Locator;
    readonly addImgLnkBtn: Locator;
    readonly imgLnkInput: Locator;
    readonly imgArea: Locator;
    readonly addAltTxtBtn: Locator;
    readonly altTxtInput: Locator;
    readonly saveAltTxtBtn: Locator;
    readonly addLnkForImgBtn: Locator;

    //Insert video related button
    readonly videoMenuBtn: Locator;
    readonly insertVideoLnkBtn: Locator;
    readonly videoLnkInput: Locator;
    readonly uploadVideoBtn: Locator;

    //Admin - Author picker
    readonly authorPickerTrigger: Locator;
    readonly authorCommandRoot: Locator;
    readonly authorSearchInput: Locator;
    readonly authorItem: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.boExplainText = page.locator('section[aria-label="bo_explain_text"]');
        this.boExplainLnk = this.boExplainText.locator('a[target="_blank"]');
        this.titleInput = page.getByPlaceholder('글 제목을 입력해주세요.');
        this.contentInput = page.getByRole('textbox', { name: '리치 텍스트 편집기. 편집 영역: main' });
        this.boldBtn = page.getByRole('button', { name: '굵게' });
        this.emojiBtn = page.getByRole('button', { name: 'Emoji 28', exact: true });
        this.writeBtn = page.getByRole('button', { name: '글쓰기' });
        this.cancelBtn = page.getByText('취소', { exact: true });
        this.titleErrorMsg = page.getByText('제목을 입력해 주세요.', { exact: true });
        this.termsLnk = page.getByRole('link', { name: '이용약관' });
        this.prisonTermsLnk = page.getByRole('link', { name: '영창/수감규정' });

        this.dialogInsertBtn = page.getByText('삽입', { exact: true });
        this.dialogCloseBtn = page.getByRole('button', { name: '닫기' });
        this.dialogCancelBtn = page.locator('button').filter({ hasText: '취소' }).last();

        this.seeMoreBtn = page.locator('[data-cke-tooltip-text="더보기"]');
        this.insertLnkBtn = page.getByRole('button', { name: '링크' });
        this.txtLnkInput = page.getByRole('textbox', { name: '표시 텍스트' });
        this.lnkInput = page.getByRole('textbox', { name: '링크 주소' });
        this.errorLnkMsg = page.getByText('링크 URL은 비워둘 수 없습니다.', { exact: true })
        this.lnkPreview = page.locator('a.ck-link-actions__preview, a.ck-button.ck-link-toolbar__preview');
        this.editLnkBtn = page.getByRole('button', { name: '링크 편집' });
        this.updateLnkBtn = page.getByRole('button', { name: '업데이트' });
        this.lnkAttributeBtn = page.getByRole('button', { name: '링크 속성' });
        this.toggleTabBtn = page.getByRole('button', { name: '새 탭에서 열기' });
        this.removeLnkBtn = page.getByRole('button', { name: '링크 삭제' });

        this.uploadImgBtn = page.getByRole('button', { name: '컴퓨터에서 이미지 업로드' });
        this.insertImgBtn = page.getByRole('button', { name: '사진 삽입' })
        this.uploadImgSubBtn = page.getByRole('button', { name: '컴퓨터에서 업로드' });
        this.addImgLnkBtn = page.getByRole('button', { name: 'URL 버튼으로 이미지 삽입' });
        this.imgLnkInput = page.getByRole('textbox', { name: 'URL로 이미지 삽입' });
        this.imgArea = page.locator('figure.image');
        this.addAltTxtBtn = page.getByRole('button', { name: '대체 문구 변경' });
        this.altTxtInput = page.getByRole('textbox', { name: '대체 문구' });
        this.saveAltTxtBtn = page.getByRole('button', { name: '저장' });
        this.addLnkForImgBtn = page.getByRole('button', { name: '사진 링크' });

        this.videoMenuBtn = page.getByRole('button', { name: '동영상', exact: true });
        this.insertVideoLnkBtn = page.getByRole('button', { name: '미디어 삽입' });
        this.videoLnkInput = page.getByRole('textbox', { name: '미디어 URL' });
        this.uploadVideoBtn = page.locator('button.ck-file-dialog-button[data-cke-tooltip-text="동영상 업로드"]');

        this.authorPickerTrigger = page.getByTestId('community-comment-author-selection');
        this.authorCommandRoot = page.getByTestId('command-root');
        this.authorSearchInput = this.authorCommandRoot.getByTestId('command-input-wrapper');
        this.authorItem = this.authorCommandRoot.getByTestId('command-item');
    }

    async navigate() {
        await this.page.goto('/community/create?boardType=free');
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => {});
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    async enterTitle(title: string) {
        await this.titleInput.pressSequentially(title);
        await this.page.waitForTimeout(2000);
        if ((await this.titleInput.inputValue()) === '') {
            await this.titleInput.fill(title);
        }
    }

    async enterContent(content: string) {
        await this.contentInput.click();
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            await this.contentInput.pressSequentially(lines[i]);
            if (i < lines.length - 1) {
                await this.page.keyboard.press('Enter');
            }
        }
    }

    async writePost(title: string, content: string) {
        await this.enterTitle(title);
        await this.enterContent(content);
    }

    async insertLink(text: string, url: string) {
        await this.insertLnkBtn.click();
        await this.txtLnkInput.fill(text);
        await this.lnkInput.fill(url);
        await this.dialogInsertBtn.click();
    }

    async updateLink(text: string, url: string) {
        await this.txtLnkInput.fill(text);
        await this.lnkInput.fill(url);
        await this.updateLnkBtn.click();
    }

    async uploadImage(button: Locator, filePath: string) {
        const fileChooserPromise = this.page.waitForEvent('filechooser');
        await button.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);
    }

    async uploadImageFromMainButton(filePath: string) {
        await this.uploadImage(this.uploadImgBtn, filePath);
    }

    async uploadImageFromSubButton(filePath: string) {
        await this.insertImgBtn.click();
        await this.uploadImage(this.uploadImgSubBtn, filePath);
    }

    async insertImageByUrl(url: string) {
        await this.insertImgBtn.click();
        await this.addImgLnkBtn.click();
        await this.imgLnkInput.fill(url);
        await this.dialogInsertBtn.click();
    }

    async insertVideoByUrl(url: string) {
        await this.videoMenuBtn.click();
        await this.insertVideoLnkBtn.click();
        await this.videoLnkInput.fill(url);
        await this.dialogInsertBtn.click();
    }

    async uploadVideoFile(filePath: string) {
        await this.videoMenuBtn.click();
        const fileChooserPromise = this.page.waitForEvent('filechooser');
        await this.uploadVideoBtn.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);
    }

    async pasteVideoEmbedCode(embedCode: string) {
        await this.contentInput.click();
        await this.page.evaluate((text) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', text);
            document.activeElement?.dispatchEvent(
                new ClipboardEvent('paste', {
                    clipboardData: dataTransfer,
                    bubbles: true,
                    cancelable: true,
                })
            );
        }, embedCode);
    }


    async addImgAltTxt(altTxt: string) {
        await this.addAltTxtBtn.click();
        await this.altTxtInput.fill(altTxt);
        await this.saveAltTxtBtn.click();
    }

    async addImgLnk(url: string) {
        await this.addLnkForImgBtn.click();
        await this.lnkInput.fill(url);
        await this.dialogInsertBtn.click();
    }

    async clickTermsLnk() {
        const newPagePromise = this.page.context().waitForEvent('page');
        await this.termsLnk.click();
        return await newPagePromise;
    }

    async clickPrisonTermsLnk() {
        const newPagePromise = this.page.context().waitForEvent('page');
        await this.prisonTermsLnk.click();
        return await newPagePromise;
    }

    async selectFirstAuthor(): Promise<string> {
        await this.authorPickerTrigger.click();
        await expect(this.authorCommandRoot).toBeVisible();
        const firstItem = this.authorItem.first();
        const fullText = (await firstItem.textContent())?.trim() ?? '';
        const authorName = fullText.split('(')[0].trim();
        await firstItem.click();
        return authorName;
    }

    async searchAuthor(keyword: string) {
        await this.authorPickerTrigger.click();
        await this.authorSearchInput.fill(keyword);
    }
}
