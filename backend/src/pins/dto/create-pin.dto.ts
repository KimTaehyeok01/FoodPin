// 핀 등록 요청 DTO — 별점은 필수, 메모는 선택
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePinDto {
  @ApiProperty({
    description: '별점 (1~5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: '메모. 생략하면 응답에 memo 키가 생성되지 않는다.',
    example: '국물이 진하고 반찬이 깔끔하다',
  })
  @IsOptional()
  @IsString()
  memo?: string;
}
