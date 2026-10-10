// 인증 응답 DTO의 키 집합·값 통과를 고정하는 응답 계약 회귀 테스트
import { AuthUser } from '../../common/types/auth-request';
import {
  AdminMeResponse,
  EmailAvailabilityResponse,
  TokenResponse,
} from './auth.response.dto';

const mockAdmin = (): AuthUser => ({
  id: 1,
  nickname: '관리자',
  email: 'admin@foodpin.com',
  role: 'admin',
  isBanned: false,
});

describe('TokenResponse', () => {
  const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.signature';

  it('현행 응답 키 1개(token)만 반환한다', () => {
    expect(Object.keys(TokenResponse.from(TOKEN)).sort()).toEqual(['token']);
  });

  it('유저 정보를 응답에 섞지 않는다', () => {
    // Given & When
    const json: unknown = JSON.parse(JSON.stringify(TokenResponse.from(TOKEN)));

    // Then
    expect(json).not.toHaveProperty('user');
    expect(json).not.toHaveProperty('id');
    expect(json).not.toHaveProperty('password');
  });

  it('토큰 문자열을 가공 없이 그대로 통과시킨다', () => {
    expect(TokenResponse.from(TOKEN).token).toBe(TOKEN);
  });
});

describe('EmailAvailabilityResponse', () => {
  it('현행 응답 키 1개(available)만 반환한다', () => {
    expect(Object.keys(EmailAvailabilityResponse.from(true)).sort()).toEqual([
      'available',
    ]);
  });

  it('이메일 값을 응답에 노출하지 않는다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(EmailAvailabilityResponse.from(false)),
    );

    // Then
    expect(json).not.toHaveProperty('email');
  });

  it('boolean 값을 변환 없이 그대로 통과시킨다', () => {
    expect(EmailAvailabilityResponse.from(false).available).toBe(false);
    expect(EmailAvailabilityResponse.from(true).available).toBe(true);
  });
});

describe('AdminMeResponse', () => {
  it('현행 응답 키 4개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(AdminMeResponse.from(mockAdmin())).sort();

    // Then
    expect(keys).toEqual(['email', 'id', 'nickname', 'role'].sort());
  });

  it('인증 주체의 내부 판정값(isBanned)은 응답에 새지 않는다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(AdminMeResponse.from(mockAdmin())),
    );

    // Then
    expect(json).not.toHaveProperty('isBanned');
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given
    const admin = mockAdmin();

    // When
    const response = AdminMeResponse.from(admin);

    // Then
    expect(response).toEqual({
      id: 1,
      nickname: '관리자',
      email: 'admin@foodpin.com',
      role: 'admin',
    });
  });

  it('email이 null인 계정은 null을 그대로 유지한다', () => {
    // Given
    const admin: AuthUser = { ...mockAdmin(), email: null };

    // When & Then
    expect(AdminMeResponse.from(admin).email).toBeNull();
  });
});
