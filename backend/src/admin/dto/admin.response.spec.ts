// 관리자 응답 DTO의 키 집합·미선택 필드 차단·중첩 관계 축소를 고정하는 응답 계약 회귀 테스트
import { User } from '../../users/user.entity';
import { Pin } from '../../pins/pin.entity';
import { Inquiry } from '../../inquiries/inquiry.entity';
import { Restaurant } from '../../restaurants/restaurant.entity';
import {
  AdminInquiryListResponse,
  AdminPinResponse,
  AdminStatsResponse,
  AdminUserResponse,
} from './admin.response.dto';

// admin.service.ts USER_LIST_SELECT 7개 = 회원 목록 응답 키
const ADMIN_USER_KEYS = [
  'id',
  'provider',
  'email',
  'nickname',
  'role',
  'isBanned',
  'createdAt',
];

// getPins의 select 4개 + user·restaurant 관계 = 리뷰 목록 응답 키 6개 (userId·restaurantId·updatedAt 없음)
const ADMIN_PIN_KEYS = [
  'id',
  'rating',
  'memo',
  'createdAt',
  'user',
  'restaurant',
];

// getInquiries의 select 7개 + user 관계 = 문의 목록 응답 키 8개 (userId 없음)
const ADMIN_INQUIRY_KEYS = [
  'id',
  'title',
  'content',
  'status',
  'answer',
  'answeredAt',
  'createdAt',
  'user',
];

// USER_LIST_SELECT로 조회된 상태를 재현한다 (미선택 필드는 키 자체가 없다)
const mockListUser = (): User =>
  ({
    id: 3,
    provider: null,
    email: 'hong@foodpin.com',
    nickname: '길동이',
    role: 'user',
    isBanned: false,
    createdAt: new Date('2026-01-15T09:30:00.000Z'),
  }) as User;

// 전체 컬럼이 하이드레이션된 User — 관계로 실려 들어와도 응답에 새면 안 된다
const mockFullUser = (): User => ({
  ...mockListUser(),
  providerId: 'kakao-1234567890',
  password: '$2b$10$hashedpassword',
  name: '홍길동',
  profileImage: '/uploads/1710000000000-123456789.jpg',
  address: '서울특별시 강남구 테헤란로 1',
  age: 28,
  gender: 'male',
});

// 전체 컬럼이 하이드레이션된 Restaurant
const mockFullRestaurant = (): Restaurant =>
  ({
    id: 111,
    userId: null,
    name: '성남 정자동 순대국',
    latitude: '37.3670000',
    longitude: '127.1080000',
    address: '경기 성남시 분당구 정자일로 121',
    photoUrl: 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431',
    category: '한식',
    phone: '0507-1234-0111',
    description: '동네 주민들의 오랜 단골집.',
    createdAt: new Date('2026-07-04T06:00:31.000Z'),
    updatedAt: new Date('2026-07-04T06:00:31.779Z'),
  }) as unknown as Restaurant;

// updatedAt·userId·restaurantId가 채워진 엔티티 — select 제외 계약을 지키는지 확인하기 위해 일부러 채운다
const mockPin = (): Pin =>
  ({
    id: 42,
    userId: 3,
    restaurantId: 111,
    rating: 4,
    memo: '국물이 진하다',
    createdAt: new Date('2026-07-10T12:00:00.000Z'),
    updatedAt: new Date('2026-07-10T12:00:00.000Z'),
  }) as Pin;

const mockPinWithRelations = (): Pin => ({
  ...mockPin(),
  user: mockFullUser(),
  restaurant: mockFullRestaurant(),
});

// userId가 채워진 엔티티 — select 제외 계약 확인용
const mockInquiry = (): Inquiry =>
  ({
    id: 7,
    userId: 3,
    title: '핀이 지도에 안 보여요',
    content: '어제 등록한 핀이 지도에 표시되지 않습니다.',
    status: 'pending',
    answer: null,
    answeredAt: null,
    createdAt: new Date('2026-07-19T11:30:00.000Z'),
  }) as Inquiry;

const mockInquiryWithUser = (): Inquiry => ({
  ...mockInquiry(),
  user: mockFullUser(),
});

describe('AdminStatsResponse', () => {
  it('현행 응답 키 3개를 유지한다', () => {
    // Given — getStats는 정적 팩토리 없이 이 형태의 객체를 그대로 반환한다
    const stats: AdminStatsResponse = {
      userCount: 128,
      restaurantCount: 172,
      pendingInquiryCount: 3,
    };

    // When
    const keys = Object.keys(stats).sort();

    // Then
    expect(keys).toEqual(
      ['userCount', 'restaurantCount', 'pendingInquiryCount'].sort(),
    );
  });
});

