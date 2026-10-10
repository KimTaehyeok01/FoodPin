// 핀 응답 DTO의 키 집합·관계 차단·키 생략 동작을 고정하는 응답 계약 회귀 테스트
import { Pin } from '../pin.entity';
import { User } from '../../users/user.entity';
import { Restaurant } from '../../restaurants/restaurant.entity';
import {
  MyPinResponse,
  PinResponse,
  RestaurantPinResponse,
} from './pin.response.dto';

// 핀 단건(POST·PATCH) 응답 키 7개
const PIN_KEYS = [
  'id',
  'userId',
  'restaurantId',
  'rating',
  'memo',
  'createdAt',
  'updatedAt',
];

// MyPinResponse에 중첩되는 식당 응답 키 15개 (RestaurantResponse와 동일)
const RESTAURANT_KEYS = [
  'id',
  'userId',
  'name',
  'latitude',
  'longitude',
  'address',
  'photoUrl',
  'category',
  'phone',
  'description',
  'hoursWeekday',
  'hoursWeekend',
  'breakTime',
  'createdAt',
  'updatedAt',
];

// pins.service.ts getRestaurantPins의 select 6개 + user 관계 = 응답 키 7개 (updatedAt 없음)
const RESTAURANT_PIN_KEYS = [
  'id',
  'userId',
  'restaurantId',
  'rating',
  'memo',
  'createdAt',
  'user',
];

// 전체 컬럼이 하이드레이션된 User — 관계로 실려 들어와도 응답에 새면 안 된다
const mockUser = (): User =>
  ({
    id: 3,
    provider: null,
    providerId: null,
    email: 'hong@foodpin.com',
    password: '$2b$10$hashedpassword',
    name: '홍길동',
    nickname: '길동이',
    profileImage: '/uploads/1710000000000-123456789.jpg',
    address: '서울특별시 강남구 테헤란로 1',
    age: 28,
    gender: 'male',
    role: 'user',
    isBanned: false,
    createdAt: new Date('2026-01-15T09:30:00.000Z'),
  }) as User;

// 조회 응답 상태를 재현한다. latitude/longitude는 MySQL DECIMAL이라 TypeORM이 문자열로 준다.
const mockRestaurant = (): Restaurant =>
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
    hoursWeekday: '11:00 – 21:00',
    hoursWeekend: '11:00 – 22:00',
    breakTime: '15:00 – 17:00',
    createdAt: new Date('2026-07-04T06:00:31.000Z'),
    updatedAt: new Date('2026-07-04T06:00:31.779Z'),
  }) as unknown as Restaurant;

// 관계를 로드하지 않은 핀 (POST /pins/:restaurantId, PATCH 응답 상태)
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

// memo 없이 등록한 상태를 재현한다.
// TypeORM repo.create()가 nullable 컬럼을 null로 채우므로 memo 프로퍼티는 null로 존재한다.
const mockPinWithoutMemo = (): Pin =>
  ({
    id: 43,
    userId: 3,
    restaurantId: 222,
    rating: 5,
    memo: null,
    createdAt: new Date('2026-07-11T12:00:00.000Z'),
    updatedAt: new Date('2026-07-11T12:00:00.000Z'),
  }) as Pin;

const mockPinWithRelations = (): Pin => ({
  ...mockPin(),
  user: mockUser(),
  restaurant: mockRestaurant(),
});

describe('PinResponse', () => {
  it('현행 응답 키 7개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(PinResponse.from(mockPin())).sort();

    // Then
    expect(keys).toEqual([...PIN_KEYS].sort());
  });

  it('restaurant·user 관계 필드는 단건 응답에 새지 않는다', () => {
    // Given — 관계가 로드된 엔티티가 들어와도 단건 응답에는 섞이면 안 된다
    const json: unknown = JSON.parse(
      JSON.stringify(PinResponse.from(mockPinWithRelations())),
    );

    // Then
    expect(json).not.toHaveProperty('restaurant');
    expect(json).not.toHaveProperty('user');
  });

  it('memo 미입력 시 null로 나가며 키는 유지된다', () => {
    // Given & When — TypeORM repo.create()가 nullable 컬럼을 null로 채우므로 undefined가 발생하지 않는다
    const json: unknown = JSON.parse(
      JSON.stringify(PinResponse.from(mockPinWithoutMemo())),
    );

    // Then
    expect(json).toHaveProperty('memo', null);
    expect(Object.keys(json as object).sort()).toEqual([...PIN_KEYS].sort());
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given & When
    const response = PinResponse.from(mockPin());

    // Then
    expect(response).toEqual({
      id: 42,
      userId: 3,
      restaurantId: 111,
      rating: 4,
      memo: '국물이 진하다',
      createdAt: new Date('2026-07-10T12:00:00.000Z'),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });
  });

  it('null 메모를 빈 문자열로 보정하지 않는다', () => {
    // Given
    const pin = mockPin();
    pin.memo = null;

    // When
    const response = PinResponse.from(pin);

    // Then
    expect(response.memo).toBeNull();
  });

  it('fromList는 순서를 유지하며 전 항목을 변환한다', () => {
    // Given
    const second = mockPin();
    second.id = 99;

    // When
    const responses = PinResponse.fromList([mockPin(), second]);

    // Then
    expect(responses.map((p) => p.id)).toEqual([42, 99]);
  });
});

