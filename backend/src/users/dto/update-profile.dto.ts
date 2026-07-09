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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  profileImage?: string;

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
