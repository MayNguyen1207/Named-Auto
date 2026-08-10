import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SoccerListPage extends BasePage {
    readonly page: Page;
    readonly allTab: Locator;
    readonly favTab: Locator;
    readonly onGoingTab: Locator;
    readonly waitingTab: Locator;
    readonly endedTab: Locator;

    readonly todayBtn: Locator;
    readonly previousDayBtn: Locator;
    readonly calendarBtn: Locator;
    readonly nextDayBtn: Locator;
    readonly reloadBtn: Locator;

    readonly soundBtn: Locator;
    readonly promptBtn: Locator;

    readonly searchInput: Locator;
    readonly clearBtn: Locator;
    readonly searchList: Locator;
    readonly searchLeagueGroup: Locator;
    readonly searchLeagueHeader: Locator;
    readonly searchLeagueResults: Locator;
    readonly searchTeamGroup: Locator;
    readonly searchTeamHeader: Locator;
    readonly searchTeamResults: Locator;
    readonly noResultTxt: Locator;

    readonly horizontalBtn: Locator;
    readonly verticalBtn: Locator;

    readonly calendarModal: Locator;
    readonly monthTxt: Locator;
    readonly previousMonthBtn: Locator;
    readonly nextMonthBtn: Locator;
    readonly calendarTodayBtn: Locator;
    readonly dayCell: Locator;
    readonly yearBtn: Locator;
    readonly yearList: Locator;
    readonly yearOption: Locator;

    readonly firstLeagueHeader: Locator;
    readonly leagueHeaders: Locator;
    readonly matchCards: Locator;
    readonly broadCastContainer: Locator;

    readonly adminOpenMatchBtn: Locator;
    readonly adminCasterBtn: Locator;

    readonly likedMatchArea: Locator;
    readonly likedMatchCards: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.allTab = page.getByRole('button', { name: '전체' });
        this.favTab = page.getByRole('button', { name: '관심 경기' });
        this.onGoingTab = page.getByRole('button', { name: '진행 중' });
        this.waitingTab = page.getByRole('button', { name: '대기 중' });
        this.endedTab = page.getByRole('button', { name: '종료 경기' });

        this.todayBtn = page.getByRole('button', { name: '오늘' });
        this.previousDayBtn = page.getByRole('button', { name: 'Previous day' });
        this.calendarBtn = page.getByRole('button', { name: '달력' });
        this.nextDayBtn = page.getByRole('button', { name: 'Next day' });
        this.reloadBtn = page.getByRole('button', { name: 'Reload' });

        this.soundBtn = page.getByText('사운드', { exact: true }).first();
        this.promptBtn = page.locator('#main-content').getByText('프롬프트', { exact: true });

        this.searchInput = page.getByRole('textbox', { name: '팀이나 리그를 검색해 주세요.' });
        this.clearBtn = page.getByRole('button', { name: 'Clear' });
        this.searchList = page.getByTestId('search-list');
        this.searchLeagueGroup = this.searchList.locator('> div').filter({ hasText: '리그' });
        this.searchLeagueHeader = this.searchLeagueGroup.locator('> div').first();
        this.searchLeagueResults = this.searchLeagueGroup.locator('> div.cursor-pointer');
        this.searchTeamGroup = this.searchList.locator('> div').filter({ hasText: '팀' });
        this.searchTeamHeader = this.searchTeamGroup.locator('> div').first();
        this.searchTeamResults = this.searchTeamGroup.locator('> div.cursor-pointer');
        this.noResultTxt = page.getByText('검색 결과가 없습니다.', { exact: true });

        this.horizontalBtn = page.getByRole('button', { name: '수평' }).locator('visible=true');
        this.verticalBtn = page.getByRole('button', { name: '수직' }).locator('visible=true');

        this.calendarModal = page.getByTestId('calendar-root');
        this.monthTxt = this.calendarModal.getByTestId('calendar-current-month');
        this.previousMonthBtn = this.calendarModal.getByTestId('calendar-previous-month');
        this.nextMonthBtn = this.calendarModal.getByTestId('calendar-next-month');
        this.calendarTodayBtn = this.calendarModal.getByRole('button', { name: '오늘' });
        this.dayCell = this.calendarModal.getByRole('gridcell');
        this.yearBtn = this.calendarModal.getByRole('button', { name: /년/ });
        this.yearList = page.locator('div.year-selector');
        this.yearOption = this.yearList.locator('button');

        this.firstLeagueHeader = page.getByTestId('virtuoso-top-item-list')
        this.leagueHeaders = page.locator('div[data-index]:not([data-item-group-index])');
        this.matchCards = page.locator('div[data-item-group-index]');
        this.broadCastContainer = page.getByTestId('broadcast-content');

        this.adminOpenMatchBtn = page.getByTestId('open-new-tab-button');
        this.adminCasterBtn = page.getByRole('button', { name: 'Caster' });

        this.likedMatchArea = page.locator(".mb-1[data-testid='accordion-root']");
        this.likedMatchCards = page.locator('.overflow-hidden .bg-primary-foreground');
    }

    async navigate() {
        await this.page.goto('/scorecenter/soccer');
        await this.page.locator('.skeleton-loader').first().waitFor({ state: 'attached', timeout: 1000 }).catch(() => {});
        await expect(this.page.locator('.skeleton-loader')).toHaveCount(0, { timeout: 10000 });
    }

    extractGames(body: any): any[] {
        return body.data ?? (Array.isArray(body) ? body : (body.value ?? []));
    }

    async verifyTabMatchCounts(games: any[]) {
        const all = games.length;
        const onGoing = games.filter(g => g.gameStatus === 'IN_PROGRESS' || g.gameStatus === 'BREAK_TIME').length;
        const waiting = games.filter(g => g.gameStatus === 'READY').length;
        const ended = games.filter(g => ['FINAL', 'POSTPONED', 'CANCEL', 'CUT'].includes(g.gameStatus)).length;

        await expect(this.allTab).toHaveText(`전체 (${all})`);
        await expect(this.onGoingTab).toHaveText(`진행 중(${onGoing})`);
        await expect(this.waitingTab).toHaveText(`대기 중(${waiting})`);
        await expect(this.endedTab).toHaveText(`종료 경기 (${ended})`);
    }

    async openCalendar() {
        await expect(async () => {
            await this.calendarBtn.click();
            await expect(this.calendarModal).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
    }

    /** Sum scores for periods 1-4 (regular + extra time). */
    computeMainScore(periodData: any[] | null | undefined): number {
        if (!periodData?.length) return 0;
        return periodData
            .filter(p => p.period >= 1 && p.period <= 4)
            .reduce((sum, p) => sum + (p.score ?? 0), 0);
    }

    /** Returns period-5 (penalty) score, or null when there is no penalty period. */
    getPenaltyScore(periodData: any[] | null | undefined): number | null {
        if (!periodData?.length) return null;
        const p5 = periodData.find(p => p.period === 5);
        return p5 != null ? (p5.score ?? null) : null;
    }

    /**
     * Returns the text the UI should display for the match status.
     * For IN_PROGRESS the minute is calculated at call time, so call this as close to the assertion as possible and allow ±2 min tolerance.
     */
    getExpectedMatchStatusText(game: any): string {
        switch (game.gameStatus) {
            case 'FINAL': return '종료';
            case 'POSTPONED': return '연기';
            case 'CANCEL': return '취소';
            case 'CUT': return '중단';
            case 'PENDING': return '중단';
            case 'BREAK_TIME': return 'HT';
            case 'READY': {
                if (!game.realStartDateTime) return '대기 중';
                // realStartDateTime is in KST (Seoul, UTC+9)
                const realStart = new Date(game.realStartDateTime + '+09:00');
                const remainingMs = realStart.getTime() - Date.now();
                if (remainingMs <= 0) return '대기 중';
                const totalSec = Math.ceil(remainingMs / 1_000);
                const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
                const ss = String(totalSec % 60).padStart(2, '0');
                return `${mm}:${ss}`;
            }
            case 'IN_PROGRESS': {
                if (!game.realStartDateTime) return '';
                // realStartDateTime is in KST (Seoul, UTC+9)
                const realStart = new Date(game.realStartDateTime + '+09:00');
                const elapsedMin = Math.floor((Date.now() - realStart.getTime()) / 60_000);

                if (game.period === 1) {
                    return elapsedMin > 45 ? "45'+" : `${elapsedMin}'`;
                } else if (game.period === 2) {
                    return elapsedMin > 45 ? "90'+" : `${elapsedMin + 45}'`;
                } else if (game.period === 3 || game.period === 4) {
                    return '연장';
                } else if (game.period === 5) {
                    return '승부차기';
                }

                return elapsedMin >= 90 ? "90'+" : `${elapsedMin}'`;
            }
            default: return '';
        }
    }

    getMatchCardElements(cardElement: Locator) {
        return {
            matchTime: cardElement.getByTestId('match-time'),
            matchChatCount: cardElement.getByTestId('match-chat-number'),
            matchEvent: cardElement.locator('div.bg-light-grey'),

            homeTeam: cardElement.getByTestId('home-team'),
            homeTeamLogo: cardElement.getByRole('img', { name: 'Home team logo' }),
            homeTeamRank: cardElement.getByTestId('home-team-rank'),
            homeTeamMainScore: cardElement.getByTestId('home-team-result').locator('> div').last(),
            homeTeamPenaltyScore: cardElement.getByTestId('home-team-result').locator('span.absolute.text-xxs\\!.items-end'),

            awayTeam: cardElement.getByTestId('away-team'),
            awayTeamLogo: cardElement.getByRole('img', { name: 'Away team logo' }),
            awayTeamRank: cardElement.getByTestId('away-team-rank'),
            awayTeamMainScore: cardElement.getByTestId('away-team-result').locator('> div').first(),
            awayTeamPenaltyScore: cardElement.getByTestId('away-team-result').locator('span.absolute.text-xxs\\!.items-end'),

            matchStatus: cardElement.getByTestId('match-status'),
            playBtn: cardElement.getByRole('button', { name: 'Play livestream' }),
            favBtn: cardElement.getByRole('button', { name: 'Add to favorite' }),
            removeFavBtn: cardElement.getByRole('button', { name: 'Remove from favorite' }),
            broadCastBtn: cardElement.getByTestId('broadcast-button'),
            openMatchBtn: cardElement.getByTestId('open-new-tab-button'),

            threeDotsBtn: cardElement.getByTestId('3-dots-button')
        };
    }

    async likeMatchCards(indices: number[]): Promise<string[]> {
        const likedHrefs: string[] = [];
        for (const index of indices) {
            const card = this.matchCards.nth(index);
            const href = await card.locator('a').first().getAttribute('href');
            likedHrefs.push(href!);
            const { favBtn, removeFavBtn } = this.getMatchCardElements(card);
            await favBtn.click();
            await expect(removeFavBtn).toBeVisible();
            await expect(favBtn).not.toBeVisible();
        }
        return likedHrefs;
    }

    async unlikeAllLikedMatchCards(verifyIndices: number[] = []) {
        await this.allTab.click();
        const count = await this.likedMatchCards.count();

        for (let i = 0; i < count; i++) {
            const { removeFavBtn } = this.getMatchCardElements(this.likedMatchCards.first());
            await removeFavBtn.click({ delay: 600 });
            await expect(this.likedMatchCards).toHaveCount(count - i - 1);
        }

        await expect(this.likedMatchArea).not.toBeVisible();

        for (const index of verifyIndices) {
            const card = this.matchCards.nth(index);
            const { favBtn, removeFavBtn } = this.getMatchCardElements(card);
            await expect(favBtn).toBeVisible();
            await expect(removeFavBtn).not.toBeVisible();
        }
    }

    getMockHelpers() {
        const nowMs = Date.now();
        const toKSTString = (ms: number) => {
            const date = new Date(ms + 9 * 60 * 60 * 1000);
            return date.toISOString().replace('Z', '');
        };

        const baseGame = {
            sportsType: 'SOCCER',
            startDatetime: toKSTString(nowMs + 3 * 60 * 60 * 1000),
            realStartDateTime: null,
            venueName: null,
            result: 'UNKNOWN',
            period: null,
            displayTime: null,
            videoLink: null,
            hasLineup: false,
            oddsFlag: false,
            boardFlag: false,
            cheerCount: 0,
            league: { id: 1, name: 'Mock League', shortName: 'ML', abbereviation: 'ML', color: '000000', nation: null, important: false },
            season: { id: 1, name: 'Mock Season', shortName: '2026' },
            broadcast: { score: { home: 0, away: 0 }, playText: null, locationType: null, eventType: null, displayTime: null, period: null },
        };

        const mkTeam = (name: string, idx: number, periodData: any[] = []) => ({
            id: idx,
            name,
            shortName: name,
            imgPath: null,
            periodData,
            seasonTeamRanking: null,
            performance: null,
        });

        return { nowMs, toKSTString, baseGame, mkTeam };
    }
}