describe('MyPinResponse', () => {
  it('현행 응답 키 8개(핀 7개 + restaurant)를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(MyPinResponse.from(mockPinWithRelations())).sort();

    // Then
    expect(keys).toEqual([...PIN_KEYS, 'restaurant'].sort());
    expect(keys).toHaveLength(8);
  });

  it('중첩 restaurant도 식당 응답 키 15개를 유지한다', () => {
    // Given & When
    const response = MyPinResponse.from(mockPinWithRelations());

    // Then
    expect(Object.keys(response.restaurant ?? {}).sort()).toEqual(
      [...RESTAURANT_KEYS].sort(),
    );
  });

  it('중첩 restaurant의 latitude 문자열을 숫자로 변환하지 않는다', () => {
    // Given & When
    const response = MyPinResponse.from(mockPinWithRelations());

    // Then
    expect(response.restaurant?.latitude).toBe('37.3670000');
    expect(typeof response.restaurant?.latitude).toBe('string');
  });

  it('user 관계가 함께 로드돼도 응답에 새지 않는다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(MyPinResponse.from(mockPinWithRelations())),
    );

    // Then
    expect(json).not.toHaveProperty('user');
  });

  it('restaurant 관계 미로드 시 TypeError 없이 키를 생략한다', () => {
    // Given & When — 무조건 접근하면 TypeError로 500이 난다
    const response = MyPinResponse.from(mockPin());
    const json: unknown = JSON.parse(JSON.stringify(response));

    // Then
    expect(json).not.toHaveProperty('restaurant');
    expect(Object.keys(response)).toHaveLength(7);
  });

  it('fromList는 관계 로드 여부가 섞여 있어도 항목별로 처리한다', () => {
    // Given & When
    const responses = MyPinResponse.fromList([
      mockPinWithRelations(),
      mockPin(),
    ]);

    // Then
    expect(Object.keys(responses[0])).toHaveLength(8);
    expect(Object.keys(responses[1])).toHaveLength(7);
  });
});

describe('RestaurantPinResponse', () => {
  it('현행 응답 키 7개를 반환하고 updatedAt은 포함하지 않는다', () => {
    // Given — updatedAt이 채워진 엔티티가 들어와도 select 제외 계약을 지켜야 한다
    const pin = mockPin();
    pin.user = mockUser();

    // When
    const keys = Object.keys(RestaurantPinResponse.from(pin)).sort();

    // Then
    expect(keys).toEqual([...RESTAURANT_PIN_KEYS].sort());
    expect(keys).not.toContain('updatedAt');
  });

  it('작성자는 id·nickname·profileImage 3개만 담는다', () => {
    // Given
    const pin = mockPin();
    pin.user = mockUser();

    // When
    const response = RestaurantPinResponse.from(pin);

    // Then
    expect(response.user).toEqual({
      id: 3,
      nickname: '길동이',
      profileImage: '/uploads/1710000000000-123456789.jpg',
    });
  });

  it('전체 User가 들어와도 email·password 등 민감 필드가 새지 않는다', () => {
    // Given
    const pin = mockPin();
    pin.user = mockUser();

    // When
    const json = JSON.parse(
      JSON.stringify(RestaurantPinResponse.from(pin)),
    ) as { user: unknown };

    // Then
    expect(json.user).not.toHaveProperty('email');
    expect(json.user).not.toHaveProperty('password');
    expect(json.user).not.toHaveProperty('role');
    expect(json.user).not.toHaveProperty('isBanned');
  });

  it('user 관계 미로드 시 TypeError 없이 키를 생략한다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(RestaurantPinResponse.from(mockPin())),
    );

    // Then
    expect(json).not.toHaveProperty('user');
  });

  it('restaurant 관계가 함께 로드돼도 응답에 새지 않는다', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(RestaurantPinResponse.from(mockPinWithRelations())),
    );

    // Then
    expect(json).not.toHaveProperty('restaurant');
  });
});
