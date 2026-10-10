// 인증된 요청의 주체(req.user)를 Entity 의존 없이 표현하는 공용 타입
import { Request } from 'express';

// Guard·Controller·Service가 실제로 소비하는 필드만 담는다.
// id: 전 도메인 소유자 판별 / nickname·email: admin/me 응답
// role: AdminGuard·식당 수정 권한 / isBanned: 토큰 발급 전 정지 계정 차단
export interface AuthUser {
  id: number;
  nickname: string;
  email: string | null;
  role: string;
  isBanned: boolean;
}

export type AuthRequest = Request & { user: AuthUser };
