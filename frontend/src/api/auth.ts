// frontend/src/api/auth.ts
import { api } from './client';

export interface Token {
    access_token: string;
    token_type: string;
}

export interface User {
    username: string;
}

export const authApi = {
    login: async (username: string, password: string): Promise<Token> => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        const response = await api.post<Token>('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },
    getMe: async (): Promise<User> => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },
};
