// 식당 등록 요청 DTO
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    description: '식당 이름 (최대 100자)',
    example: '성남 정자동 순대국',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '위도', example: 37.367 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '경도', example: 127.108 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({
    description: '주소 (최대 255자)',
    example: '경기 성남시 분당구 정자일로 121',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: '대표 사진 URL (최대 500자)',
    example: '/uploads/1710000000000-123456789.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({
    description: '음식 카테고리 (최대 50자)',
    example: '한식',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
