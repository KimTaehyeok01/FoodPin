// 성별 선택지 상수
export const GENDERS = ['male', 'female'] as const;

export type Gender = (typeof GENDERS)[number];
