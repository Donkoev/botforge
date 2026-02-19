// frontend/src/utils/helpers.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const formatDate = (date: string | null) => {
    if (!date) return '-';
    return dayjs.utc(date).utcOffset(3).format('DD.MM.YYYY HH:mm');
};
