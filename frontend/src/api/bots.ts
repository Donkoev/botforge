// frontend/src/api/bots.ts
import { api } from './client';

export interface Bot {
    id: number;
    name: string;
    bot_username: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    display_order: number;
}

export interface MessageTemplate {
    id: number;
    bot_id: number;
    language_code: string;
    text: string;
    buttons: Array<{ text: string; url: string }>;
}

export const botsApi = {
    getAll: async (): Promise<Bot[]> => {
        const response = await api.get<Bot[]>('/bots/');
        return response.data;
    },
    getOne: async (id: number): Promise<Bot> => {
        const response = await api.get<Bot>(`/bots/${id}`);
        return response.data;
    },
    create: async (data: { name: string; token: string }): Promise<Bot> => {
        const response = await api.post<Bot>('/bots/', data);
        return response.data;
    },
    update: async (id: number, data: { name?: string; is_active?: boolean }): Promise<Bot> => {
        const response = await api.patch<Bot>(`/bots/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/bots/${id}`);
    },
    start: async (id: number): Promise<void> => {
        await api.post(`/bots/${id}/start`);
    },
    stop: async (id: number): Promise<void> => {
        await api.post(`/bots/${id}/stop`);
    },
    reorder: async (items: { id: number; display_order: number }[]): Promise<void> => {
        await api.post('/bots/reorder', items);
    },
    // Templates
    getTemplates: async (botId: number): Promise<MessageTemplate[]> => {
        const response = await api.get<MessageTemplate[]>(`/bots/${botId}/messages/`);
        return response.data;
    },
    createTemplate: async (botId: number, data: any): Promise<MessageTemplate> => {
        const response = await api.post<MessageTemplate>(`/bots/${botId}/messages/`, data);
        return response.data;
    },
    updateTemplate: async (botId: number, msgId: number, data: any): Promise<MessageTemplate> => {
        const response = await api.patch<MessageTemplate>(`/bots/${botId}/messages/${msgId}`, data);
        return response.data;
    },
    deleteTemplate: async (botId: number, msgId: number): Promise<void> => {
        await api.delete(`/bots/${botId}/messages/${msgId}`);
    },
};
