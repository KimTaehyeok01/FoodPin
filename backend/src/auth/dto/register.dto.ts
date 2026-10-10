// 일반 회원가입 요청 DTO
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: '이메일 (로그인 ID)',
    example: 'hong@foodpin.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호 (8~30자)', example: 'foodpin1234' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(30)
  password: string;

  @ApiProperty({ description: '이름 (최대 50자)', example: '홍길동' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '닉네임 (최대 50자)', example: '길동이' })
  @IsString()
  @MaxLength(50)
  nickname: string;

  @ApiProperty({
    description: '주소 (최대 255자)',
    example: '서울특별시 강남구 테헤란로 1',
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({ description: '나이 (1~120)', example: 28 })
  @IsInt()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ description: '성별', enum: [...GENDERS], example: 'male' })
  @IsIn([...GENDERS])
  gender: Gender;

  @ApiPropertyOptional({
    description: '선호 음식 카테고리 (선택)',
    enum: [...FOOD_CATEGORIES],
    isArray: true,
    example: ['한식', '일식'],
  })
  @IsOptional()
  @IsArray()
  @IsIn([...FOOD_CATEGORIES], { each: true })
  favoriteCategories?: FoodCategory[];
}
