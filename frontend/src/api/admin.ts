// 관리자 전용 API 클라이언트 — 일반 유저 세션과 분리된 admin_token 사용
const BASE_URL = import.meta.env.VITE_API_URL;

export interface AdminProfile {
  id: number;
  nickname: string;
  email: string | null;
  role: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const adminAuthApi = {
  login: (dto: AdminLoginDto) =>
    adminRequest<{ token: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  getMe: () => adminRequest<AdminProfile>('/auth/admin/me'),
};
