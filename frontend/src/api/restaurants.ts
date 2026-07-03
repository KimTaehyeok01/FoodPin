const BASE_URL = import.meta.env.VITE_API_URL;

// 외부 이미지(https://...)는 그대로, 업로드 이미지(/uploads/...)는 API 주소를 붙여서 반환
export function photoSrc(photoUrl: string): string {
  return photoUrl.startsWith('http') ? photoUrl : `${BASE_URL}${photoUrl}`;
}

export interface Restaurant {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  photoUrl: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pin {
  id: number;
  userId: number;
  restaurantId: number;
  rating: number;
  memo: string | null;
  createdAt: string;
  restaurant: Restaurant;
}

export interface CreateRestaurantDto {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  photoUrl?: string;
  category?: string;
}

export interface CreatePinDto {
  rating: number;
  memo?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) throw new Error("이미지 업로드 실패");
  const data = await res.json();
  return data.url;
}

export const restaurantsApi = {
  getAll: () => request<Restaurant[]>("/restaurants"),
  getOne: (id: number) => request<Restaurant>(`/restaurants/${id}`),
  create: (dto: CreateRestaurantDto) =>
    request<Restaurant>("/restaurants", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

export const pinsApi = {
  getMyPins: () => request<Pin[]>("/pins/me"),
  pin: (restaurantId: number, dto: CreatePinDto) =>
    request<Pin>(`/pins/${restaurantId}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  update: (restaurantId: number, dto: Partial<CreatePinDto>) =>
    request<Pin>(`/pins/${restaurantId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  unpin: (restaurantId: number) =>
    request<void>(`/pins/${restaurantId}`, { method: "DELETE" }),
};
