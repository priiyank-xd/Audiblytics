import { apiFetch } from '@/lib/api/client';

export type AuthUser = {
  id: string;
  email: string;
};

export async function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/me');
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/api/v1/auth/logout', { method: 'POST' });
}
