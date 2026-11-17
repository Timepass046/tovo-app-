import { Capacitor } from '@capacitor/core';

const DEFAULT_NATIVE_API_BASE =
  'https://ais-pre-htz6lzojiok5ca7wdqyqev-162022780190.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  const envBase = ((import.meta as any).env?.VITE_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (envBase) {
    return envBase;
  }

  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return DEFAULT_NATIVE_API_BASE;
    }
  } catch {
    // Fallback to relative path in non-browser/test environments
  }

  return '';
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