describe('AdminUserResponse', () => {
  it('현행 응답 키 7개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(AdminUserResponse.from(mockListUser())).sort();

    // Then
    expect(keys).toEqual([...ADMIN_USER_KEYS].sort());
  });

  it('미선택·민감 필드(password·name·profileImage·address)는 응답에 새지 않는다', () => {
    // Given — 전체 컬럼이 하이드레이션된 User가 들어와도 응답에 섞이면 안 된다
    const json: unknown = JSON.parse(
      JSON.stringify(AdminUserResponse.from(mockFullUser())),
    );

    // Then
    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('name');
    expect(json).not.toHaveProperty('profileImage');
    expect(json).not.toHaveProperty('address');
    expect(json).not.toHaveProperty('providerId');
    expect(json).not.toHaveProperty('pins');
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given & When
    const response = AdminUserResponse.from(mockListUser());

    // Then
    expect(response).toEqual({
      id: 3,
      provider: null,
      email: 'hong@foodpin.com',
      nickname: '길동이',
      role: 'user',
      isBanned: false,
      createdAt: new Date('2026-01-15T09:30:00.000Z'),
    });
  });

  it('null 필드를 기본값으로 보정하지 않는다', () => {
    // Given
    const user = mockListUser();
    user.email = null;

    // When
    const response = AdminUserResponse.from(user);

    // Then
    expect(response.provider).toBeNull();
    expect(response.email).toBeNull();
  });

  it('fromList는 순서를 유지하며 전 항목을 변환한다', () => {
    // Given
    const second = mockListUser();
    second.id = 5;

    // When
    const responses = AdminUserResponse.fromList([mockListUser(), second]);

    // Then
    expect(responses.map((u) => u.id)).toEqual([3, 5]);
  });
});

describe('AdminPinResponse', () => {
  it('현행 응답 키 6개를 반환하고 userId·restaurantId·updatedAt은 포함하지 않는다', () => {
    // Given & When — 해당 값이 채워진 엔티티가 들어와도 select 제외 계약을 지켜야 한다
    const keys = Object.keys(
      AdminPinResponse.from(mockPinWithRelations()),
    ).sort();

    // Then
    expect(keys).toEqual([...ADMIN_PIN_KEYS].sort());
    expect(keys).not.toContain('userId');
    expect(keys).not.toContain('restaurantId');
    expect(keys).not.toContain('updatedAt');
  });

  it('중첩 user는 id·nickname 2개, restaurant는 id·name 2개만 담는다', () => {
    // Given & When
    const response = AdminPinResponse.from(mockPinWithRelations());

    // Then
    expect(response.user).toEqual({ id: 3, nickname: '길동이' });
    expect(response.restaurant).toEqual({
      id: 111,
      name: '성남 정자동 순대국',
    });
  });

  it('전체 엔티티가 들어와도 중첩 관계에 민감·부가 필드가 새지 않는다', () => {
    // Given & When
    const json = JSON.parse(
      JSON.stringify(AdminPinResponse.from(mockPinWithRelations())),
    ) as { user: unknown; restaurant: unknown };

    // Then
    expect(json.user).not.toHaveProperty('email');
    expect(json.user).not.toHaveProperty('password');
    expect(json.restaurant).not.toHaveProperty('latitude');
    expect(json.restaurant).not.toHaveProperty('address');
  });

  it('user 관계 미로드 시 TypeError 없이 키를 생략한다', () => {
    // Given
    const pin = mockPin();
    pin.restaurant = mockFullRestaurant();

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(AdminPinResponse.from(pin)),
    );

    // Then
    expect(json).not.toHaveProperty('user');
    expect(json).toHaveProperty('restaurant');
  });

  it('restaurant 관계 미로드 시 TypeError 없이 키를 생략한다', () => {
    // Given
    const pin = mockPin();
    pin.user = mockFullUser();

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(AdminPinResponse.from(pin)),
    );

    // Then
    expect(json).not.toHaveProperty('restaurant');
    expect(json).toHaveProperty('user');
  });
});

describe('AdminInquiryListResponse', () => {
  it('현행 응답 키 8개를 반환하고 userId는 포함하지 않는다', () => {
    // Given & When — userId가 채워진 엔티티가 들어와도 select 제외 계약을 지켜야 한다
    const keys = Object.keys(
      AdminInquiryListResponse.from(mockInquiryWithUser()),
    ).sort();

    // Then
    expect(keys).toEqual([...ADMIN_INQUIRY_KEYS].sort());
    expect(keys).not.toContain('userId');
  });

  it('중첩 user는 id·nickname·email 3개만 담는다', () => {
    // Given & When
    const response = AdminInquiryListResponse.from(mockInquiryWithUser());

    // Then
    expect(response.user).toEqual({
      id: 3,
      nickname: '길동이',
      email: 'hong@foodpin.com',
    });
  });

  it('전체 User가 들어와도 중첩 user에 민감 필드가 새지 않는다', () => {
    // Given & When
    const json = JSON.parse(
      JSON.stringify(AdminInquiryListResponse.from(mockInquiryWithUser())),
    ) as { user: unknown };

    // Then
    expect(json.user).not.toHaveProperty('password');
    expect(json.user).not.toHaveProperty('address');
    expect(json.user).not.toHaveProperty('role');
  });

  it('user 관계 미로드 시 TypeError 없이 키를 생략한다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(AdminInquiryListResponse.from(mockInquiry())),
    );

    // Then
    expect(json).not.toHaveProperty('user');
  });

  it('미답변 문의의 null 필드를 기본값으로 보정하지 않는다', () => {
    // Given & When
    const response = AdminInquiryListResponse.from(mockInquiryWithUser());

    // Then
    expect(response.status).toBe('pending');
    expect(response.answer).toBeNull();
    expect(response.answeredAt).toBeNull();
  });

  it('fromList는 순서를 유지하며 전 항목을 변환한다', () => {
    // Given
    const second = mockInquiryWithUser();
    second.id = 9;

    // When
    const responses = AdminInquiryListResponse.fromList([
      mockInquiryWithUser(),
      second,
    ]);

    // Then
    expect(responses.map((i) => i.id)).toEqual([7, 9]);
  });
});
