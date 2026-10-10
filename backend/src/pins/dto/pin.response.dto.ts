// 핀 도메인의 응답 계약을 고정하는 Response DTO 모음
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Pin } from '../pin.entity';
import { RestaurantResponse } from '../../restaurants/dto/restaurant.response.dto';

/**
 * 핀 단건 응답. 등록(POST)·수정(PATCH) 응답에 쓰인다.
 *
 * 주의. 이 응답에는 `restaurant` 키가 없다 — 등록·수정은 관계를 로드하지 않기 때문이다.
 * 내 핀 목록(GET /pins/me)은 관계를 로드하므로 별도 DTO(MyPinResponse)를 쓴다.
 */
export class PinResponse {
  @ApiProperty({ description: '핀 ID', example: 42 })
  id: number;

  @ApiProperty({ description: '핀을 남긴 유저 ID', example: 3 })
  userId: number;

  @ApiProperty({ description: '대상 식당 ID', example: 111 })
  restaurantId: number;

  @ApiProperty({ description: '별점 (1~5)', example: 4 })
  rating: number;

  @ApiProperty({
    description: '메모. 미입력 시 null로 내려간다 (키는 항상 존재한다).',
    example: '국물이 진하다',
    type: String,
    nullable: true,
  })
  memo: string | null;

  @ApiProperty({ description: '등록 일시', type: Date })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시', type: Date })
  updatedAt: Date;

  // 값을 가공하지 않고 그대로 대입만 한다 (타입 변환·기본값 보정 금지).
  static from(pin: Pin): PinResponse {
    return {
      id: pin.id,
      userId: pin.userId,
      restaurantId: pin.restaurantId,
      rating: pin.rating,
      memo: pin.memo,
      createdAt: pin.createdAt,
      updatedAt: pin.updatedAt,
    };
  }

  static fromList(pins: Pin[]): PinResponse[] {
    return pins.map((pin) => PinResponse.from(pin));
  }
}

/** 내 핀 목록 응답. 핀 단건 필드에 식당 정보가 중첩된다. */
export class MyPinResponse extends PinResponse {
  @ApiPropertyOptional({
    description:
      '핀을 남긴 식당. 관계를 로드하지 않은 경우 키가 생성되지 않는다.',
    type: () => RestaurantResponse,
  })
  restaurant?: RestaurantResponse;

  // 관계 미로드 시 키 자체를 만들지 않는다 — 현행 응답과 동일하고,
  // 무조건 접근하면 TypeError로 500이 난다.
  static from(pin: Pin): MyPinResponse {
    return {
      ...PinResponse.from(pin),
      ...(pin.restaurant
        ? { restaurant: RestaurantResponse.from(pin.restaurant) }
        : {}),
    };
  }

  static fromList(pins: Pin[]): MyPinResponse[] {
    return pins.map((pin) => MyPinResponse.from(pin));
  }
}

/** 식당별 핀 목록에 중첩되는 작성자 정보. */
export class PinAuthorResponse {
  @ApiProperty({ description: '유저 ID', example: 3 })
  id: number;

  @ApiProperty({ description: '닉네임', example: '길동이' })
  nickname: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: '/uploads/1710000000000-123456789.jpg',
    type: String,
    nullable: true,
  })
  profileImage: string | null;
}

/**
 * 식당별 핀(리뷰) 목록 응답.
 *
 * 주의. 서비스의 select가 `updatedAt`을 제외하므로 이 응답에는 `updatedAt` 키가 없다.
 * PinResponse를 상속해 재사용하면 없던 키가 생겨 계약이 깨진다.
 */
export class RestaurantPinResponse {
  @ApiProperty({ description: '핀 ID', example: 42 })
  id: number;

  @ApiProperty({ description: '핀을 남긴 유저 ID', example: 3 })
  userId: number;

  @ApiProperty({ description: '대상 식당 ID', example: 111 })
  restaurantId: number;

  @ApiProperty({ description: '별점 (1~5)', example: 4 })
  rating: number;

  @ApiProperty({
    description: '메모',
    example: '국물이 진하다',
    type: String,
    nullable: true,
  })
  memo: string | null;

  @ApiProperty({ description: '등록 일시', type: Date })
  createdAt: Date;

  @ApiPropertyOptional({
    description: '작성자. 관계를 로드하지 않은 경우 키가 생성되지 않는다.',
    type: () => PinAuthorResponse,
  })
  user?: PinAuthorResponse;

  static from(pin: Pin): RestaurantPinResponse {
    return {
      id: pin.id,
      userId: pin.userId,
      restaurantId: pin.restaurantId,
      rating: pin.rating,
      memo: pin.memo,
      createdAt: pin.createdAt,
      ...(pin.user
        ? {
            user: {
              id: pin.user.id,
              nickname: pin.user.nickname,
              profileImage: pin.user.profileImage,
            },
          }
        : {}),
    };
  }

  static fromList(pins: Pin[]): RestaurantPinResponse[] {
    return pins.map((pin) => RestaurantPinResponse.from(pin));
  }
}
