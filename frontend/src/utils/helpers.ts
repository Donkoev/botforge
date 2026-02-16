// frontend/src/utils/helpers.ts
import dayjs from 'dayjs';

export const formatDate = (date: string | null) => {
    if (!date) return '-';
    return dayjs(date).format('DD.MM.YYYY HH:mm');
};
