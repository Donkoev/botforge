// frontend/src/api/users.ts
import { api } from './client';

export interface BotUser {
    id: number;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    language_code: string | null;
    source_bot_id: number;
    is_blocked: boolean;
    first_seen_at: string;
    last_seen_at: string;
}

export interface PaginatedUsers {
    users: BotUser[];
    total: number;
}

export const usersApi = {
    getAll: async (params: { page: number; limit: number; search?: string; bot_id?: number; }): Promise<PaginatedUsers> => {
        const response = await api.get<PaginatedUsers>('/users/', { params });
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};
