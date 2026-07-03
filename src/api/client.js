import axios from 'axios';

// Empty VITE_API_URL -> use the Vite dev proxy at /api (see vite.config.js).
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const ACCESS_KEY = 'ughrani_access';
const REFRESH_KEY = 'ughrani_refresh';

let accessToken = localStorage.getItem(ACCESS_KEY) || null;
let refreshToken = localStorage.getItem(REFRESH_KEY) || null;
let onAuthFail = null;

export function setOnAuthFail(fn) {
  onAuthFail = fn;
}

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export const API_BASE_URL = BASE_URL;

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && refreshToken && original && !original._retry) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const res = await refreshing;
        refreshing = null;
        setTokens(res.data.access_token, refreshToken);
        original.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setTokens(null, null);
        if (onAuthFail) onAuthFail();
        return Promise.reject(e);
      }
    }

    if (status === 401) {
      setTokens(null, null);
      if (onAuthFail) onAuthFail();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  return error?.message || 'Something went wrong';
}
