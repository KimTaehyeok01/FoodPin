// 관리자 화면 전용 응답 계약을 고정하는 Response DTO 모음
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { Pin } from '../../pins/pin.entity';
import { Inquiry, InquiryStatus } from '../../inquiries/inquiry.entity';

/** 대시보드 상단 집계. */
export class AdminStatsResponse {
  @ApiProperty({ description: '전체 회원 수', example: 128 })
  userCount: number;

  @ApiProperty({ description: '전체 식당 수', example: 172 })
  restaurantCount: number;

  @ApiProperty({ description: '미답변 문의 수', example: 3 })
  pendingInquiryCount: number;
}

/**
 * 회원 목록 항목.
 *
 * 주의. 서비스의 USER_LIST_SELECT가 뽑는 7개 필드만 담는다 —
 * name·profileImage·address 등을 추가하면 없던 키가 생겨 계약이 깨진다.
 */
export class AdminUserResponse {
  @ApiProperty({ description: '유저 ID', example: 3 })
  id: number;

  @ApiProperty({
    description: '소셜 제공자. 일반 가입은 null이다.',
    example: 'kakao',
    type: String,
    nullable: true,
  })
  provider: string | null;

  @ApiProperty({
    description: '이메일. 소셜 가입은 null일 수 있다.',
    example: 'hong@example.com',
    type: String,
    nullable: true,
  })
  email: string | null;

  @ApiProperty({ description: '닉네임', example: '길동이' })
  nickname: string;

  @ApiProperty({ description: '권한', example: 'user' })
  role: string;

  @ApiProperty({ description: '정지 여부', example: false })
  isBanned: boolean;

  @ApiProperty({ description: '가입 일시', type: Date })
  createdAt: Date;

  // 값을 가공하지 않고 그대로 대입만 한다 (타입 변환·기본값 보정 금지).
  static from(user: User): AdminUserResponse {
    return {
      id: user.id,
      provider: user.provider,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };
  }

  static fromList(users: User[]): AdminUserResponse[] {
    return users.map((user) => AdminUserResponse.from(user));
  }
}

/** 리뷰 목록에 중첩되는 작성자. */
export class AdminPinAuthorResponse {
  @ApiProperty({ description: '유저 ID', example: 3 })
  id: number;

  @ApiProperty({ description: '닉네임', example: '길동이' })
  nickname: string;
}

/** 리뷰 목록에 중첩되는 식당. */
export class AdminPinRestaurantResponse {
  @ApiProperty({ description: '식당 ID', example: 111 })
  id: number;

  @ApiProperty({ description: '식당 이름', example: '성남 정자동 순대국' })
  name: string;
}

/**
 * 리뷰(핀) 목록 항목.
 *
 * 주의. 서비스의 select가 userId·restaurantId·updatedAt을 제외하므로 이 응답에는 그 키가 없다.
 * PinResponse를 재사용하면 없던 키가 생겨 계약이 깨진다.
 */
export class AdminPinResponse {
  @ApiProperty({ description: '핀 ID', example: 42 })
  id: number;

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
    type: () => AdminPinAuthorResponse,
  })
  user?: AdminPinAuthorResponse;

  @ApiPropertyOptional({
    description: '대상 식당. 관계를 로드하지 않은 경우 키가 생성되지 않는다.',
    type: () => AdminPinRestaurantResponse,
  })
  restaurant?: AdminPinRestaurantResponse;

  static from(pin: Pin): AdminPinResponse {
    return {
      id: pin.id,
      rating: pin.rating,
      memo: pin.memo,
      createdAt: pin.createdAt,
      ...(pin.user
        ? { user: { id: pin.user.id, nickname: pin.user.nickname } }
        : {}),
      ...(pin.restaurant
        ? { restaurant: { id: pin.restaurant.id, name: pin.restaurant.name } }
        : {}),
    };
  }

  static fromList(pins: Pin[]): AdminPinResponse[] {
    return pins.map((pin) => AdminPinResponse.from(pin));
  }
}

/** 문의 목록에 중첩되는 작성자. */
export class AdminInquiryUserResponse {
  @ApiProperty({ description: '유저 ID', example: 3 })
  id: number;

  @ApiProperty({ description: '닉네임', example: '길동이' })
  nickname: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
    type: String,
    nullable: true,
  })
  email: string | null;
}

/**
 * 문의 목록 항목.
 *
 * 주의. 서비스의 select가 userId를 제외하고 user 관계를 싣는다 —
 * 유저 문의 목록(InquiryResponse)과 키 집합이 달라 별도 DTO로 둔다.
 */
export class AdminInquiryListResponse {
  @ApiProperty({ description: '문의 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '문의 제목', example: '핀이 지도에 안 보여요' })
  title: string;

  @ApiProperty({ description: '문의 내용', example: '어제 등록한 핀이...' })
  content: string;

  @ApiProperty({
    description: '처리 상태',
    example: 'pending',
    enum: ['pending', 'answered'],
  })
  status: InquiryStatus;

  @ApiProperty({
    description: '관리자 답변',
    example: null,
    type: String,
    nullable: true,
  })
  answer: string | null;

  @ApiProperty({ description: '답변 일시', type: Date, nullable: true })
  answeredAt: Date | null;

  @ApiProperty({ description: '등록 일시', type: Date })
  createdAt: Date;

  @ApiPropertyOptional({
    description: '작성자. 관계를 로드하지 않은 경우 키가 생성되지 않는다.',
    type: () => AdminInquiryUserResponse,
  })
  user?: AdminInquiryUserResponse;

  static from(inquiry: Inquiry): AdminInquiryListResponse {
    return {
      id: inquiry.id,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      answer: inquiry.answer,
      answeredAt: inquiry.answeredAt,
      createdAt: inquiry.createdAt,
      ...(inquiry.user
        ? {
            user: {
              id: inquiry.user.id,
              nickname: inquiry.user.nickname,
              email: inquiry.user.email,
            },
          }
        : {}),
    };
  }

  static fromList(inquiries: Inquiry[]): AdminInquiryListResponse[] {
    return inquiries.map((inquiry) => AdminInquiryListResponse.from(inquiry));
  }
}
