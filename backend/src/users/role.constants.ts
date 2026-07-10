// 유저 권한 상수
export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];
