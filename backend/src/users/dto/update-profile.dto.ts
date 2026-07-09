// 프로필 수정 요청 DTO — 모든 필드 선택적
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
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  // null이면 기본 프로필로 되돌림 (IsOptional은 null/undefined 모두 검증을 건너뛴다)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profileImage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsIn([...GENDERS])
  gender?: Gender;

  @IsOptional()
  @IsArray()
  @IsIn([...FOOD_CATEGORIES], { each: true })
  favoriteCategories?: FoodCategory[];
}
