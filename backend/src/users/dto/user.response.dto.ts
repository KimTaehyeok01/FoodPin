// 유저 도메인의 응답 계약을 고정하는 Response DTO
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

/** 내 프로필 조회·수정 응답. password 등 민감 정보는 담지 않는다. */
export class UserProfileResponse {
  @ApiProperty({ description: '유저 ID', example: 1 })
  id: number;

  @ApiProperty({
    description: "가입 경로. 일반 가입은 null, 소셜 가입은 'kakao'·'naver'.",
    example: 'kakao',
    type: String,
    nullable: true,
  })
  provider: string | null;

  @ApiProperty({
    description: '이메일. 소셜 가입 계정은 null이다.',
    example: 'hong@foodpin.com',
    type: String,
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
    type: String,
    nullable: true,
  })
  name: string | null;

  @ApiProperty({ description: '닉네임', example: '길동이' })
  nickname: string;

  @ApiProperty({
    description:
      '프로필 이미지 경로. 미설정 시 null이며 기본 프로필로 표시된다.',
    example: '/uploads/1710000000000-123456789.jpg',
    type: String,
    nullable: true,
  })
  profileImage: string | null;

  @ApiProperty({
    description: '주소',
    example: '서울특별시 강남구 테헤란로 1',
    type: String,
    nullable: true,
  })
  address: string | null;

  @ApiProperty({
    description: '나이 (1~120)',
    example: 28,
    type: Number,
    nullable: true,
  })
  age: number | null;

  @ApiProperty({
    description: '성별',
    example: 'male',
    type: String,
    nullable: true,
  })
  gender: string | null;

  @ApiProperty({
    description: '가입 일시',
    example: '2026-01-15T09:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: '선호 음식 카테고리 이름 배열. 미선택 시 빈 배열.',
    example: ['한식', '일식'],
    type: [String],
  })
  favoriteCategories: string[];

  // 관계 엔티티(UserFavoriteCategory[])가 아니라 카테고리 이름 배열을 받는다.
  // 값 보정(?? null 등)을 넣지 않는다 — 없던 키가 생기면 응답 계약이 깨진다.
  static from(user: User, categories: string[]): UserProfileResponse {
    return {
      id: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileImage: user.profileImage,
      address: user.address,
      age: user.age,
      gender: user.gender,
      createdAt: user.createdAt,
      favoriteCategories: categories,
    };
  }
}
