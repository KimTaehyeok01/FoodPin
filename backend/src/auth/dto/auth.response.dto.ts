// 인증 도메인의 응답 계약을 고정하는 Response DTO 모음
import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from '../../common/types/auth-request';

/** 회원가입·로그인·관리자 로그인이 공통으로 내려주는 토큰 응답. */
export class TokenResponse {
  @ApiProperty({
    description: 'JWT 액세스 토큰 (만료 30일)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjF9.signature',
  })
  token: string;

  static from(token: string): TokenResponse {
    return { token };
  }
}

/** 회원가입 1단계의 이메일 중복 확인 응답. */
export class EmailAvailabilityResponse {
  @ApiProperty({
    description: '사용 가능한 이메일이면 true, 이미 가입된 이메일이면 false',
    example: true,
  })
  available: boolean;

  static from(available: boolean): EmailAvailabilityResponse {
    return { available };
  }
}

/** 관리자 세션 확인(admin/me) 응답. */
export class AdminMeResponse {
  @ApiProperty({ description: '유저 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '닉네임', example: '관리자' })
  nickname: string;

  @ApiProperty({
    description: '이메일. 소셜 가입 계정은 null이다.',
    example: 'admin@foodpin.com',
    type: String,
    nullable: true,
  })
  email: string | null;

  @ApiProperty({ description: '권한', example: 'admin' })
  role: string;

  static from(user: AuthUser): AdminMeResponse {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
    };
  }
}
