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
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const adminAuthApi = {
  login: (dto: AdminLoginDto) =>
    adminRequest<{ token: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  getMe: () => adminRequest<AdminProfile>('/auth/admin/me'),
};

export interface AdminStats {
  userCount: number;
  restaurantCount: number;
  pendingInquiryCount: number;
}

export interface AdminUser {
  id: number;
  provider: string | null;
  email: string | null;
  nickname: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export interface AdminRestaurant {
  id: number;
  userId: number | null;
  name: string;
  address: string | null;
  category: string | null;
  createdAt: string;
}

export interface AdminPin {
  id: number;
  rating: number;
  memo: string | null;
  createdAt: string;
  user: { id: number; nickname: string };
  restaurant: { id: number; name: string };
}

export interface AdminInquiry {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user: { id: number; nickname: string; email: string | null };
}

export const adminApi = {
  getStats: () => adminRequest<AdminStats>('/admin/stats'),

  getUsers: (search?: string) =>
    adminRequest<AdminUser[]>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  setUserBanned: (id: number, banned: boolean) =>
    adminRequest<void>(`/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ banned }),
    }),
  deleteUser: (id: number) => adminRequest<void>(`/admin/users/${id}`, { method: 'DELETE' }),

  getRestaurants: (search?: string) =>
    adminRequest<AdminRestaurant[]>(`/admin/restaurants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  deleteRestaurant: (id: number) =>
    adminRequest<void>(`/admin/restaurants/${id}`, { method: 'DELETE' }),

  getPins: () => adminRequest<AdminPin[]>('/admin/pins'),
  deletePin: (id: number) => adminRequest<void>(`/admin/pins/${id}`, { method: 'DELETE' }),

  getInquiries: () => adminRequest<AdminInquiry[]>('/admin/inquiries'),
  answerInquiry: (id: number, answer: string) =>
    adminRequest<AdminInquiry>(`/admin/inquiries/${id}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({ answer }),
    }),
};
