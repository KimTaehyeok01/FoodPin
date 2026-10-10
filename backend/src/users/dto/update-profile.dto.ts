// 프로필 수정 요청 DTO — 모든 필드 선택적
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FOOD_CATEGORIES, FoodCategory } from '../user.entity';
import { GENDERS, Gender } from '../user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '이름 (최대 50자)', example: '홍길동' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '닉네임 (최대 50자)', example: '길동이' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description:
      '프로필 이미지 경로 (최대 255자). null이면 기본 프로필로 되돌린다.',
    example: '/uploads/1710000000000-123456789.jpg',
    type: String,
    nullable: true,
  })
  // null이면 기본 프로필로 되돌림 (IsOptional은 null/undefined 모두 검증을 건너뛴다)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profileImage?: string | null;

  @ApiPropertyOptional({
    description: '주소 (최대 255자)',
    example: '서울특별시 강남구 테헤란로 1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: '나이 (1~120)', example: 28 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    description: '성별',
    enum: [...GENDERS],
    example: 'male',
  })
  @IsOptional()
  @IsIn([...GENDERS])
  gender?: Gender;

  @ApiPropertyOptional({
    description:
      '선호 음식 카테고리. 미지정이면 기존 값 유지, 빈 배열이면 전량 삭제.',
    enum: [...FOOD_CATEGORIES],
    isArray: true,
    example: ['한식', '일식'],
  })
  @IsOptional()
  @IsArray()
  @IsIn([...FOOD_CATEGORIES], { each: true })
  favoriteCategories?: FoodCategory[];
}
