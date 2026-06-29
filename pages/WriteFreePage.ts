import {expect, Locator, Page} from '@playwright/test';
import { BasePage } from './BasePage';

export class WriteFreePage extends BasePage {
    readonly page:  Page;
    readonly titleInput: Locator;
    readonly contentInput: Locator;
    readonly boldBtn: Locator;
    readonly insertLnkBtn: Locator;
    readonly txtLnkInput: Locator;
    readonly lnkInput: Locator;
    readonly lnkInsertBtn: Locator;
    readonly emojiBtn: Locator;
    readonly writeBtn: Locator;
    readonly cancelBtn: Locator;
    readonly titleErrorMsg: Locator;
    readonly termsLnk: Locator;
    readonly prisonTermsLnk: Locator;
    readonly errorLnkMsg: Locator;
    readonly lnkPreview: Locator;
    readonly editLnkBtn: Locator;
    readonly updateLnkBtn: Locator;
    readonly lnkAttributeBtn: Locator;
    readonly toggleTabBtn: Locator;
    readonly removeLnkBtn: Locator;
    readonly uploadImgBtn: Locator;
    readonly insertImgBtn: Locator;
    readonly uploadImgSubBtn: Locator;
    readonly addImgLnkBtn: Locator;
    readonly imgLnkInput: Locator;
    readonly imgLnkInsertBtn: Locator;
    readonly closeAddImgLnkBtn: Locator;
    readonly cancelAddImgLnkBtn: Locator;
    readonly imgArea: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.titleInput = page.getByPlaceholder('글 제목을 입력해주세요.');
        this.contentInput = page.getByRole('textbox', {name: '리치 텍스트 편집기. 편집 영역: main'});
        this.boldBtn = page.getByRole('button', { name: '굵게' });
        this.insertLnkBtn = page.getByRole('button', { name: '링크' });
        this.txtLnkInput = page.getByRole('textbox', { name: '표시 텍스트' });
        this.lnkInput = page.getByRole('textbox', { name: '링크 주소' });
        this.lnkInsertBtn = page.getByText('삽입', { exact: true });
        this.emojiBtn = page.getByRole('button', { name: 'Emoji 28', exact: true });
        this.writeBtn = page.getByRole('button', { name: '글쓰기' });
        this.cancelBtn = page.getByText('취소', { exact: true });
        this.titleErrorMsg = page.getByText('제목을 입력해 주세요.', { exact: true });
        this.termsLnk = page.getByRole('link', { name: '이용약관' });
        this.prisonTermsLnk = page.getByRole('link', { name: '영창/수감규정' });
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
        this.imgLnkInsertBtn = page.getByText('삽입', { exact: true });
        this.closeAddImgLnkBtn = page.getByRole('button', { name: '닫기' });
        this.cancelAddImgLnkBtn = page.locator('button').filter({ hasText: '취소' }).last();
        this.imgArea = page.locator('figure:visible');
    }

    async navigate() {
        await this.page.goto('/community/create?boardType=free');
        await this.closeMainBannerIfPresent();
    }

    async enterTitle(title: string) {
        await this.titleInput.fill(title);
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
        await this.lnkInsertBtn.click();
    }

    async updateLink(text: string, url: string) {
        await this.insertLnkBtn.click();
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
        await this.imgLnkInsertBtn.click();
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
}