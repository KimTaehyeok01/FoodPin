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
import { GENDERS, Gender } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(30)
  password: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(50)
  nickname: string;

  @IsString()
  @MaxLength(255)
  address: string;

  @IsInt()
  @Min(1)
  @Max(120)
  age: number;

  @IsIn([...GENDERS])
  gender: Gender;

  @IsOptional()
  @IsArray()
  @IsIn([...FOOD_CATEGORIES], { each: true })
  favoriteCategories?: FoodCategory[];
}
