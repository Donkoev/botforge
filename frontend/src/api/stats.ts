// frontend/src/api/stats.ts
import { api } from './client';

export interface StatsOverview {
    total_users: number;
    new_today: number;
    new_week: number;
    active_bots: number;
}

export interface DailyStat {
    date: string;
    count: number;
}

export const statsApi = {
    getOverview: async (): Promise<StatsOverview> => {
        const response = await api.get<StatsOverview>('/stats/overview');
        return response.data;
    },
    getDaily: async (days = 30): Promise<DailyStat[]> => {
        const response = await api.get<DailyStat[]>('/stats/daily', { params: { days } });
        return response.data;
    },
};
