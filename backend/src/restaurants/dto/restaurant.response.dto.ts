// 식당 도메인의 응답 계약을 고정하는 Response DTO 모음
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../restaurant.entity';
import { RestaurantMenu } from '../restaurant-menu.entity';

/**
 * 식당 단건 응답. 목록·생성 응답에 공통으로 쓰인다.
 *
 * 주의 1. `latitude`/`longitude`는 조회 시 MySQL DECIMAL이라 TypeORM이 문자열로,
 * 생성 시에는 요청 DTO 값이 그대로 나가 숫자로 내려간다. 두 형태를 모두 그대로 통과시킨다.
 * 주의 2. 생성 응답도 조회와 동일하게 키 15개를 그대로 유지하며, 요청 DTO에 없던 컬럼
 * (phone·description·hoursWeekday·hoursWeekend·breakTime)은 `null`로 내려간다
 * — TypeORM `repo.create()`가 nullable 컬럼을 `null`로 채워 `undefined`가 되지 않기 때문이다.
 * 그럼에도 `?? null`·`?? ''` 같은 값 보정은 넣지 않는다. `null`이 빈 문자열 등으로 바뀌어
 * 응답 값이 왜곡되고 계약이 깨진다.
 */
export class RestaurantResponse {
  @ApiProperty({ description: '식당 ID', example: 111 })
  id: number;

  @ApiProperty({
    description: '등록한 유저 ID. 시드로 등록된 식당은 null이다.',
    example: 3,
    type: Number,
    nullable: true,
  })
  userId: number | null;

  @ApiProperty({ description: '식당 이름', example: '성남 정자동 순대국' })
  name: string;

  @ApiProperty({
    description:
      '위도. 조회 응답은 DECIMAL 문자열, 생성 응답은 요청 값 그대로인 숫자다.',
    example: '37.3670000',
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  latitude: string | number;

  @ApiProperty({
    description:
      '경도. 조회 응답은 DECIMAL 문자열, 생성 응답은 요청 값 그대로인 숫자다.',
    example: '127.1080000',
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  longitude: string | number;

  @ApiProperty({
    description: '주소',
    example: '경기 성남시 분당구 정자일로 121',
    type: String,
    nullable: true,
  })
  address: string | null;

  @ApiProperty({
    description: '대표 사진 URL',
    example: '/uploads/1710000000000-123456789.jpg',
    type: String,
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({
    description: '음식 카테고리',
    example: '한식',
    type: String,
    nullable: true,
  })
  category: string | null;

  @ApiProperty({
    description: '전화번호',
    example: '0507-1234-0111',
    type: String,
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: '식당 소개',
    example: '동네 주민들의 오랜 단골집.',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '평일 영업시간',
    example: '11:00 – 21:00',
    type: String,
    nullable: true,
  })
  hoursWeekday: string | null;

  @ApiProperty({
    description: '주말 영업시간',
    example: '11:00 – 22:00',
    type: String,
    nullable: true,
  })
  hoursWeekend: string | null;

  @ApiProperty({
    description: '브레이크 타임',
    example: '15:00 – 17:00',
    type: String,
    nullable: true,
  })
  breakTime: string | null;

  @ApiProperty({
    description: '등록 일시',
    example: '2026-07-04T06:00:31.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2026-07-04T06:00:31.779Z',
    type: Date,
  })
  updatedAt: Date;

  // 값을 가공하지 않고 그대로 대입만 한다 (타입 변환·기본값 보정 금지).
  static from(restaurant: Restaurant): RestaurantResponse {
    return {
      id: restaurant.id,
      userId: restaurant.userId,
      name: restaurant.name,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      address: restaurant.address,
      photoUrl: restaurant.photoUrl,
      category: restaurant.category,
      phone: restaurant.phone,
      description: restaurant.description,
      hoursWeekday: restaurant.hoursWeekday,
      hoursWeekend: restaurant.hoursWeekend,
      breakTime: restaurant.breakTime,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }

  static fromList(restaurants: Restaurant[]): RestaurantResponse[] {
    return restaurants.map((restaurant) => RestaurantResponse.from(restaurant));
  }
}

/** 식당 상세 응답에 중첩되는 메뉴 항목. */
export class RestaurantMenuResponse {
  @ApiProperty({ description: '메뉴 ID', example: 1 })
  id: number;

  // 프런트 Menu 타입에는 선언돼 있지 않지만 현행 응답에 실제로 존재하는 키다. 빼면 계약 위반.
  @ApiProperty({ description: '소속 식당 ID', example: 1 })
  restaurantId: number;

  @ApiProperty({ description: '메뉴 이름', example: '된장찌개 정식' })
  name: string;

  @ApiProperty({ description: '가격 (원)', example: 9500 })
  price: number;

  @ApiProperty({ description: '인기 메뉴 여부', example: true })
  isPopular: boolean;

  @ApiProperty({
    description: '메뉴 이모지',
    example: '🍲',
    type: String,
    nullable: true,
  })
  emoji: string | null;

  static from(menu: RestaurantMenu): RestaurantMenuResponse {
    return {
      id: menu.id,
      restaurantId: menu.restaurantId,
      name: menu.name,
      price: menu.price,
      isPopular: menu.isPopular,
      emoji: menu.emoji,
    };
  }

  static fromList(menus: RestaurantMenu[]): RestaurantMenuResponse[] {
    return menus.map((menu) => RestaurantMenuResponse.from(menu));
  }
}

/** 식당 상세·수정 응답. 단건 응답 15개 필드에 메뉴 목록이 더해진다. */
export class RestaurantDetailResponse extends RestaurantResponse {
  @ApiProperty({
    description: '메뉴 목록 (id 오름차순)',
    type: () => [RestaurantMenuResponse],
  })
  menus: RestaurantMenuResponse[];

  static from(restaurant: Restaurant): RestaurantDetailResponse {
    return {
      ...RestaurantResponse.from(restaurant),
      menus: RestaurantMenuResponse.fromList(restaurant.menus),
    };
  }
}
