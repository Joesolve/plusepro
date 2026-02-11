'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; tenantId?: string }) => Promise<void>;
  logout: () => void;
  setAuth: (data: AuthResponse) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
          localStorage.setItem('pulsepro_token', data.accessToken);
          set({ token: data.accessToken, isLoading: false });
          await get().fetchProfile();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>('/auth/register', formData);
          localStorage.setItem('pulsepro_token', data.accessToken);
          set({ token: data.accessToken, isLoading: false });
          await get().fetchProfile();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('pulsepro_token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      setAuth: (data) => {
        localStorage.setItem('pulsepro_token', data.accessToken);
        set({ token: data.accessToken });
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get<User>('/auth/me');
          set({ user: data });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'pulsepro-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
