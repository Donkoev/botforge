// frontend/src/api/broadcast.ts
import { api } from './client';

export interface Broadcast {
    id: number;
    title: string;
    text: string;
    media_type: string | null;
    media_file_id: string | null;
    buttons: any[];
    target_bots: number[];
    status: 'draft' | 'sending' | 'completed' | 'cancelled';
    total_users: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
}

export const broadcastApi = {
    getAll: async (): Promise<Broadcast[]> => {
        const response = await api.get<Broadcast[]>('/broadcasts/');
        return response.data;
    },
    getOne: async (id: number): Promise<Broadcast> => {
        const response = await api.get<Broadcast>(`/broadcasts/${id}`);
        return response.data;
    },
    create: async (data: any): Promise<Broadcast> => {
        const response = await api.post<Broadcast>('/broadcasts/', data);
        return response.data;
    },
    start: async (id: number): Promise<void> => {
        await api.post(`/broadcasts/${id}/start`);
    },
    cancel: async (id: number): Promise<void> => {
        await api.post(`/broadcasts/${id}/cancel`);
    },
};

