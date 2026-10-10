// 유저 응답 DTO의 키 집합·민감 필드 차단·값 통과를 고정하는 응답 계약 회귀 테스트
import { User } from '../user.entity';
import { UserProfileResponse } from './user.response.dto';

// users.service.ts의 PROFILE_SELECT 10개 + favoriteCategories = 현행 응답 키 11개
const PROFILE_KEYS = [
  'id',
  'provider',
  'email',
  'name',
  'nickname',
  'profileImage',
  'address',
  'age',
  'gender',
  'createdAt',
  'favoriteCategories',
];

// PROFILE_SELECT로 조회된 상태를 재현한다 (password 등 미선택 필드는 키 자체가 없다)
const mockProfileUser = (): User =>
  ({
    id: 1,
    provider: null,
    email: 'hong@foodpin.com',
    name: '홍길동',
    nickname: '길동이',
    profileImage: null,
    address: '서울특별시 강남구 테헤란로 1',
    age: 28,
    gender: 'male',
    createdAt: new Date('2026-01-15T09:30:00.000Z'),
  }) as User;

describe('UserProfileResponse', () => {
  it('현행 응답 키 11개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(
      UserProfileResponse.from(mockProfileUser(), ['한식']),
    ).sort();

    // Then
    expect(keys).toEqual([...PROFILE_KEYS].sort());
  });

  it('민감·내부 필드(password·providerId·role·isBanned)는 응답에 새지 않는다', () => {
    // Given — 전체 컬럼이 하이드레이션된 User가 들어와도 응답에 섞이면 안 된다
    const user: User = {
      ...mockProfileUser(),
      password: '$2b$10$hashedpassword',
      providerId: 'kakao-1234567890',
      role: 'admin',
      isBanned: true,
    };

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(UserProfileResponse.from(user, ['한식'])),
    );

    // Then
    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('providerId');
    expect(json).not.toHaveProperty('role');
    expect(json).not.toHaveProperty('isBanned');
    expect(json).not.toHaveProperty('pins');
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given
    const user = mockProfileUser();

    // When
    const response = UserProfileResponse.from(user, ['한식', '일식']);

    // Then
    expect(response).toEqual({
      id: 1,
      provider: null,
      email: 'hong@foodpin.com',
      name: '홍길동',
      nickname: '길동이',
      profileImage: null,
      address: '서울특별시 강남구 테헤란로 1',
      age: 28,
      gender: 'male',
      createdAt: new Date('2026-01-15T09:30:00.000Z'),
      favoriteCategories: ['한식', '일식'],
    });
  });

  it('null 필드를 기본값으로 보정하지 않는다', () => {
    // Given & When
    const response = UserProfileResponse.from(mockProfileUser(), []);

    // Then
    expect(response.provider).toBeNull();
    expect(response.profileImage).toBeNull();
  });

  it('age를 문자열로 바꾸지 않고 숫자 그대로 유지한다', () => {
    // Given & When
    const response = UserProfileResponse.from(mockProfileUser(), []);

    // Then
    expect(response.age).toBe(28);
    expect(typeof response.age).toBe('number');
  });

  it('선호 카테고리가 없으면 빈 배열을 그대로 유지한다 (키 생략 금지)', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(UserProfileResponse.from(mockProfileUser(), [])),
    );

    // Then
    expect(json).toHaveProperty('favoriteCategories', []);
  });
});
