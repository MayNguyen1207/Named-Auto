import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function getExpectedRelativeTime(registeredTimeStr: string): string {
    const now = dayjs();
    const registeredTime = dayjs(registeredTimeStr);
    
    const diffInMinutes = now.diff(registeredTime, 'minute');
    const diffInHours = now.diff(registeredTime, 'hour');
    const diffInDays = now.diff(registeredTime, 'day');
    const diffInWeeks = now.diff(registeredTime, 'week');
    const diffInMonths = now.diff(registeredTime, 'month');
    const diffInYears = now.diff(registeredTime, 'year');

    if (diffInMinutes < 1) return '방금 전';
    if (diffInHours < 1) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;
    if (diffInMonths < 12) return `${diffInMonths}개월 전`;
    
    return `${diffInYears}년 전`;
}

export function getExpectedDetailTime(registeredTimeStr: string): string {
    return dayjs(registeredTimeStr).tz('Asia/Seoul').format('YYYY.MM.DD HH:mm');
}