import axios, { AxiosError } from 'axios';

type AuthConfig = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
};

let authConfig: AuthConfig | null = null;
let refreshingPromise: Promise<string | null> | null = null;

export function configureApiAuth(config: AuthConfig): void {
  authConfig = config;
}

function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (!raw) return '';

  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  // Defensive fallback: if env var is set without protocol, default to https.
  return `https://${withoutTrailingSlash}`;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 8000,
});

apiClient.interceptors.request.use((config) => {
  return (async () => {
    const token = authConfig?.getAccessToken();
    const url = String(config.url ?? '');

    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout');

    // If the user was previously authenticated (cookie flag), try to restore a token
    // before making protected requests. This avoids 401 spam after page reloads.
    if (
      !token &&
      !isAuthEndpoint &&
      typeof document !== 'undefined' &&
      document.cookie.includes('martillo_auth=1') &&
      authConfig
    ) {
      if (!refreshingPromise) {
        refreshingPromise = authConfig.refreshAccessToken().finally(() => {
          refreshingPromise = null;
        });
      }

      const refreshed = await refreshingPromise;
      if (refreshed) {
        config.headers.Authorization = `Bearer ${refreshed}`;
        return config;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  })();
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (!authConfig || status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!refreshingPromise) {
      refreshingPromise = authConfig.refreshAccessToken().finally(() => {
        refreshingPromise = null;
      });
    }

    const newToken = await refreshingPromise;
    if (!newToken) {
      authConfig.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(originalRequest);
  },
);
