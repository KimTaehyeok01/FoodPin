import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';
import { FOOD_CATEGORIES, FoodCategory } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(30)
  password: string;

  @IsString()
  @MaxLength(50)
  nickname: string;

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
  @IsArray()
  @IsIn([...FOOD_CATEGORIES], { each: true })
  favoriteCategories?: FoodCategory[];
}
