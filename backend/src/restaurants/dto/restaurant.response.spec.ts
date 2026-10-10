// 식당 응답 DTO의 키 집합·값 통과·관계 차단 동작을 실측 기준선(.baseline)에 맞춰 고정하는 계약 회귀 테스트
import { Restaurant } from '../restaurant.entity';
import { RestaurantMenu } from '../restaurant-menu.entity';
import {
  RestaurantDetailResponse,
  RestaurantMenuResponse,
  RestaurantResponse,
} from './restaurant.response.dto';

// .baseline/get_restaurants.json 항목의 실측 키 15개
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

// .baseline/get_restaurant_1.json의 menus 항목 실측 키 6개 (restaurantId 포함)
const MENU_KEYS = ['id', 'restaurantId', 'name', 'price', 'isPopular', 'emoji'];

const mockMenu = (): RestaurantMenu =>
  ({
    id: 1,
    restaurantId: 1,
    name: '된장찌개 정식',
    price: 9500,
    isPopular: true,
    emoji: '🍲',
  }) as RestaurantMenu;

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

// GET /restaurants/:id 상태 — relations로 menus가 로드된 엔티티
const mockRestaurantWithMenus = (menus: RestaurantMenu[]): Restaurant => ({
  ...mockRestaurant(),
  menus,
});

// POST /restaurants 상태를 재현한다.
// TypeORM repo.create()가 nullable 컬럼을 null로 채우므로, 요청 DTO에 없던 컬럼도 프로퍼티가 존재한다.
const mockCreatedRestaurant = (): Restaurant =>
  ({
    id: 200,
    userId: 3,
    name: '새로 등록한 식당',
    latitude: 37.5665,
    longitude: 126.978,
    address: '서울특별시 중구 세종대로 110',
    photoUrl: '/uploads/1710000000000-123456789.jpg',
    category: '한식',
    phone: null,
    description: null,
    hoursWeekday: null,
    hoursWeekend: null,
    breakTime: null,
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
  }) as unknown as Restaurant;

describe('RestaurantResponse', () => {
  it('현행 응답 키 15개를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(RestaurantResponse.from(mockRestaurant())).sort();

    // Then
    expect(keys).toEqual([...RESTAURANT_KEYS].sort());
  });

  it('menus·pins 등 관계 필드는 단건 응답에 새지 않는다', () => {
    // Given — 관계가 로드된 엔티티가 들어와도 단건 응답에는 섞이면 안 된다
    const restaurant = mockRestaurantWithMenus([mockMenu()]);
    restaurant.pins = [];

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(RestaurantResponse.from(restaurant)),
    );

    // Then
    expect(json).not.toHaveProperty('menus');
    expect(json).not.toHaveProperty('pins');
  });

  it('latitude·longitude 문자열을 숫자로 변환하지 않는다', () => {
    // Given & When
    const response = RestaurantResponse.from(mockRestaurant());

    // Then
    expect(response.latitude).toBe('37.3670000');
    expect(response.longitude).toBe('127.1080000');
    expect(typeof response.latitude).toBe('string');
  });

  it('생성 응답의 숫자 좌표도 문자열로 바꾸지 않는다', () => {
    // Given & When
    const response = RestaurantResponse.from(mockCreatedRestaurant());

    // Then
    expect(response.latitude).toBe(37.5665);
    expect(typeof response.latitude).toBe('number');
  });

  it('생성 응답도 키 15개를 유지하며, 미입력 컬럼은 null로 나간다', () => {
    // Given & When — TypeORM repo.create()가 nullable 컬럼을 null로 채우므로 undefined가 발생하지 않는다
    const json: unknown = JSON.parse(
      JSON.stringify(RestaurantResponse.from(mockCreatedRestaurant())),
    );

    // Then
    expect(Object.keys(json as object).sort()).toEqual(
      [...RESTAURANT_KEYS].sort(),
    );
    expect(json).toHaveProperty('phone', null);
    expect(json).toHaveProperty('description', null);
    expect(json).toHaveProperty('hoursWeekday', null);
    expect(json).toHaveProperty('hoursWeekend', null);
    expect(json).toHaveProperty('breakTime', null);
  });

  it('null 필드를 기본값으로 보정하지 않는다', () => {
    // Given & When
    const response = RestaurantResponse.from(mockRestaurant());
    const created = RestaurantResponse.from(mockCreatedRestaurant());

    // Then — null은 null 그대로 통과해야 한다 (빈 문자열 등으로 보정 금지)
    expect(response.userId).toBeNull();
    expect(created.phone).toBeNull();
    expect(created.description).toBeNull();
  });

  it('fromList는 순서를 유지하며 전 항목을 변환한다', () => {
    // Given
    const second = mockRestaurant();
    second.id = 222;

    // When
    const responses = RestaurantResponse.fromList([mockRestaurant(), second]);

    // Then
    expect(responses.map((r) => r.id)).toEqual([111, 222]);
  });
});

describe('RestaurantMenuResponse', () => {
  it('현행 응답 키 6개를 그대로 반환한다 (restaurantId 포함)', () => {
    // Given & When
    const keys = Object.keys(RestaurantMenuResponse.from(mockMenu())).sort();

    // Then
    expect(keys).toEqual([...MENU_KEYS].sort());
    expect(keys).toContain('restaurantId');
  });

  it('restaurant 역참조 관계는 응답에 새지 않는다', () => {
    // Given
    const menu = mockMenu();
    menu.restaurant = mockRestaurant();

    // When
    const json: unknown = JSON.parse(
      JSON.stringify(RestaurantMenuResponse.from(menu)),
    );

    // Then
    expect(json).not.toHaveProperty('restaurant');
  });

  it('값을 가공 없이 그대로 통과시킨다', () => {
    // Given & When
    const response = RestaurantMenuResponse.from(mockMenu());

    // Then
    expect(response).toEqual({
      id: 1,
      restaurantId: 1,
      name: '된장찌개 정식',
      price: 9500,
      isPopular: true,
      emoji: '🍲',
    });
  });
});

describe('RestaurantDetailResponse', () => {
  it('현행 응답 키 16개(단건 15개 + menus)를 그대로 반환한다', () => {
    // Given & When
    const keys = Object.keys(
      RestaurantDetailResponse.from(mockRestaurantWithMenus([mockMenu()])),
    ).sort();

    // Then
    expect(keys).toEqual([...RESTAURANT_KEYS, 'menus'].sort());
    expect(keys).toHaveLength(16);
  });

  it('메뉴 항목도 실측 키 6개를 유지한다', () => {
    // Given & When
    const response = RestaurantDetailResponse.from(
      mockRestaurantWithMenus([mockMenu()]),
    );

    // Then
    expect(Object.keys(response.menus[0]).sort()).toEqual(
      [...MENU_KEYS].sort(),
    );
  });

  it('메뉴가 없으면 빈 배열을 그대로 유지한다 (키 생략 금지)', () => {
    // Given & When
    const json: unknown = JSON.parse(
      JSON.stringify(
        RestaurantDetailResponse.from(mockRestaurantWithMenus([])),
      ),
    );

    // Then
    expect(json).toHaveProperty('menus', []);
  });

  it('latitude 문자열을 숫자로 변환하지 않는다', () => {
    // Given & When
    const response = RestaurantDetailResponse.from(
      mockRestaurantWithMenus([mockMenu()]),
    );

    // Then
    expect(response.latitude).toBe('37.3670000');
  });
});
