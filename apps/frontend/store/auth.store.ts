'use client';

import { create } from 'zustand';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserPublic,
  UserRole,
} from '@martillo/shared';
import { apiClient, configureApiAuth } from '@/lib/api';

type AuthState = {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  setUser: (user: UserPublic | null) => void;
};

function setAuthFlagCookie(active: boolean): void {
  if (typeof document === 'undefined') return;
  if (active) {
    document.cookie = 'martillo_auth=1; path=/; max-age=604800; samesite=lax';
    return;
  }
  document.cookie = 'martillo_auth=; path=/; max-age=0; samesite=lax';
}

function setRoleCookie(role: UserRole | null): void {
  if (typeof document === 'undefined') return;
  if (role) {
    document.cookie = `martillo_role=${role}; path=/; max-age=604800; samesite=lax`;
    return;
  }
  document.cookie = 'martillo_role=; path=/; max-age=0; samesite=lax';
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  async login(payload) {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/login',
        payload,
      );

      set({
        user: response.data.data.user,
        accessToken: response.data.data.accessToken,
        isAuthenticated: true,
      });
      setAuthFlagCookie(true);
      setRoleCookie(response.data.data.user.role);
      return response.data.data;
    } finally {
      set({ isLoading: false });
    }
  },

  async register(payload) {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
        '/api/auth/register',
        payload,
      );

      set({
        user: response.data.data.user,
        accessToken: response.data.data.accessToken,
        isAuthenticated: true,
      });
      setAuthFlagCookie(true);
      setRoleCookie(response.data.data.user.role);
      return response.data.data;
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Best effort logout.
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false });
      setAuthFlagCookie(false);
      setRoleCookie(null);
    }
  },

  async refreshToken() {
    try {
      const response = await apiClient.post<{ success: boolean; data: { accessToken: string } }>(
        '/api/auth/refresh',
      );

      const accessToken = response.data.data.accessToken;
      let user = get().user;
      if (!user) {
        const meResponse = await apiClient.get<{ success: boolean; data: UserPublic }>(
          '/api/auth/me',
        );
        user = meResponse.data.data;
      }

      set({
        accessToken,
        user,
        isAuthenticated: true,
      });
      setAuthFlagCookie(true);
      setRoleCookie(user?.role ?? null);

      return accessToken;
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false });
      setAuthFlagCookie(false);
      setRoleCookie(null);
      return null;
    }
  },

  setUser(user) {
    set({ user, isAuthenticated: Boolean(user) });
    setAuthFlagCookie(Boolean(user));
    setRoleCookie(user?.role ?? null);
  },
}));

configureApiAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: async () => useAuthStore.getState().refreshToken(),
  logout: () => {
    void useAuthStore.getState().logout();
  },
});

export { useAuthStore };
